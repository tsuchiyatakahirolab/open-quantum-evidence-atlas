# Open Quantum Evidence Atlas

## The question

Funders can count grants and papers. The harder question is whether the public evidence can be followed to datasets and software that others can find and inspect. Open Quantum Evidence Atlas answers that question with a working auditor: choose a research-portfolio boundary, find where the evidence chain breaks, open the exact source records, export the identifiers to fix, and repeat the audit to measure improvement.

The verified case asks whether EU–Japan quantum funding can be traced beyond grants and publications to reusable-output links—without mistaking an absent Graph edge for a missing output.

## The journey

We searched eight quantum phrases across 2020–2026 publications, deduplicated a 2,334-record Japan-query union, and retained records with at least one resolved Japan affiliation and one EU27 affiliation. That produced 645 observed EU–Japan publications. We audited every record for project and funder objects, then audited OpenAIRE Scholix relations for every one of the same 645 records. All corpus and audit identifiers are unique, with no missing audit rows. Wilson intervals are shown only as binomial reference bands for comparing user-selected subsets; because the Atlas is a census within a constructed boundary, they do not quantify search, metadata or coverage uncertainty.

The Atlas distinguishes three states: connected in OpenAIRE, not observable in OpenAIRE, and not audited. A dataset or software connection is a Graph observability signal; it does not by itself establish access, licensing, documentation quality or actual reuse. An absent edge is never presented as proof that an output does not exist.

## The insight

Only 17 of 645 records (2.6%) expose the complete project–funding–publication–dataset–software chain. Here “complete chain” means a publication-centred Graph path with observable project/funder, dataset and software connections; it is not causal or grant-level attribution. The supporting pattern is a visibility cliff: 392 publications (60.8%) connect to at least one project and funder, 179 (27.8%; Wilson 95% reference band 24.4–31.3) to a dataset, and only 48 (7.4%; reference band 5.7–9.7) to software—an 8.2× project-to-software gap. The title-literal sensitivity check preserves the pattern: 51.7% project/funding, 24.1% dataset, and 8.0% software. Publication-year slices preserve the project-to-software gap in every complete year from 2020 through 2025. At the 29 July snapshot, the latest 2026 publication date in the retained corpus was 5 May, so 2026 is not interpreted as a trend.

One record demonstrates that a complete chain is possible: European Commission → QIA-Phase1 / QUANGO / QSNP → OIST and European institutions → “Connecting quantum cities” → a Figshare dataset → two unique software records collected from GitHub and Software Heritage. The Auditor displays four directional software relation rows for this record because the same two targets are present as incoming and outgoing links; it labels the row count explicitly rather than presenting it as four unique software objects.

The architecture deliberately separates two OpenAIRE layers. The Alien/OpenAIRE MCP is the interactive verification layer: it resolved the exact DOI, confirmed QIA-Phase1 and followed typed relations. The direct Graph API is the deterministic census layer: it fixes the denominator and keeps generated prose out of metrics. When the MCP tools reported non-zero dataset/software totals without rows, the direct layer reproduced the cause: OpenAIRE's link operation defaults to page 0, which returns one dataset and two software records, while the MCP validator requires page 1 or higher. Layer separation therefore prevents a connector defect from biasing the headline while turning that defect into a concrete interoperability result: https://atlas.tsuchiyatakahiro.com/reproducibility/openaire-mcp-crosscheck.md

An uncached live integrity recheck on 29 July repeated the eight discovery queries, featured DOI and grant lookup, page-0/page-1 link comparison, and four Q‑NEKO aliases. All six contract checks passed, all eight discovery counts were unchanged, and the page mismatch remained reproducible. We also completed an authenticated fresh full-corpus execution: all 645 corpus IDs, all 645 dataset/software link states, and all four connection rates exactly matched the published audit.

The clock then moved. On 8 August, the bounded probe found one exact Q‑NEKO project record and three alias-based research-product search hits. On 20 August the same alias query returned five products, but two were this Atlas's indexed Zenodo releases. The monitor now separates five raw hits, three self-excluded candidates, and three records explicitly related to OpenAIRE project code 101241875. That graph relation is inspectable evidence, not a causal claim that the grant produced the outputs. All eight discovery totals had also changed; the featured dataset relation remained at zero rows, whereas the two software rows continued to reproduce the MCP page mismatch. We publish drift separately rather than rewriting the 29 July census. Q‑NEKO therefore becomes a demonstrated time-indexed policy benchmark, not a zero-output verdict.

## What a decision-maker can do

For the current portfolio, use the 645-record baseline before interpreting an individual project. Require grant IDs, publication DOIs, repository IDs and software identifiers as explicit close-out deliverables. Then repeat the same bounded audit to measure whether the links become observable. Q‑NEKO demonstrates that operating cycle: record the first project-visibility milestone, verify project–product relations, and measure graph-entry lag without treating linkage as causal production.

OpenAIRE Graph is acknowledged as the source under its CC BY terms; the published snapshot declares the transformations applied. This derived artifact and story are licensed CC BY 4.0.

Captioned 119-second walkthrough: https://atlas.tsuchiyatakahiro.com/video
