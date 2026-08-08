# Open Quantum Evidence Atlas

An interactive OpenAIRE evidence-chain audit of EU–Japan quantum research. The artifact traces how observable links fall from funding and projects to datasets and software, then uses Q‑NEKO as a time-indexed policy-observability benchmark.

- Canonical public Atlas: <https://atlas.tsuchiyatakahiro.com>

The `/audit` route is a reusable Evidence Chain Auditor. It filters and recomputes the verified snapshot, accepts compatible JSON snapshots, extracts high-completeness records, exports JSON/CSV/Markdown results, and performs a live OpenAIRE alias preflight.

The homepage implements an intentional two-layer OpenAIRE design. The Alien/OpenAIRE MCP is the interactive verification layer: its executed 30-call trace follows the featured DOI, grant, projects, dataset and software relations and exposes a zero-based pagination mismatch. The direct Graph API is the deterministic census layer: it computes the fixed 645-record denominator without generated prose. Keeping the layers separate prevents a connector defect from entering the headline metrics while making the defect itself a reusable interoperability result. The static [integration diagnostic](https://atlas.tsuchiyatakahiro.com/reproducibility/openaire-mcp-crosscheck.md) preserves the dated execution and subsequent drift.

The public artifact includes a captioned 119-second walkthrough at `https://atlas.tsuchiyatakahiro.com/video`. In the Evidence Chain Auditor, dataset and software counts are labelled as directional relation rows; the featured record's four software relation rows resolve to two unique software records.

## Three-minute verification path

1. Read the declared denominator and visibility cliff on the [Atlas](https://atlas.tsuchiyatakahiro.com/#finding).
2. Open one complete funding-to-software chain and its source records.
3. Inspect the executed MCP comparison and machine-readable run manifest.
4. Re-run the browser auditor or follow the public [reviewer guide](https://atlas.tsuchiyatakahiro.com/reproducibility/reviewer-guide.md).

This path is designed so a technical or strategic reviewer can verify the main claim, the MCP contribution, and the reuse hand-off without credentials.

## Snapshot and latest observation

The aggregate rates are a verified full census dated `2026-07-29T00:13:14Z`. A separate 22-request bounded recheck on 8 August detected expected Graph movement: all eight discovery totals changed, Q‑NEKO became visible as one exact project record plus three alias-based research-product search hits, and the featured dataset relation changed from one row to zero while its two software rows remained visible. Product search hits are not treated as Q‑NEKO grant outputs without a verified relation. The bounded result is published separately and does not silently rewrite the 645-record denominator.

A bounded uncached live recheck uses 22 requests to verify the eight discovery-query totals, featured DOI and grant, page-0 link contract, and Q‑NEKO watchlist. It can run without credentials within OpenAIRE's documented 60 requests/hour unauthenticated ceiling. A fresh full census performs 2,580 dataset/software link checks plus discovery and organisation requests, so `OPENAIRE_ACCESS_TOKEN` is required and requests are globally throttled below the documented 7,200 requests/hour authenticated ceiling. Cached historical replay does not require a token and uses an explicit `OPENAIRE_CACHE_DIR`.

## Headline finding

Only 17 of 645 EU27–Japan quantum publications (2.6%) expose a complete project–funding–publication–dataset–software chain. The supporting rates are 60.8% project/funder-linked, 27.8% dataset-linked and 7.4% software-linked. Dataset and software relations are audited across all 645 observed records, and a stricter 87-record title-literal sensitivity check preserves the pattern.

“Connected” means at least one explicit OpenAIRE edge. Dataset and software connections measure Graph observability, not access, licensing, documentation quality or actual reuse. “Complete chain” means a publication-centred Graph path in which the same publication has observable project/funder, dataset and software connections. It does not assert that a named grant caused or produced those specific dataset/software records, and it is not grant-level attribution. An absent edge means not observable in the Graph; it is not evidence that the underlying output does not exist. Wilson intervals are binomial reference bands for comparing subsets, not estimates of search-boundary, metadata or coverage uncertainty.

## Run and verify

```bash
npm ci
npm run dev
npm test
```

The test suite performs a production build, server-renders the artifact, verifies social metadata, and checks the published metric denominators.

The public snapshot, executed notebook and bounded live recheck require no credentials:

```bash
python public/reproducibility/openaire_live_recheck.py
```

For an uncached full census, obtain an access token from OpenAIRE, set it locally as `OPENAIRE_ACCESS_TOKEN`, and then run:

```bash
python public/reproducibility/openaire_feasibility.py
```

The token is sent only in the HTTPS `Authorization: Bearer` header; it is not written to URLs, caches or outputs. See the official [API terms and rate limits](https://graph.openaire.eu/docs/apis/terms/) and [authentication guide](https://graph.openaire.eu/docs/apis/authentication/).

## Scheduled observation

The read-only GitHub Actions workflow runs a bounded 22-request observation each day and can run the authenticated full-census lane only when it is explicitly enabled. Every run writes an isolated review bundle; the workflow has no permission or code path to commit, deploy or overwrite the published baseline. See the [automation and publication-gate documentation](docs/atlas-observability-automation.md).

```bash
npm run atlas:ops:bounded
npm run atlas:ops:full
npm run atlas:ops:test
```

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
- `public/reproducibility/mcp-run-manifest.json` — machine-readable prompt, execution scope, observations and repair contract
- `public/reproducibility/openaire_mcp_pagination_repro.py` — minimal executable reproduction of the page-0 mismatch
- `public/reproducibility/live-recheck.json` — latest bounded uncached integrity recheck
- `public/reproducibility/full-census-verification.json` — machine-readable confirmation of all 645 IDs, link states and four rates
- `public/reproducibility/openaire_live_recheck.py` — source for the bounded live recheck
- `public/reproducibility/reviewer-guide.md` — three-minute claim-to-reproduction path
- `public/reproducibility/responsible-use-manifest.json` — source, licence, AI-use and inference-boundary disclosure
- `public/ro-crate-metadata.json` — FAIR, machine-readable artifact inventory using RO-Crate JSON-LD
- `public/submission-story.md` — the required 1–2 page hackathon story

Public data snapshot: `2026-07-29T00:13:14Z`. The full-census verification confirmed all 645 IDs, all 645 link states and all four published rates. At this snapshot, the latest 2026 publication date in the retained corpus was 5 May. Release target: `v1.0.0`; no GitHub Release is claimed until final QA and publication are complete.

## License

OpenAIRE Graph source records are reused under [OpenAIRE's CC BY terms](https://graph.openaire.eu/docs/license/) with OpenAIRE acknowledged as the source. The derived snapshot documents the discovery, deduplication, affiliation filtering and link-classification transformations. Code is licensed under the MIT License; derived data, analysis, documentation and the hackathon story are licensed under CC BY 4.0. See `LICENSE` and `LICENSE-DATA`.
