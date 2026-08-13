#!/usr/bin/env python3
"""Run a bounded, uncached live recheck of the published OpenAIRE snapshot.

This does not recompute the 645-record census. It verifies the eight discovery
query counts, the featured DOI and grant link, the page-0 Scholix contract, and
the Q-NEKO timeline using 23 public API requests, below OpenAIRE's documented
60 requests/hour unauthenticated ceiling. A bearer token is optional.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://api.openaire.eu/graph"
USER_AGENT = "OpenQuantumEvidenceAtlas/1.1-live-recheck"
ACCESS_TOKEN = os.environ.get("OPENAIRE_ACCESS_TOKEN", "").strip()
REQUEST_COUNT = 0
UNAUTHENTICATED_REQUEST_LIMIT = 60
FEATURED_DOI = "10.1088/1367-2630/ad5b13"
FEATURED_ID = "doi_dedup___::82d8842e25b2e9bdbe03ab4c5db972db"
FEATURED_GRANT = "101102140"
Q_NEKO_GRANT = "101241875"
SELF_PRODUCT_DOIS = {
    "10.5281/zenodo.21913413",
    "10.5281/zenodo.21913414",
    "10.5281/zenodo.21914776",
}
SELF_PRODUCT_TITLES = {"open quantum evidence atlas"}
ALIASES = [
    "Q-Neko",
    "QNEKO",
    "Nippon-Europe Quantum Koraborēshon",
    "HORIZON-EUROHPC-JU-2024-INCO-06",
]


def build_url(path: str, params: list[tuple[str, str | int]]) -> str:
    return f"{BASE}{path}?{urllib.parse.urlencode(params)}"


def get_json(url: str, retries: int = 4) -> dict:
    global REQUEST_COUNT
    for attempt in range(retries):
        try:
            if not ACCESS_TOKEN and REQUEST_COUNT >= UNAUTHENTICATED_REQUEST_LIMIT:
                raise RuntimeError(
                    "Bounded recheck stopped before exceeding OpenAIRE's 60 requests/hour unauthenticated limit."
                )
            headers = {"User-Agent": USER_AGENT, "Cache-Control": "no-cache"}
            if ACCESS_TOKEN:
                headers["Authorization"] = f"Bearer {ACCESS_TOKEN}"
            REQUEST_COUNT += 1
            request = urllib.request.Request(
                url,
                headers=headers,
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


def q_neko_samples(payload: dict, kind: str) -> list[dict]:
    samples = []
    for row in (payload.get("results", []) or [])[:10]:
        sample = {
            "id": row.get("id"),
            "title": row.get("mainTitle") or row.get("title"),
        }
        if kind == "product":
            sample.update(
                {
                    "type": row.get("type"),
                    "publication_date": row.get("publicationDate"),
                    "pids": row.get("pids") or [],
                }
            )
        else:
            sample.update(
                {
                    "code": row.get("code"),
                    "acronym": row.get("acronym"),
                    "start_date": row.get("startDate"),
                    "end_date": row.get("endDate"),
                }
            )
        samples.append(sample)
    return samples


def product_dois(sample: dict) -> set[str]:
    return {
        str(pid.get("value", "")).strip().lower()
        for pid in sample.get("pids", [])
        if str(pid.get("scheme", "")).strip().lower() == "doi"
    }


def is_self_product(sample: dict) -> bool:
    title = str(sample.get("title") or "").strip().lower()
    return bool(product_dois(sample) & SELF_PRODUCT_DOIS) or title in SELF_PRODUCT_TITLES


def unique_sample_count(q_neko: dict, sample_key: str) -> int:
    return len(
        {
            sample.get("id")
            for item in q_neko.values()
            for sample in item.get(sample_key, [])
            if sample.get("id")
        }
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--metrics",
        type=Path,
        default=ROOT / "reproducibility" / "metrics.json",
        help="Published metrics baseline",
    )
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
        product_url = build_url("/v3/research-products", [("search", f'"{alias}"'), ("page", 1), ("pageSize", 10)])
        project_url = build_url("/v3/projects", [("search", alias), ("page", 1), ("pageSize", 3)])
        products = get_json(product_url)
        projects = get_json(project_url)
        raw_product_samples = q_neko_samples(products, "product")
        self_product_samples = [sample for sample in raw_product_samples if is_self_product(sample)]
        candidate_product_samples = [sample for sample in raw_product_samples if not is_self_product(sample)]
        raw_product_hits = int(products["header"]["numFound"])
        q_neko[alias] = {
            "products": max(raw_product_hits - len(self_product_samples), 0),
            "products_raw": raw_product_hits,
            "products_self_matches_returned": len(self_product_samples),
            "products_self_excluded": max(raw_product_hits - len(self_product_samples), 0),
            "projects": int(projects["header"]["numFound"]),
            "product_samples_raw": raw_product_samples,
            "product_samples_self": self_product_samples,
            "product_samples": candidate_product_samples,
            "project_samples": q_neko_samples(projects, "project"),
            "product_query_url": product_url,
            "project_query_url": project_url,
        }

    verified_url = build_url(
        "/v3/research-products",
        [("relProjectCode", Q_NEKO_GRANT), ("page", 1), ("pageSize", 10)],
    )
    verified_products = get_json(verified_url)
    verified_samples_raw = q_neko_samples(verified_products, "product")
    verified_samples = [sample for sample in verified_samples_raw if not is_self_product(sample)]
    verified_raw_hits = int(verified_products["header"]["numFound"])
    verified_self_hits = len(verified_samples_raw) - len(verified_samples)

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
        "request_policy": {
            "authenticated": bool(ACCESS_TOKEN),
            "requests_made": REQUEST_COUNT,
            "unauthenticated_limit_per_hour": UNAUTHENTICATED_REQUEST_LIMIT,
        },
        "q_neko_measurement_policy": {
            "raw_alias_hits": "All research-product hits returned by the four literal alias searches.",
            "self_excluded_candidates": "Raw alias hits after excluding this Atlas by its Zenodo DOI or exact title.",
            "verified_grant_outputs": f"Research products explicitly related to OpenAIRE project code {Q_NEKO_GRANT}; alias similarity alone is insufficient.",
            "self_product_dois": sorted(SELF_PRODUCT_DOIS),
        },
        "summary": {
            "checks_passed": sum(checks.values()),
            "checks_total": len(checks),
            "term_queries_changed": sum(item["delta"] != 0 for item in term_results.values()),
            "q_neko_project_hits": sum(item["projects"] for item in q_neko.values()),
            "q_neko_product_hits": sum(item["products_self_excluded"] for item in q_neko.values()),
            "q_neko_product_hits_raw": sum(item["products_raw"] for item in q_neko.values()),
            "q_neko_product_hits_self_excluded": sum(item["products_self_excluded"] for item in q_neko.values()),
            "q_neko_self_product_hits": sum(item["products_self_matches_returned"] for item in q_neko.values()),
            "q_neko_verified_grant_output_hits": max(verified_raw_hits - verified_self_hits, 0),
            "q_neko_unique_project_records_sampled": unique_sample_count(q_neko, "project_samples"),
            "q_neko_unique_product_records_sampled": unique_sample_count(q_neko, "product_samples"),
            "q_neko_unique_product_records_sampled_raw": unique_sample_count(q_neko, "product_samples_raw"),
        },
        "checks": checks,
        "term_query_counts": term_results,
        "featured_record": {"doi": FEATURED_DOI, "expected_id": FEATURED_ID, "returned_ids": featured_ids, "doi_query_url": featured_url, "grant": FEATURED_GRANT, "grant_match_count": int(grant["header"]["numFound"]), "grant_query_url": grant_url},
        "link_page_contract": link_contract,
        "q_neko": q_neko,
        "q_neko_verified_grant_outputs": {
            "project_code": Q_NEKO_GRANT,
            "raw_hits": verified_raw_hits,
            "self_matches_returned": verified_self_hits,
            "verified_hits": max(verified_raw_hits - verified_self_hits, 0),
            "samples": verified_samples,
            "query_url": verified_url,
        },
    }
    outputs = args.output or [Path("live_recheck.json")]
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    for output in outputs:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding="utf-8")
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
