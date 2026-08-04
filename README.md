# Open Quantum Evidence Atlas

An interactive OpenAIRE evidence-chain audit of EU–Japan quantum research. The artifact traces how observable links fall from funding and projects to datasets and software, then uses Q‑NEKO as a prospective policy-observability benchmark.

- Live application: <https://atlas.tsuchiyalab.com>
- Research archive: <https://tsuchiyatakahiro.com/research/open-quantum-evidence-atlas>

The `/audit` route is a reusable Evidence Chain Auditor. It filters and recomputes the verified snapshot, accepts compatible JSON snapshots, extracts high-completeness records, exports JSON/CSV/Markdown results, and performs a live OpenAIRE alias preflight.

The homepage also publishes an executed single-record Alien/OpenAIRE MCP cross-check. It confirms the featured DOI and QIA-Phase1 grant, reproduces a zero-based pagination mismatch in the MCP link wrapper, and recovers the hidden dataset/software rows through the direct API. The MCP run is an interoperability demonstration; the direct API census remains the canonical source for metrics. The integration finding is tracked publicly in [issue #5](https://github.com/tsuchiyatakahirolab/open-quantum-evidence-atlas/issues/5).

The public artifact includes a captioned 119-second walkthrough at `https://atlas.tsuchiyalab.com/video`. In the Evidence Chain Auditor, dataset and software counts are labelled as directional relation rows; the featured record's four software relation rows resolve to two unique software records.

A bounded uncached live recheck verifies the eight discovery-query totals, featured DOI and grant, page-0 link contract, and Q‑NEKO watchlist without relabelling a historical cache as current. The 29 July full-corpus execution exactly reproduced all 645 corpus IDs, all 645 link states, and all four rates. Full census runs use a date-stamped cache directory by default; historical replay requires an explicit `OPENAIRE_CACHE_DIR`.

## GQSO relationship

The Atlas is a standalone OpenAIRE audit. Its connection to the Global Quantum Statecraft Observatory (GQSO) is prospective: the published metrics and evidence-chain model provide a candidate observability layer for a future GQSO integration. This repository does not claim a current partnership or completed technical integration.

## Headline finding

Among 645 EU27–Japan quantum publications from 2020–2026, 60.8% connect to a project and funder, 27.8% to a dataset and 7.4% to software. Dataset and software relations are now audited across all 645 observed records. A stricter 87-record title-literal sensitivity check preserves the pattern.

“Connected” means at least one explicit OpenAIRE edge. An absent edge means not observable in the Graph; it is not evidence that the underlying output does not exist.

## Run and verify

```bash
npm install
npm run dev
npm test
```

The test suite performs a production build, server-renders the artifact, verifies social metadata, and checks the published metric denominators.

## Reproducibility

The public reproducibility pack includes:

- `public/evidence-snapshot.json` — bounded result snapshot and metric semantics
- `public/connection-rates.csv` — connection numerators, denominators and intervals
- `public/reproducibility/openaire_feasibility.py` — OpenAIRE extraction/audit pipeline
- `public/reproducibility/openaire_connection_rates.ipynb` — executed notebook
- `public/analysis-report.md` — findings, decision logic, limitations and next steps
- `public/reproducibility/eu27_japan_corpus.csv` — the deduplicated observed corpus
- `public/reproducibility/scholix_link_audit.csv` — audited research-product links
- `public/reproducibility/openaire-mcp-crosscheck.md` — executed Alien/OpenAIRE MCP trace and API comparison
- `public/reproducibility/openaire_mcp_pagination_repro.py` — minimal executable reproduction of the page-0 mismatch
- `public/reproducibility/live-recheck.json` — latest bounded uncached integrity recheck
- `public/reproducibility/refresh-comparison.json` — ID-, link-state-, and rate-level comparison of consecutive full executions
- `public/reproducibility/win-probability-source-notes.md` — scenario assumptions, chart map, caveats and report-quality mapping
- `public/reproducibility/win-probability-artifact.json` — validated canonical decision-report payload
- `public/reproducibility/win-probability-report.sql` — reviewed values query used by the decision report
- `public/reproducibility/openaire_live_recheck.py` — source for the bounded live recheck
- `public/submission-story.md` — the required 1–2 page hackathon story

Snapshot timestamp: `2026-07-29T00:13:14Z`.

## License

Code is licensed under the MIT License. Data, analysis, documentation and the hackathon story are licensed under CC BY 4.0. See `LICENSE` and `LICENSE-DATA`.
