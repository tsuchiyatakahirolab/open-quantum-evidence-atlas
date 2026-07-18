#!/usr/bin/env python3
"""Reproduce the Alien/OpenAIRE MCP link-pagination mismatch."""

from __future__ import annotations

import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://api.openaire.eu/graph/v1/researchProducts/links"
PRODUCT_ID = "doi_dedup___::82d8842e25b2e9bdbe03ab4c5db972db"


def fetch(target_type: str, page: int) -> dict:
    query = urlencode(
        {
            "sourcePid": f"50|{PRODUCT_ID}",
            "targetType": target_type,
            "page": page,
            "pageSize": 10,
        }
    )
    request = Request(f"{BASE_URL}?{query}", headers={"User-Agent": "Open-Quantum-Evidence-Atlas/1.1"})
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)

    rows = payload.get("results") or []
    return {
        "target_type": target_type,
        "page": page,
        "total_links": int((payload.get("header") or {}).get("totalLinks") or 0),
        "returned_rows": len(rows),
        "targets": [
            {
                "title": (row.get("target") or {}).get("title"),
                "type": (row.get("target") or {}).get("type"),
                "identifiers": (row.get("target") or {}).get("identifiers") or [],
                "relation": (row.get("relType") or {}).get("name"),
                "provenance": row.get("provenance") or [],
            }
            for row in rows
        ],
    }


def main() -> None:
    checks = [fetch(target_type, page) for target_type in ("dataset", "software") for page in (0, 1)]
    by_key = {(row["target_type"], row["page"]): row for row in checks}
    reproduced = all(
        by_key[(target_type, 0)]["total_links"] > 0
        and by_key[(target_type, 0)]["returned_rows"] > 0
        and by_key[(target_type, 1)]["total_links"] == by_key[(target_type, 0)]["total_links"]
        and by_key[(target_type, 1)]["returned_rows"] == 0
        for target_type in ("dataset", "software")
    )
    print(json.dumps({"mismatch_reproduced": reproduced, "checks": checks}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
