#!/usr/bin/env python3
"""Execute every code cell in the published notebook in one clean namespace."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "notebook",
        type=Path,
        nargs="?",
        default=ROOT / "public" / "reproducibility" / "openaire_connection_rates.ipynb",
    )
    parser.add_argument("--cwd", type=Path, default=ROOT)
    args = parser.parse_args()

    notebook = json.loads(args.notebook.resolve().read_text(encoding="utf-8"))
    code_cells = [cell for cell in notebook.get("cells", []) if cell.get("cell_type") == "code"]
    if not code_cells:
        raise RuntimeError("Notebook contains no code cells.")

    os.environ.setdefault("MPLBACKEND", "Agg")
    previous_cwd = Path.cwd()
    namespace: dict[str, object] = {"__name__": "__notebook_validation__"}
    try:
        os.chdir(args.cwd.resolve())
        for index, cell in enumerate(code_cells, start=1):
            source = "".join(cell.get("source", []))
            exec(compile(source, f"{args.notebook.name}:code-cell-{index}", "exec"), namespace)
    finally:
        os.chdir(previous_cwd)

    metrics = namespace.get("metrics")
    corpus = namespace.get("corpus")
    links = namespace.get("links")
    if not isinstance(metrics, dict) or corpus is None or links is None:
        raise RuntimeError("Notebook did not produce the expected metrics, corpus and links objects.")
    expected = int(metrics["eu27_japan_observed_publications"])
    if len(corpus) != expected or len(links) != expected:
        raise RuntimeError(f"Notebook row check failed: expected {expected}, got {len(corpus)} and {len(links)}.")

    print(json.dumps({"status": "passed", "code_cells": len(code_cells), "corpus_rows": len(corpus), "link_rows": len(links)}))


if __name__ == "__main__":
    main()
