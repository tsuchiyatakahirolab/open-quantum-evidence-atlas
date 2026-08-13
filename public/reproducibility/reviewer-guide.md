# Open Quantum Evidence Atlas: three-minute verification guide

This guide verifies the submission from claim to reusable evidence without a login.

## 1. Verify the decision question and denominator

Open the [Atlas finding](https://atlas.tsuchiyatakahiro.com/#finding). The declared boundary is 2020–2026 OpenAIRE publications found with eight quantum phrases and retained only when resolved affiliations include Japan and at least one EU27 country. The observed corpus contains 645 unique records. The strict title-literal sensitivity subset contains 87 records.

Expected headline: project/funder visibility is 392/645 (60.8%), dataset visibility is 179/645 (27.8%), and software visibility is 48/645 (7.4%). Only 17/645 (2.6%) expose the complete chain.

## 2. Inspect a complete source-opening chain

Open the [complete chain](https://atlas.tsuchiyatakahiro.com/#trace). Select each node to follow European Commission funding through three projects, Japan–EU institutions, the publication DOI, one Figshare dataset, and two software records as observed in the 29 July census. These links demonstrate what a fully observable chain looked like at that timestamp; they are not used as a substitute for the 645-record census. The latest bounded recheck discloses that the dataset edge later changed.

## 3. Verify the Alien/OpenAIRE MCP contribution

Open the [MCP cross-check](https://atlas.tsuchiyatakahiro.com/#mcp) and the [machine-readable run manifest](https://atlas.tsuchiyatakahiro.com/reproducibility/mcp-run-manifest.json). The authenticated 30-call run resolved the featured DOI and EC grant. A targeted follow-up reproduced a contract mismatch: OpenAIRE serves the tested link rows at page 0, while the MCP input validator rejected page 0. This is an intentional two-layer design: MCP provides interactive verification, while the direct API provides the deterministic census. Separating them prevents the connector boundary from biasing the aggregate denominator.

## 4. Re-run the evidence

- Use the [browser auditor](https://atlas.tsuchiyatakahiro.com/audit) to change the boundary and recompute numerators, denominators and Wilson reference bands.
- Run `npm ci && npm test` to build and server-render the public artifact.
- Run `python public/reproducibility/openaire_live_recheck.py` for the bounded 23-request integrity probe; no credential is required within OpenAIRE's 60 requests/hour unauthenticated limit.
- For a fresh full Graph census, set an access token locally as `OPENAIRE_ACCESS_TOKEN`, then run `python public/reproducibility/openaire_feasibility.py`. The 2,580 link checks plus discovery/organisation calls are throttled below OpenAIRE's 7,200 requests/hour authenticated limit. Cached replay does not need a token.
- Open the [executed notebook](https://atlas.tsuchiyatakahiro.com/reproducibility/openaire_connection_rates.ipynb) for the saved calculation trail.

Later live results may differ as the OpenAIRE Graph evolves. The published 13 August bounded result demonstrates this: eight discovery totals moved, Q‑NEKO appeared as one exact project record, and four raw product hits became three after self-exclusion. Those same three records were returned by the explicit project-code relation query. The featured dataset edge changed from one to zero while the software pagination case persisted. These observations do not recompute the 645-record census, and a graph relation is not causal production or reuse. Each execution is timestamped; historical replay requires an explicit cache directory.

## 5. Confirm responsible and FAIR hand-off

The [responsible-use manifest](https://atlas.tsuchiyatakahiro.com/reproducibility/responsible-use-manifest.json) declares sources, licences, AI assistance, personal-data boundaries and prohibited interpretations. The [RO-Crate metadata](https://atlas.tsuchiyatakahiro.com/ro-crate-metadata.json) inventories the software, data, story, notebook, method and MCP evidence in machine-readable form.

“Connected” means at least one observable OpenAIRE edge. It does not prove access, licensing quality or actual reuse. “Complete chain” means a publication-centred path with observable project/funder, dataset and software connections; it is not causal or grant-level attribution. “Not observable” does not mean nonexistent.

## Reuse decision

A policy evaluator can substitute another programme, field or country pair; a funder can make grant, DOI, repository and software identifiers a close-out requirement; an Open Science team can schedule repeated audits to measure graph-entry lag.

OpenAIRE Graph is acknowledged as the source under its CC BY terms. Code is MIT licensed. Derived data, analysis, documentation, media and this guide are CC BY 4.0.
