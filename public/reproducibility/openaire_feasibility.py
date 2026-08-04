#!/usr/bin/env python3
"""Measure OpenAIRE relationship coverage for an EU27-Japan quantum corpus.

The script uses the stable OpenAIRE Graph V3 search API for product/project
metadata and the V1 Scholix links endpoint for result-to-result relations.
Responses are cached inside a date-stamped run directory so a run on a new day
retrieves the current public graph. Set OPENAIRE_CACHE_DIR to an earlier cache
only when intentionally replaying a historical snapshot.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import os
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "analysis" / "output"
DEFAULT_CACHE = OUT / "cache-runs" / time.strftime("%Y-%m-%d", time.gmtime())
CACHE = Path(os.environ.get("OPENAIRE_CACHE_DIR", str(DEFAULT_CACHE))).resolve()
OUT.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)
USED_CACHE_MTIMES: list[float] = []
PROGRESS_LOCK = Lock()
DOWNLOADED_COUNT = 0

BASE = "https://api.openaire.eu/graph"
USER_AGENT = "OpenQuantumEvidenceAtlas/0.1 (public feasibility study)"
FROM_YEAR = 2020
TO_YEAR = 2026
TERMS = [
    "quantum computing",
    "quantum communication",
    "quantum sensing",
    "quantum simulation",
    "quantum cryptography",
    "quantum information",
    "quantum metrology",
    "quantum network",
]
EU27 = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE",
}
EUROPE_EXTENDED = EU27 | {"GB", "CH", "NO", "IS", "LI"}
# Audit every observed EU27-Japan publication. Set this to an integer only for
# bounded development runs; published metrics must use the full corpus.
LINK_AUDIT_LIMIT: int | None = None


def cache_key(url: str) -> Path:
    return CACHE / f"{hashlib.sha256(url.encode()).hexdigest()}.json"


def get_json(url: str, retries: int = 4) -> dict:
    global DOWNLOADED_COUNT
    path = cache_key(url)
    if path.exists():
        USED_CACHE_MTIMES.append(path.stat().st_mtime)
        return json.loads(path.read_text(encoding="utf-8"))
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
            path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
            USED_CACHE_MTIMES.append(path.stat().st_mtime)
            with PROGRESS_LOCK:
                DOWNLOADED_COUNT += 1
                if DOWNLOADED_COUNT % 100 == 0:
                    print(f"Downloaded {DOWNLOADED_COUNT} new API responses into {CACHE}", flush=True)
            return payload
        except urllib.error.HTTPError as exc:
            if 400 <= exc.code < 500 and exc.code != 429:
                raise RuntimeError(f"GET rejected with HTTP {exc.code}: {url}") from exc
            if attempt == retries - 1:
                raise RuntimeError(f"GET failed after {retries} attempts: {url}") from exc
            time.sleep(min(10, 1.5 * (2**attempt)) + random.random())
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"GET failed after {retries} attempts: {url}") from exc
            time.sleep(min(10, 1.5 * (2**attempt)) + random.random())
    raise AssertionError("unreachable")


def build_url(path: str, params: list[tuple[str, str | int | bool]]) -> str:
    return f"{BASE}{path}?{urllib.parse.urlencode(params)}"


def fetch_term(term: str) -> tuple[int, list[dict]]:
    common = [
        ("search", f'"{term}"'),
        ("countryCode", "JP"),
        ("type", "publication"),
        ("fromPublicationYear", FROM_YEAR),
        ("toPublicationYear", TO_YEAR),
        ("pageSize", 100),
        ("sortBy", "publicationDate DESC"),
    ]
    first = get_json(build_url("/v3/research-products", common + [("page", 1)]))
    total = int(first["header"]["numFound"])
    results = list(first.get("results", []))
    pages = math.ceil(total / 100)
    for page in range(2, pages + 1):
        payload = get_json(build_url("/v3/research-products", common + [("page", page)]))
        results.extend(payload.get("results", []))
    return total, results


def fetch_organizations(ids: list[str]) -> dict[str, dict]:
    mapped: dict[str, dict] = {}
    # The V3 endpoint rejects long boolean expressions; five quoted ids is
    # below the observed clause/URL limit and remains efficient enough.
    batches = [ids[start : start + 5] for start in range(0, len(ids), 5)]

    def fetch_batch(batch: list[str]) -> dict:
        expression = " OR ".join(f'"{item}"' for item in batch)
        url = build_url("/v3/organizations", [("id", expression), ("pageSize", 100)])
        return get_json(url)

    with ThreadPoolExecutor(max_workers=6) as executor:
        payloads = list(executor.map(fetch_batch, batches))
    for payload in payloads:
        for org in payload.get("results", []):
            mapped[org["id"]] = {
                "name": org.get("legalName"),
                "country": (org.get("country") or {}).get("code"),
            }
    return mapped


def relation_flag(product: dict, target_type: str) -> dict:
    pid = f"50|{product['id']}"
    checks = {
        "outgoing": build_url(
            "/v1/researchProducts/links",
            [("sourcePid", pid), ("targetType", target_type), ("page", 0), ("size", 1)],
        ),
        "incoming": build_url(
            "/v1/researchProducts/links",
            [("targetPid", pid), ("sourceType", target_type), ("page", 0), ("size", 1)],
        ),
    }
    counts = {}
    for direction, url in checks.items():
        payload = get_json(url)
        counts[direction] = int(payload.get("header", {}).get("totalLinks", 0) or 0)
    return {
        "connected": (counts["outgoing"] + counts["incoming"]) > 0,
        **counts,
    }


def project_and_funding_flags(product: dict) -> tuple[bool, bool, int, int]:
    project_ids = {p.get("id") for p in (product.get("projects") or []) if p.get("id")}
    funders = set()
    project_links = 0
    for link in product.get("links") or []:
        header = link.get("header") or {}
        if header.get("relatedRecordType") == "project":
            project_links += 1
            funding = link.get("funding") or {}
            funder = funding.get("funder") or {}
            funder_key = funder.get("id") or funder.get("name")
            if funder_key:
                funders.add(funder_key)
    project_connected = bool(project_ids or project_links)
    funding_connected = bool(funders)
    return project_connected, funding_connected, len(project_ids), len(funders)


def wilson(successes: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total == 0:
        return 0.0, 0.0
    p = successes / total
    denom = 1 + z * z / total
    centre = (p + z * z / (2 * total)) / denom
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denom
    return max(0.0, centre - half), min(1.0, centre + half)


def q_neko_checks() -> dict:
    aliases = ["Q-Neko", "QNEKO", "Nippon-Europe Quantum Koraborēshon", "HORIZON-EUROHPC-JU-2024-INCO-06"]
    product_queries = {}
    project_queries = {}
    product_ids = set()
    project_ids = set()
    for alias in aliases:
        product_url = build_url(
            "/v3/research-products",
            [("search", f'"{alias}"'), ("page", 1), ("pageSize", 100), ("includeStats", "true")],
        )
        project_url = build_url("/v3/projects", [("search", alias), ("page", 1), ("pageSize", 100)])
        products = get_json(product_url)
        projects = get_json(project_url)
        product_queries[alias] = {"count": int(products["header"]["numFound"]), "url": product_url}
        project_queries[alias] = {"count": int(projects["header"]["numFound"]), "url": project_url}
        product_ids.update(row.get("id") for row in products.get("results", []) if row.get("id"))
        project_ids.update(row.get("id") for row in projects.get("results", []) if row.get("id"))
    return {
        "aliases": aliases,
        "research_products_union": len(product_ids),
        "projects_union": len(project_ids),
        "product_queries": product_queries,
        "project_queries": project_queries,
    }


def main() -> None:
    term_results: dict[str, int] = {}
    products_by_id: dict[str, dict] = {}
    matched_terms: dict[str, set[str]] = {}
    for term in TERMS:
        total, rows = fetch_term(term)
        term_results[term] = total
        for product in rows:
            products_by_id[product["id"]] = product
            matched_terms.setdefault(product["id"], set()).add(term)

    org_ids = sorted(
        {
            org["id"]
            for product in products_by_id.values()
            for org in (product.get("organizations") or [])
            if org.get("id", "").startswith("openorgs____::")
        }
    )
    org_map = fetch_organizations(org_ids)

    rows: list[dict] = []
    for product in products_by_id.values():
        product_org_ids = [o.get("id") for o in (product.get("organizations") or []) if o.get("id")]
        countries = sorted({org_map.get(org_id, {}).get("country") for org_id in product_org_ids} - {None})
        project_connected, funding_connected, project_count, funder_count = project_and_funding_flags(product)
        row = {
            "id": product["id"],
            "title": product.get("mainTitle"),
            "publication_date": product.get("publicationDate"),
            "doi": next((p.get("value") for p in (product.get("pids") or []) if p.get("scheme") == "doi"), None),
            "matched_terms": "; ".join(sorted(matched_terms[product["id"]])),
            "strict_title_match": any(term in (product.get("mainTitle") or "").lower() for term in TERMS),
            "organization_count": len(product_org_ids),
            "resolved_country_count": len(countries),
            "countries": ";".join(countries),
            "has_japan": "JP" in countries,
            "has_eu27": bool(set(countries) & EU27),
            "has_extended_europe": bool(set(countries) & EUROPE_EXTENDED),
            "project_connected": project_connected,
            "funding_connected": funding_connected,
            "project_count": project_count,
            "funder_count": funder_count,
            "publicly_funded_flag": bool(product.get("publiclyFunded")),
            "source_count": len(product.get("collectedFrom") or []),
        }
        rows.append(row)

    rows.sort(key=lambda row: (row["publication_date"] or "", row["id"]), reverse=True)
    observed = [row for row in rows if row["has_japan"] and row["has_eu27"]]
    extended = [row for row in rows if row["has_japan"] and row["has_extended_europe"]]
    ordered_audit_targets = sorted(observed, key=lambda row: hashlib.sha256(row["id"].encode()).hexdigest())
    broad_audit = ordered_audit_targets[:LINK_AUDIT_LIMIT] if LINK_AUDIT_LIMIT else ordered_audit_targets
    broad_audit_ids = {row["id"] for row in broad_audit}
    strict_observed = [row for row in observed if row["strict_title_match"]]
    audit_targets_by_id = {row["id"]: row for row in broad_audit}
    audit_targets_by_id.update({row["id"]: row for row in strict_observed})
    audit_targets = list(audit_targets_by_id.values())

    product_lookup = products_by_id
    link_rows: list[dict] = []

    def audit(row: dict) -> dict:
        product = product_lookup[row["id"]]
        dataset = relation_flag(product, "dataset")
        software = relation_flag(product, "software")
        return {
            "id": row["id"],
            "title": row["title"],
            "publication_date": row["publication_date"],
            "countries": row["countries"],
            "strict_title_match": row["strict_title_match"],
            # Retained for snapshot-schema compatibility. In the published
            # full-corpus run this is true for every observed record.
            "broad_sample": row["id"] in broad_audit_ids,
            "dataset_connected": dataset["connected"],
            "dataset_outgoing_links": dataset["outgoing"],
            "dataset_incoming_links": dataset["incoming"],
            "software_connected": software["connected"],
            "software_outgoing_links": software["outgoing"],
            "software_incoming_links": software["incoming"],
        }

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(audit, row): row["id"] for row in audit_targets}
        for future in as_completed(futures):
            link_rows.append(future.result())
    link_rows.sort(key=lambda row: row["id"])

    def count_flag(items: list[dict], field: str) -> int:
        return sum(bool(item[field]) for item in items)

    n = len(observed)
    broad_link_rows = [row for row in link_rows if row["id"] in broad_audit_ids]
    strict_link_rows = [row for row in link_rows if row["strict_title_match"]]
    link_n = len(broad_link_rows)
    dataset_count = count_flag(broad_link_rows, "dataset_connected")
    software_count = count_flag(broad_link_rows, "software_connected")
    strict_n = len(strict_observed)
    strict_dataset_count = count_flag(strict_link_rows, "dataset_connected")
    strict_software_count = count_flag(strict_link_rows, "software_connected")
    observed_unique_ids = len({row["id"] for row in observed})
    link_unique_ids = len({row["id"] for row in link_rows})
    if LINK_AUDIT_LIMIT is None and link_n != n:
        raise RuntimeError(f"Full Scholix audit incomplete: {link_n} audited records for {n} observed records")
    if observed_unique_ids != n or link_unique_ids != len(link_rows):
        raise RuntimeError("Duplicate identifiers detected in the observed corpus or Scholix audit")
    if len(strict_link_rows) != strict_n:
        raise RuntimeError(
            f"Strict-title Scholix audit incomplete: {len(strict_link_rows)} audited records for {strict_n} records"
        )
    generated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    retrieval_from = min(USED_CACHE_MTIMES) if USED_CACHE_MTIMES else time.time()
    retrieval_to = max(USED_CACHE_MTIMES) if USED_CACHE_MTIMES else retrieval_from

    def iso_utc(timestamp: float) -> str:
        return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(timestamp))

    metrics = {
        "as_of": iso_utc(retrieval_to),
        "generated_at": generated_at,
        "source_retrieval_window": {
            "from": iso_utc(retrieval_from),
            "to": iso_utc(retrieval_to),
            "cache_directory": str(CACHE.relative_to(ROOT)) if CACHE.is_relative_to(ROOT) else str(CACHE),
        },
        "scope": {
            "from_year": FROM_YEAR,
            "to_year": TO_YEAR,
            "terms": TERMS,
            "population": "OpenAIRE publication records matching >=1 exact taxonomy phrase, with resolved affiliations in Japan and EU27",
            "relationship_definition": "At least one explicit OpenAIRE graph relation to the named entity type; dataset/software checks include incoming and outgoing Scholix links",
            "link_audit_population": "All observed EU27-Japan publications",
        },
        "query_counts_by_term_before_deduplication": term_results,
        "japan_query_union": len(rows),
        "organization_ids": len(org_ids),
        "organization_ids_resolved": len(org_map),
        "eu27_japan_observed_publications": n,
        "eu27_japan_strict_title_publications": strict_n,
        "extended_europe_japan_sensitivity": len(extended),
        "rates": {
            "project": {
                "numerator": count_flag(observed, "project_connected"),
                "denominator": n,
            },
            "funding": {
                "numerator": count_flag(observed, "funding_connected"),
                "denominator": n,
            },
            "dataset": {
                "numerator": dataset_count,
                "denominator": link_n,
                "wilson95": wilson(dataset_count, link_n),
                "sampled": link_n < n,
            },
            "software": {
                "numerator": software_count,
                "denominator": link_n,
                "wilson95": wilson(software_count, link_n),
                "sampled": link_n < n,
            },
        },
        "strict_title_sensitivity": {
            "definition": "EU27-Japan observed publications whose title literally contains at least one taxonomy phrase",
            "project": {
                "numerator": count_flag(strict_observed, "project_connected"),
                "denominator": strict_n,
            },
            "funding": {
                "numerator": count_flag(strict_observed, "funding_connected"),
                "denominator": strict_n,
            },
            "dataset": {
                "numerator": strict_dataset_count,
                "denominator": len(strict_link_rows),
                "wilson95": wilson(strict_dataset_count, len(strict_link_rows)),
            },
            "software": {
                "numerator": strict_software_count,
                "denominator": len(strict_link_rows),
                "wilson95": wilson(strict_software_count, len(strict_link_rows)),
            },
        },
        "quality_checks": {
            "observed_duplicate_ids": n - observed_unique_ids,
            "scholix_records_audited": link_n,
            "scholix_missing_records": n - link_n,
            "scholix_duplicate_ids": len(link_rows) - link_unique_ids,
            "publiclyFunded_true": count_flag(observed, "publicly_funded_flag"),
            "project_link_but_publiclyFunded_false": sum(
                row["project_connected"] and not row["publicly_funded_flag"] for row in observed
            ),
            "records_with_no_resolved_country": sum(row["resolved_country_count"] == 0 for row in rows),
            "records_with_no_organization": sum(row["organization_count"] == 0 for row in rows),
        },
        "q_neko": q_neko_checks(),
        "source_urls": {
            "graph_api": "https://api.openaire.eu/graph/v3/research-products",
            "scholix_links": "https://api.openaire.eu/graph/v1/researchProducts/links",
            "relationships_docs": "https://graph.openaire.eu/docs/data-model/relationships/",
            "api_docs": "https://graph.openaire.eu/docs/apis/graph-api/research-products/",
        },
    }
    for metric in metrics["rates"].values():
        metric["rate"] = metric["numerator"] / metric["denominator"] if metric["denominator"] else 0.0
    for metric in metrics["strict_title_sensitivity"].values():
        if isinstance(metric, dict) and "numerator" in metric:
            metric["rate"] = metric["numerator"] / metric["denominator"] if metric["denominator"] else 0.0

    with (OUT / "broad_corpus.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()) if rows else [])
        writer.writeheader()
        writer.writerows(rows)
    with (OUT / "eu27_japan_corpus.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(observed[0].keys()) if observed else [])
        writer.writeheader()
        writer.writerows(observed)
    with (OUT / "scholix_link_audit.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(link_rows[0].keys()) if link_rows else [])
        writer.writeheader()
        writer.writerows(link_rows)
    (OUT / "metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metrics, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
