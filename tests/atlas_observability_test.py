import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "atlas_observability.py"
SPEC = importlib.util.spec_from_file_location("atlas_observability", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def baseline():
    return {
        "as_of": "2026-07-29T00:13:14Z",
        "eu27_japan_observed_publications": 645,
        "query_counts_by_term_before_deduplication": {"quantum computing": 811},
        "rates": {
            name: {"numerator": value, "denominator": 645, "rate": value / 645}
            for name, value in {
                "project": 392,
                "funding": 392,
                "dataset": 179,
                "software": 48,
            }.items()
        },
        "q_neko": {
            "project_queries": {"Q-Neko": {"count": 0}},
            "product_queries": {"Q-Neko": {"count": 0}},
        },
        "quality_checks": {
            "observed_duplicate_ids": 0,
            "scholix_missing_records": 0,
            "scholix_duplicate_ids": 0,
        },
    }


def bounded_result():
    return {
        "checks": {
            "featured_doi_resolves": True,
            "featured_grant_resolves": True,
            "dataset_page_zero_returns_rows": True,
            "software_page_zero_returns_rows": True,
            "page_one_still_skips_dataset": True,
            "page_one_still_skips_software": True,
        },
        "term_query_counts": {"quantum computing": {"snapshot": 811, "current": 828, "delta": 17}},
        "summary": {
            "q_neko_project_hits": 0,
            "q_neko_product_hits": 0,
            "q_neko_unique_project_records_sampled": 0,
            "q_neko_unique_product_records_sampled": 0,
        },
        "link_page_contract": {
            "dataset": {"0": {"total": 0, "rows": 0}, "1": {"total": 0, "rows": 0}},
            "software": {"0": {"total": 2, "rows": 2}, "1": {"total": 2, "rows": 0}},
        },
        "request_policy": {
            "authenticated": False,
            "requests_made": 22,
            "unauthenticated_limit_per_hour": 60,
        },
    }


def monitor_baseline():
    return bounded_result()


class BoundedClassificationTests(unittest.TestCase):
    def test_green_when_integrity_and_watchlist_are_stable(self):
        result = MODULE.classify_bounded(bounded_result(), monitor_baseline())
        self.assertEqual(result["status"], "GREEN")

    def test_review_when_discovery_counts_change(self):
        result_data = bounded_result()
        result_data["term_query_counts"]["quantum computing"]["current"] = 829
        result = MODULE.classify_bounded(result_data, monitor_baseline())
        self.assertEqual(result["status"], "REVIEW_REQUIRED")

    def test_critical_when_required_integrity_check_fails(self):
        result_data = bounded_result()
        result_data["checks"]["featured_grant_resolves"] = False
        result = MODULE.classify_bounded(result_data, monitor_baseline())
        self.assertEqual(result["status"], "CRITICAL")

    def test_review_when_accepted_link_contract_changes(self):
        result_data = bounded_result()
        result_data["link_page_contract"]["software"]["0"]["rows"] = 0
        result = MODULE.classify_bounded(result_data, monitor_baseline())
        self.assertEqual(result["status"], "REVIEW_REQUIRED")


class FullClassificationTests(unittest.TestCase):
    def test_review_when_full_metric_changes(self):
        current = baseline()
        current["eu27_japan_observed_publications"] = 646
        result, diff = MODULE.classify_full(current, baseline())
        self.assertEqual(result["status"], "REVIEW_REQUIRED")
        self.assertIn("observed_publications", diff["changed"])

    def test_critical_when_census_is_incomplete(self):
        current = baseline()
        current["quality_checks"]["scholix_missing_records"] = 1
        result, _ = MODULE.classify_full(current, baseline())
        self.assertEqual(result["status"], "CRITICAL")


if __name__ == "__main__":
    unittest.main()
