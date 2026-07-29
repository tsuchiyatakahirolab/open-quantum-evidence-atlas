# Open Quantum Evidence Atlas

## The question

Can a decision-maker trace EU–Japan quantum-research policy through funding and projects to publications—and then to reusable datasets and software? We used the OpenAIRE Graph to measure that evidence chain rather than infer collaboration from publication counts alone.

## The journey

We searched eight quantum phrases across 2020–2026 publications, deduplicated a 2,334-record Japan-query union, and retained records with at least one resolved Japan affiliation and one EU27 affiliation. That produced 645 observed EU–Japan publications. We audited every record for project and funder objects, then audited OpenAIRE Scholix relations for every one of the same 645 records. All corpus and audit identifiers are unique, with no missing audit rows. Wilson intervals express uncertainty in the observed rates.

The Atlas distinguishes three states: connected in OpenAIRE, not observable in OpenAIRE, and not audited. An absent edge is never presented as proof that an output does not exist.

## The insight

Project and funding visibility are strong: 392 of 645 publications (60.8%) connect to at least one project and a funder object. Reuse visibility collapses downstream. Across the full 645-record audit, 179 (27.8%, Wilson 95% CI 24.4–31.3) connect to a dataset and only 48 (7.4%, CI 5.7–9.7) connect to software—an 8.2× funding-to-software visibility gap. The title-literal sensitivity check preserves the pattern: 51.7% project/funding, 24.1% dataset, and 8.0% software. The former deterministic 250-record sample is retained as a reproducibility check and yields its original 68 dataset and 22 software connections.

One record demonstrates that a complete chain is possible: European Commission → QIA-Phase1 / QUANGO / QSNP → OIST and European institutions → “Connecting quantum cities” → a Figshare dataset → two software records collected from GitHub and Software Heritage.

We then re-ran that exact DOI through the authenticated Alien/OpenAIRE demo. The MCP route resolved the same record and confirmed QIA-Phase1, but its typed dataset/software tools reported non-zero totals without rows. We reproduced the cause: OpenAIRE's link operation defaults to page 0, which returns the one dataset and two software records, while the MCP validator requires page 1 or higher. The Atlas therefore turns an apparent evidence null into a concrete integration finding, supplies a working direct-API fallback, and publishes a minimal reproducer for the MCP maintainers.

An uncached live integrity recheck on 29 July repeated the eight discovery queries, featured DOI and grant lookup, page-0/page-1 link comparison, and four Q‑NEKO aliases. All six contract checks passed, all eight discovery counts were unchanged, and the page mismatch remained reproducible. We also completed a fresh full-corpus execution: all 645 corpus IDs, all 645 dataset/software link states, and all four connection rates exactly matched the published audit. The bounded recheck and full comparison are both machine-readable.

Q-Neko, the first EU–Japan joint quantum-technology project, becomes a prospective policy benchmark. Four aliases and identifiers returned zero OpenAIRE projects and zero research products on 18 July 2026. This is labelled observation lag—not project failure.

## What a decision-maker can do

Keep the broad 645-record Atlas as the baseline while Q-Neko matures. Make grant, publication, repository, and software identifiers an explicit close-out deliverable. Re-audit Q-Neko to measure time-to-project, time-to-publication, and time-to-reusable-output. The published denominators and snapshot make the argument falsifiable and reusable in another bilateral domain.

This artifact and story are licensed CC BY 4.0.
