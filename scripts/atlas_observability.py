#!/usr/bin/env python3
"""Run non-publishing OpenAIRE observations for the Atlas.

The bounded lane performs the public 23-request integrity recheck. The full
lane runs the authenticated census into an isolated run directory. Both lanes
classify drift and emit a review bundle; neither mutates the published Atlas.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BASELINE_PATH = ROOT / "public" / "reproducibility" / "metrics.json"
MONITOR_BASELINE_PATH = ROOT / "public" / "reproducibility" / "live-recheck.json"
BOUNDED_SCRIPT = ROOT / "public" / "reproducibility" / "openaire_live_recheck.py"
FULL_SCRIPT = ROOT / "public" / "reproducibility" / "openaire_feasibility.py"
STATUSES = ("GREEN", "REVIEW_REQUIRED", "CRITICAL")
STATUS_RANK = {status: rank for rank, status in enumerate(STATUSES)}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def add_reason(
    state: dict[str, Any], status: str, code: str, message: str, details: Any = None
) -> None:
    if STATUS_RANK[status] > STATUS_RANK[state["status"]]:
        state["status"] = status
    reason = {"status": status, "code": code, "message": message}
    if details is not None:
        reason["details"] = details
    state["reasons"].append(reason)


def baseline_q_neko_totals(baseline: dict[str, Any]) -> dict[str, int]:
    summary = baseline.get("summary", {})
    if "q_neko_project_hits" in summary or "q_neko_product_hits" in summary:
        products = int(summary.get("q_neko_product_hits_self_excluded", summary.get("q_neko_product_hits", 0)))
        return {
            "projects": int(summary.get("q_neko_project_hits", 0)),
            "products_self_excluded": products,
            "products_raw": int(summary.get("q_neko_product_hits_raw", products)),
            "self_products": int(summary.get("q_neko_self_product_hits", 0)),
            "verified_grant_outputs": int(summary.get("q_neko_verified_grant_output_hits", 0)),
        }
    q_neko = baseline.get("q_neko", {})
    return {
        "projects": sum(
            int(item.get("count", 0))
            for item in q_neko.get("project_queries", {}).values()
        ),
        "products_self_excluded": sum(
            int(item.get("count", 0))
            for item in q_neko.get("product_queries", {}).values()
        ),
        "products_raw": sum(
            int(item.get("count", 0))
            for item in q_neko.get("product_queries", {}).values()
        ),
        "self_products": 0,
        "verified_grant_outputs": 0,
    }


def bounded_term_counts(payload: dict[str, Any]) -> dict[str, int]:
    live_counts = payload.get("term_query_counts", {})
    if live_counts:
        return {
            term: int(values.get("current", values.get("snapshot", 0)))
            for term, values in live_counts.items()
        }
    return {
        term: int(value)
        for term, value in payload.get(
            "query_counts_by_term_before_deduplication", {}
        ).items()
    }


def bounded_link_contract(payload: dict[str, Any]) -> dict[str, Any]:
    contract = payload.get("link_page_contract", {})
    return {
        target: {
            page: {
                "total": int(values.get("total", 0)),
                "rows": int(values.get("rows", 0)),
            }
            for page, values in contract.get(target, {}).items()
            if page in ("0", "1")
        }
        for target in ("dataset", "software")
    }


def classify_bounded(
    result: dict[str, Any], baseline: dict[str, Any]
) -> dict[str, Any]:
    state: dict[str, Any] = {"status": "GREEN", "reasons": []}
    checks = result.get("checks", {})
    required_checks = ("featured_doi_resolves", "featured_grant_resolves")
    failed_required = [name for name in required_checks if not checks.get(name)]
    if failed_required:
        add_reason(
            state,
            "CRITICAL",
            "required_integrity_check_failed",
            "The featured record or grant lookup failed.",
            failed_required,
        )

    current_contract = bounded_link_contract(result)
    expected_contract = bounded_link_contract(baseline)
    if current_contract != expected_contract:
        add_reason(
            state,
            "REVIEW_REQUIRED",
            "scholix_page_contract_changed",
            "The featured Scholix page contract differs from the accepted monitoring baseline.",
            {"baseline": expected_contract, "current": current_contract},
        )

    current_terms = bounded_term_counts(result)
    expected_terms = bounded_term_counts(baseline)
    changed_terms = {
        term: {"baseline": expected_terms.get(term), "current": value}
        for term, value in current_terms.items()
        if value != expected_terms.get(term)
    }
    if changed_terms:
        add_reason(
            state,
            "REVIEW_REQUIRED",
            "discovery_counts_changed",
            "One or more discovery query totals differ from the accepted monitoring baseline.",
            changed_terms,
        )

    expected_q_neko = baseline_q_neko_totals(baseline)
    current_q_neko = baseline_q_neko_totals(result)
    if current_q_neko != expected_q_neko:
        add_reason(
            state,
            "REVIEW_REQUIRED",
            "q_neko_watchlist_changed",
            "The Q-NEKO watchlist differs from the published snapshot.",
            {"baseline": expected_q_neko, "current": current_q_neko},
        )

    policy = result.get("request_policy", {})
    if (
        not policy.get("authenticated")
        and int(policy.get("requests_made", 0))
        > int(policy.get("unauthenticated_limit_per_hour", 60))
    ):
        add_reason(
            state,
            "CRITICAL",
            "request_limit_exceeded",
            "The bounded lane exceeded the declared unauthenticated request limit.",
        )

    if not state["reasons"]:
        add_reason(
            state,
            "GREEN",
            "no_material_drift",
            "Required integrity checks passed and no monitored drift was detected.",
        )
    return state


def full_metric_snapshot(metrics: dict[str, Any]) -> dict[str, Any]:
    rates = metrics.get("rates", {})
    return {
        "as_of": metrics.get("as_of"),
        "observed_publications": metrics.get("eu27_japan_observed_publications"),
        "query_counts": metrics.get("query_counts_by_term_before_deduplication", {}),
        "rates": {
            name: {
                "numerator": value.get("numerator"),
                "denominator": value.get("denominator"),
                "rate": value.get("rate"),
            }
            for name, value in rates.items()
        },
        "q_neko": baseline_q_neko_totals(metrics),
        "quality_checks": metrics.get("quality_checks", {}),
    }


def classify_full(
    current: dict[str, Any], baseline: dict[str, Any]
) -> tuple[dict[str, Any], dict[str, Any]]:
    state: dict[str, Any] = {"status": "GREEN", "reasons": []}
    current_view = full_metric_snapshot(current)
    baseline_view = full_metric_snapshot(baseline)
    quality = current_view["quality_checks"]

    critical_quality = {
        key: quality.get(key)
        for key in (
            "observed_duplicate_ids",
            "scholix_missing_records",
            "scholix_duplicate_ids",
        )
        if int(quality.get(key, 0) or 0) != 0
    }
    if not int(current_view.get("observed_publications", 0) or 0):
        critical_quality["observed_publications"] = current_view.get(
            "observed_publications"
        )
    if critical_quality:
        add_reason(
            state,
            "CRITICAL",
            "full_census_quality_failed",
            "The full census failed a completeness or uniqueness invariant.",
            critical_quality,
        )

    changed: dict[str, Any] = {}
    for key in ("observed_publications", "query_counts", "rates", "q_neko"):
        if current_view[key] != baseline_view[key]:
            changed[key] = {
                "baseline": baseline_view[key],
                "current": current_view[key],
            }
    if changed:
        add_reason(
            state,
            "REVIEW_REQUIRED",
            "full_census_metrics_changed",
            "The fresh census differs from the published metrics and requires review.",
            sorted(changed),
        )
    if not state["reasons"]:
        add_reason(
            state,
            "GREEN",
            "full_census_matches",
            "The fresh census matches the published decision metrics.",
        )
    return state, {"baseline": baseline_view, "current": current_view, "changed": changed}


def write_review_bundle(
    path: Path, mode: str, classification: dict[str, Any], outputs: dict[str, str]
) -> None:
    lines = [
        "# Atlas observability review bundle",
        "",
        f"- Mode: `{mode}`",
        f"- Status: **{classification['status']}**",
        f"- Generated: {utc_now()}",
        "- Publication action: none; this bundle is observation-only",
        "",
        "## Findings",
        "",
    ]
    for reason in classification["reasons"]:
        lines.append(
            f"- **{reason['status']} · {reason['code']}** — {reason['message']}"
        )
        if "details" in reason:
            lines.append(
                f"  - Details: `{json.dumps(reason['details'], ensure_ascii=False, sort_keys=True)}`"
            )
    lines.extend(["", "## Run outputs", ""])
    for label, value in outputs.items():
        lines.append(f"- {label}: `{value}`")
    lines.extend(
        [
            "",
            "## Promotion gate",
            "",
            "A human reviewer must inspect the diff, rerun locally when needed, update the public snapshot and narrative together, and explicitly approve any commit or deployment.",
            "",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def run_command(command: list[str], env: dict[str, str] | None = None) -> None:
    subprocess.run(command, cwd=ROOT, env=env, check=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("bounded", "full"))
    parser.add_argument(
        "--run-root",
        type=Path,
        default=ROOT / ".tmp" / "atlas-observability" / time.strftime("%Y%m%dT%H%M%SZ", time.gmtime()),
    )
    parser.add_argument("--baseline", type=Path, default=BASELINE_PATH)
    parser.add_argument(
        "--monitor-baseline", type=Path, default=MONITOR_BASELINE_PATH
    )
    args = parser.parse_args()

    run_root = args.run_root.resolve()
    run_root.mkdir(parents=True, exist_ok=True)
    baseline = load_json(args.baseline)
    monitor_baseline: dict[str, Any] = {}
    outputs: dict[str, str] = {}

    try:
        if args.mode == "bounded":
            result_path = run_root / "live-recheck.json"
            run_command(
                [
                    sys.executable,
                    str(BOUNDED_SCRIPT),
                    "--metrics",
                    str(args.baseline),
                    "--output",
                    str(result_path),
                ]
            )
            monitor_baseline = load_json(args.monitor_baseline)
            classification = classify_bounded(load_json(result_path), monitor_baseline)
            outputs["live_recheck"] = result_path.name
        else:
            if not os.environ.get("OPENAIRE_ACCESS_TOKEN", "").strip():
                raise RuntimeError(
                    "Full census requires OPENAIRE_ACCESS_TOKEN; use bounded mode without credentials."
                )
            census_dir = run_root / "full-census"
            env = os.environ.copy()
            env["OPENAIRE_OUTPUT_DIR"] = str(census_dir)
            env["OPENAIRE_CACHE_DIR"] = str(run_root / "cache")
            run_command([sys.executable, str(FULL_SCRIPT)], env=env)
            current_path = census_dir / "metrics.json"
            classification, diff = classify_full(load_json(current_path), baseline)
            diff_path = run_root / "full-census-diff.json"
            diff_path.write_text(
                json.dumps(diff, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            outputs["full_census"] = str(current_path.relative_to(run_root))
            outputs["diff"] = diff_path.name
    except Exception as exc:  # Preserve a machine-readable failure bundle.
        classification = {
            "status": "CRITICAL",
            "reasons": [
                {
                    "status": "CRITICAL",
                    "code": "observation_failed",
                    "message": str(exc),
                }
            ],
        }

    manifest = {
        "schema_version": 1,
        "generated_at": utc_now(),
        "mode": args.mode,
        "baseline": {
            "as_of": baseline.get("as_of"),
            "path": "public/reproducibility/metrics.json",
        },
        "publication_action": "none",
        "classification": classification,
        "outputs": outputs,
    }
    if args.mode == "bounded":
        manifest["monitor_baseline"] = {
            "checked_at": monitor_baseline.get("checked_at"),
            "path": "public/reproducibility/live-recheck.json",
        }
    manifest_path = run_root / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_review_bundle(
        run_root / "review-bundle.md", args.mode, classification, outputs
    )
    print(json.dumps(manifest, ensure_ascii=True, indent=2))
    return 2 if classification["status"] == "CRITICAL" else 0


if __name__ == "__main__":
    raise SystemExit(main())
