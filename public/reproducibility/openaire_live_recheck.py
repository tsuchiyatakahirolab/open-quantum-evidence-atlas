#!/usr/bin/env python3
"""Run a bounded, uncached live recheck of the published OpenAIRE snapshot.

This does not recompute the 645-record census. It verifies the eight discovery
query counts, the featured DOI and grant link, the page-0 Scholix contract, and
the Q-NEKO watchlist using a small fixed number of public API requests.
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://api.openaire.eu/graph"
USER_AGENT = "OpenQuantumEvidenceAtlas/1.1-live-recheck"
FEATURED_DOI = "10.1088/1367-2630/ad5b13"
FEATURED_ID = "doi_dedup___::82d8842e25b2e9bdbe03ab4c5db972db"
FEATURED_GRANT = "101102140"
ALIASES = [
    "Q-Neko",
    "QNEKO",
    "Nippon-Europe Quantum Koraborēshon",
    "HORIZON-EUROHPC-JU-2024-INCO-06",
]


def build_url(path: str, params: list[tuple[str, str | int]]) -> str:
    return f"{BASE}{path}?{urllib.parse.urlencode(params)}"


def get_json(url: str, retries: int = 4) -> dict:
    for attempt in range(retries):
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": USER_AGENT, "Cache-Control": "no-cache"},
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"Live recheck failed: {url}") from exc
            time.sleep(1.5 * (attempt + 1))
    raise AssertionError("unreachable")


def row_count(payload: dict) -> int:
    return len(payload.get("results", payload.get("links", [])) or [])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--metrics", type=Path, required=True, help="Published metrics baseline")
    parser.add_argument("--output", type=Path, action="append")
    args = parser.parse_args()

    baseline = json.loads(args.metrics.read_text(encoding="utf-8"))
    term_results = {}
    for term in baseline["scope"]["terms"]:
        url = build_url(
            "/v3/research-products",
            [
                ("search", f'"{term}"'),
                ("countryCode", "JP"),
                ("type", "publication"),
                ("fromPublicationYear", baseline["scope"]["from_year"]),
                ("toPublicationYear", baseline["scope"]["to_year"]),
                ("page", 1),
                ("pageSize", 1),
            ],
        )
        current = int(get_json(url)["header"]["numFound"])
        snapshot = int(baseline["query_counts_by_term_before_deduplication"][term])
        term_results[term] = {"snapshot": snapshot, "current": current, "delta": current - snapshot, "query_url": url}

    featured_url = build_url("/v3/research-products", [("search", f'"{FEATURED_DOI}"'), ("page", 1), ("pageSize", 10)])
    featured = get_json(featured_url)
    featured_rows = featured.get("results", []) or []
    featured_ids = [row.get("id") for row in featured_rows]
    grant_url = build_url("/v3/research-products", [("search", f'"{FEATURED_DOI}"'), ("relProjectCode", FEATURED_GRANT), ("page", 1), ("pageSize", 10)])
    grant = get_json(grant_url)

    link_contract = {}
    pid = f"50|{FEATURED_ID}"
    for target_type in ("dataset", "software"):
        pages = {}
        for page in (0, 1):
            url = build_url("/v1/researchProducts/links", [("sourcePid", pid), ("targetType", target_type), ("page", page), ("size", 10)])
            payload = get_json(url)
            pages[str(page)] = {"total": int(payload.get("header", {}).get("totalLinks", 0) or 0), "rows": row_count(payload), "query_url": url}
        link_contract[target_type] = pages

    q_neko = {}
    for alias in ALIASES:
        product_url = build_url("/v3/research-products", [("search", f'"{alias}"'), ("page", 1), ("pageSize", 1)])
        project_url = build_url("/v3/projects", [("search", alias), ("page", 1), ("pageSize", 1)])
        q_neko[alias] = {
            "products": int(get_json(product_url)["header"]["numFound"]),
            "projects": int(get_json(project_url)["header"]["numFound"]),
            "product_query_url": product_url,
            "project_query_url": project_url,
        }

    checks = {
        "featured_doi_resolves": FEATURED_ID in featured_ids,
        "featured_grant_resolves": int(grant["header"]["numFound"]) >= 1,
        "dataset_page_zero_returns_rows": link_contract["dataset"]["0"]["rows"] >= 1,
        "software_page_zero_returns_rows": link_contract["software"]["0"]["rows"] >= 1,
        "page_one_still_skips_dataset": link_contract["dataset"]["1"]["total"] > 0 and link_contract["dataset"]["1"]["rows"] == 0,
        "page_one_still_skips_software": link_contract["software"]["1"]["total"] > 0 and link_contract["software"]["1"]["rows"] == 0,
    }
    result = {
        "schema_version": 1,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "snapshot_as_of": baseline["as_of"],
        "scope": "Bounded live integrity recheck; not a recomputation of the 645-record census",
        "summary": {
            "checks_passed": sum(checks.values()),
            "checks_total": len(checks),
            "term_queries_changed": sum(item["delta"] != 0 for item in term_results.values()),
            "q_neko_project_hits": sum(item["projects"] for item in q_neko.values()),
            "q_neko_product_hits": sum(item["products"] for item in q_neko.values()),
        },
        "checks": checks,
        "term_query_counts": term_results,
        "featured_record": {"doi": FEATURED_DOI, "expected_id": FEATURED_ID, "returned_ids": featured_ids, "doi_query_url": featured_url, "grant": FEATURED_GRANT, "grant_match_count": int(grant["header"]["numFound"]), "grant_query_url": grant_url},
        "link_page_contract": link_contract,
        "q_neko": q_neko,
    }
    outputs = args.output or [Path("live_recheck.json")]
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    for output in outputs:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding="utf-8")
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
