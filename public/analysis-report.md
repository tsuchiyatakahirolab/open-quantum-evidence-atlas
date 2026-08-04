# Open Quantum Evidence Atlas — Analysis Report

**Version:** 1.2.0

**Snapshot:** 2026-07-29T00:13:14Z

**Author:** Takahiro Tsuchiya

**Interactive Atlas:** https://atlas.tsuchiyalab.com

## Decision

Proceed with the broad Open Quantum Evidence Atlas and use Q‑NEKO as a prospective observability benchmark. A Q‑NEKO-only product would currently be an empty graph; the 645-record EU27–Japan corpus supplies a defensible baseline while Q‑NEKO becomes a live test of policy-to-graph lag.

## Measured finding

Among 645 EU27–Japan quantum publications from 2020–2026, 392 (60.8%) connect to a project and funder in the audited OpenAIRE Graph response, 179 (27.8%; Wilson 95% CI 24.4–31.3) connect to a dataset, and 48 (7.4%; CI 5.7–9.7) connect to software. A stricter 87-record title-literal sensitivity set preserves the pattern: 51.7% project-linked, 24.1% dataset-linked and 8.0% software-linked.

“Connected” means at least one explicit OpenAIRE edge. An absent edge means the relationship was not observable in the audited graph. It is not evidence that the underlying output does not exist.

## Method

1. Discover publications with eight quantum search phrases and deduplicate the Japan-query union.
2. Restrict the corpus to 2020–2026 publications with both Japan and EU27 affiliations.
3. Audit all 645 records for project and funder objects in research-product links.
4. Audit Scholix relations for all 645 observed records, including all 87 title-literal records.
5. Classify dataset and software edges and report Wilson 95% confidence intervals.
6. Test Q‑NEKO names and identifiers separately as a prospective project-visibility preflight.

## Interpretation

The current graph makes investment and project structures substantially easier to observe than reusable outputs. The 60.8% to 7.4% fall—an 8.2× visibility gap—is therefore treated as an evidence-infrastructure gap, not as a claim that researchers failed to produce software. The operational response is to make grant, DOI, repository and Software Heritage identifiers part of project delivery and to re-audit their visibility over time.

## Alien / OpenAIRE MCP cross-check

An authenticated single-record run through the official Alien/OpenAIRE demo resolved the featured DOI to the same OpenAIRE record and confirmed EC grant 101102140 (QIA-Phase1). Its typed dataset/software calls reported non-zero totals but returned no rows on pages 1 or 2. A controlled follow-up identified the cause: the official `/v1/researchProducts/links` operation defaults to page 0, where direct calls returned the one dataset and two software rows, while Alien's `ResearchLinksInput` rejected page 0 before any upstream request. The discrepancy is therefore a reproducible MCP schema/offset defect, not an OpenAIRE null. It is published as an interoperability diagnostic and is not merged into the 645-record denominator.

## Live integrity recheck

On 29 July 2026, an uncached bounded recheck repeated the eight discovery-count queries, the featured DOI and grant lookup, the page-0/page-1 link contract, and all four Q‑NEKO aliases. Six of six integrity checks passed, all eight discovery counts matched the snapshot, and Q‑NEKO remained at zero projects and zero research products. A fresh full-corpus execution then exactly reproduced all 645 corpus IDs, all 645 dataset/software link states, and all four connection rates; the comparison is published as machine-readable JSON.

## Falsification and limits

The full-corpus audit removes sampling error within the observed boundary, but does not turn that boundary into all EU–Japan quantum activity. The “software cliff” would weaken if additional identifiers, repositories or improved OpenAIRE classification lifted software visibility toward the observed dataset rate. Search-phrase coverage, affiliation resolution, graph classification and snapshot timing still bound the inference.

## Q‑NEKO and GQSO

Q‑NEKO is a watchlist case, not the observed corpus. Its absence at the snapshot date is interpreted as observation lag, not research failure.

The Global Quantum Statecraft Observatory (GQSO) connection is prospective. The Atlas is a standalone OpenAIRE audit today. Its evidence-chain metrics can later be mapped into GQSO jurisdiction lanes, but this release does not claim a current partnership or completed technical integration.

## Reproducibility and licensing

The executed notebook, evidence snapshot, connection-rate table, observed corpus, Scholix audit, Alien/OpenAIRE MCP cross-check and extraction pipeline are distributed beside this report. Code is MIT licensed. Data, analysis and documentation are CC BY 4.0.
