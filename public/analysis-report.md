# Open Quantum Evidence Atlas — Analysis Report

**Version:** 1.0.0 release candidate

**Snapshot:** 2026-07-29T00:13:14Z

**Author:** Takahiro Tsuchiya

**Interactive Atlas:** https://atlas.tsuchiyatakahiro.com

## Decision

Proceed with the broad Open Quantum Evidence Atlas and use Q‑NEKO as a time-indexed observability benchmark. The 645-record EU27–Japan corpus supplies the comparison baseline; Q‑NEKO supplies a live state-change case. It moved from no project or product hits on 29 July to one exact project record and three alias-based research-product search hits on 8 August.

## Measured finding

Only 17 of 645 EU27–Japan quantum publications (2.6%) expose a complete project–funding–publication–dataset–software chain. The supporting pattern is a visibility cliff: 392 (60.8%) connect to a project and funder, 179 (27.8%; Wilson 95% reference band 24.4–31.3) to a dataset, and 48 (7.4%; reference band 5.7–9.7) to software. A stricter 87-record title-literal sensitivity set preserves the pattern: 51.7% project-linked, 24.1% dataset-linked and 8.0% software-linked.

“Connected” means at least one explicit OpenAIRE edge. Dataset and software edges are Graph observability signals; they do not by themselves establish access, licensing, documentation quality or actual reuse. “Complete chain” is a publication-centred Graph path with observable project/funder, dataset and software connections; it is not a claim that a named grant caused or produced those specific outputs, and it is not grant-level attribution. An absent edge means the relationship was not observable in the audited graph, not that the underlying output does not exist.

## Method

1. Discover publications with eight quantum search phrases and deduplicate the Japan-query union.
2. Restrict the corpus to 2020–2026 publications with both Japan and EU27 affiliations.
3. Audit all 645 records for project and funder objects in research-product links.
4. Audit Scholix relations for all 645 observed records, including all 87 title-literal records.
5. Classify dataset and software edges and report Wilson 95% binomial reference bands for subset comparison.
6. Test Q‑NEKO names and identifiers separately as a time-indexed project-visibility preflight; never infer grant attribution from text search alone.

## Interpretation

The current graph makes investment and project structures substantially easier to observe than reusable-output links. The 17 complete chains and the 60.8% to 7.4% fall—an 8.2× visibility gap—are therefore treated as an evidence-infrastructure gap, not as a claim that researchers failed to produce or reuse software. The operational response is to make grant, DOI, repository and Software Heritage identifiers part of project delivery and to re-audit their visibility over time.

## Alien / OpenAIRE MCP cross-check

The design deliberately has two OpenAIRE layers. The interactive verification layer uses the official Alien/OpenAIRE MCP to traverse a featured record; the deterministic census layer uses direct Graph API responses to compute the 645-record denominator. In the MCP layer, an authenticated single-record run resolved the featured DOI and confirmed EC grant 101102140 (QIA-Phase1), but typed dataset/software calls reported non-zero totals with no rows on pages 1 or 2. A controlled follow-up identified the cause: the official `/v1/researchProducts/links` operation defaults to page 0, where direct calls returned the one dataset and two software rows, while Alien's `ResearchLinksInput` rejected page 0 before any upstream request. The discrepancy is a reproducible connector schema/offset defect, not an OpenAIRE null; layer separation ensures it cannot bias the census.

## Live integrity recheck

On 29 July 2026, an uncached bounded recheck passed all six historical integrity checks, and an authenticated fresh full-corpus execution exactly reproduced all 645 corpus IDs, all 645 dataset/software link states and all four connection rates. On 8 August, a separate bounded recheck detected Graph drift: all eight discovery totals moved; Q‑NEKO returned one exact project record and three research-product search hits for the Q‑Neko alias; the featured dataset relation changed from one row to zero; and the two software rows still reproduced the page-0 connector mismatch. The aggregate rates remain the verified 29 July census until another authenticated full run is reviewed.

## Falsification and limits

The full-corpus audit removes sampling error within the observed boundary, but does not turn that boundary into all EU–Japan quantum activity. Wilson intervals are binomial reference bands for comparing subsets; they do not quantify search-boundary, metadata or coverage uncertainty. Publication-year slices preserve the project-to-software gap in every complete year from 2020 through 2025. At the 29 July snapshot, the latest 2026 publication date in the retained corpus was 5 May, so 2026 is not interpreted as a trend. The “software cliff” would weaken if additional identifiers, repositories or improved OpenAIRE classification lifted software visibility toward the observed dataset rate. Search-phrase coverage, affiliation resolution, graph classification and snapshot timing still bound the inference.

Public snapshot and notebook replay require no credentials. The bounded live integrity check makes 22 calls, within OpenAIRE's documented 60 requests/hour unauthenticated limit. An uncached full census requires `OPENAIRE_ACCESS_TOKEN`; the pipeline sends it only as an HTTPS Bearer header and globally throttles request starts below the 7,200 requests/hour authenticated ceiling.

## Q‑NEKO timeline

Q‑NEKO is a watchlist case, not the observed corpus. Its 29 July absence was an observation state, not a performance verdict. The 8 August project appearance is the first recorded Graph-entry milestone. The three product search hits remain candidate records until their project relations are verified.

## Reproducibility and licensing

The executed notebook, evidence snapshot, connection-rate table, observed corpus, Scholix audit, Alien/OpenAIRE MCP cross-check and extraction pipeline are distributed beside this report. OpenAIRE Graph is acknowledged as the source under its CC BY terms; the snapshot declares the discovery, deduplication, affiliation-filtering and link-classification transformations. Code is MIT licensed. Derived data, analysis and documentation are CC BY 4.0.
