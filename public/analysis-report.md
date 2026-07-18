# Open Quantum Evidence Atlas — Analysis Report

**Version:** 1.0.0  
**Snapshot:** 2026-07-18T01:20:47Z  
**Author:** Takahiro Tsuchiya  
**Interactive Atlas:** https://atlas.tsuchiyalab.com

## Decision

Proceed with the broad Open Quantum Evidence Atlas and use Q‑NEKO as a prospective observability benchmark. A Q‑NEKO-only product would currently be an empty graph; the 645-record EU27–Japan corpus supplies a defensible baseline while Q‑NEKO becomes a live test of policy-to-graph lag.

## Measured finding

Among 645 EU27–Japan quantum publications from 2020–2026, 392 (60.8%) connect to a project and funder in the audited OpenAIRE Graph response. In the 250-record Scholix audit, 68 (27.2%) connect to a dataset and 22 (8.8%) connect to software. A stricter 87-record title-literal sensitivity set preserves the pattern: 51.7% project-linked, 24.1% dataset-linked and 8.0% software-linked.

“Connected” means at least one explicit OpenAIRE edge. An absent edge means the relationship was not observable in the audited graph. It is not evidence that the underlying output does not exist.

## Method

1. Discover publications with eight quantum search phrases and deduplicate the Japan-query union.
2. Restrict the corpus to 2020–2026 publications with both Japan and EU27 affiliations.
3. Audit all 645 records for project and funder objects in research-product links.
4. Audit Scholix relations for a 250-record broad sample and all 87 title-literal records.
5. Classify dataset and software edges and report Wilson 95% confidence intervals.
6. Test Q‑NEKO names and identifiers separately as a prospective project-visibility preflight.

## Interpretation

The current graph makes investment and project structures substantially easier to observe than reusable outputs. The 60.8% to 8.8% fall is therefore treated as an evidence-infrastructure gap, not as a claim that researchers failed to produce software. The operational response is to make grant, DOI, repository and Software Heritage identifiers part of project delivery and to re-audit their visibility over time.

## Falsification and limits

The “software cliff” would weaken if a full-corpus Scholix audit, additional repository identifiers or improved OpenAIRE classification lifted software visibility toward the observed dataset rate. The dataset/software denominator is 250 for the broad corpus; it must not be reported as 645. Search-phrase coverage, affiliation resolution and snapshot timing also bound the inference.

## Q‑NEKO and GQSO

Q‑NEKO is a watchlist case, not the observed corpus. Its absence at the snapshot date is interpreted as observation lag, not research failure.

The Global Quantum Statecraft Observatory (GQSO) connection is prospective. The Atlas is a standalone OpenAIRE audit today. Its evidence-chain metrics can later be mapped into GQSO jurisdiction lanes, but this release does not claim a current partnership or completed technical integration.

## Reproducibility and licensing

The executed notebook, evidence snapshot, connection-rate table, observed corpus, Scholix audit and extraction pipeline are distributed beside this report. Code is MIT licensed. Data, analysis and documentation are CC BY 4.0.
