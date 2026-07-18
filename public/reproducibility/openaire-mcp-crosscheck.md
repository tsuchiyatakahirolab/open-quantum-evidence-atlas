# Alien / OpenAIRE MCP cross-check

**Executed:** 18 July 2026  
**Route:** Official Alien Intelligence OpenAIRE demo (`https://demo.alien.club/openaire`)  
**Model shown by the interface:** Sonnet 4.6  
**Purpose:** A single-record interoperability check beside the denominator-complete direct OpenAIRE Graph API audit.

## Prompt

> Using the OpenAIRE Graph only, cross-check the publication “Connecting quantum cities: simulations of a satellite-based quantum network” (DOI 10.1088/1367-2630/ad5b13). Return its OpenAIRE record ID, publication year, organisations and countries, linked projects and funders, linked datasets, linked software, and source/provenance URLs. If a relation is absent, say “not observable” rather than claiming it does not exist.

## Directly observed in the executed trace

- `Get Research Product Details` resolved DOI `10.1088/1367-2630/ad5b13` to OpenAIRE record `doi_dedup___::82d8842e25b2e9bdbe03ab4c5db972db`.
- The research-product record was retrieved as a 2024 publication.
- `Search Research Products` returned the target when filtered for an EC funding/project relation, confirming an EC-linked project signal.
- A second target query with `has_project_rel: true` returned the record, independently confirming that at least one project relation is observable.
- The all-links call returned 60 link rows; the agent reported that all 60 were typed as `cites` in that response.
- The trace used 29 completed OpenAIRE tool calls before it was stopped after the requested evidence fields had been probed.

## Tool boundary observed

- Dataset and software link calls reported non-zero totals, but returned no rows on pages 1 or 2.
- Relationship probes for `isSupplementedBy`, `isRelatedTo`, `isSupplementTo`, and `compiles` did not surface typed dataset or software rows.
- The full research-product response used by the demo did not surface organisation/country fields in the rendered result.
- EC funding was confirmed, but the trace did not directly surface the three named project objects (`QIA-Phase1`, `QUANGO`, `QSNP`) that are present in the frozen API record.

These are **not null findings about the OpenAIRE Graph**. They are relations not observable through this particular MCP/demo trace. The direct API audit remains canonical because it preserves raw result objects, sweeps all research-product links, and publishes every denominator.

## Comparison with the frozen API audit

| Evidence question | Direct API audit | Alien / OpenAIRE MCP trace |
| --- | --- | --- |
| Record identity | Exact DOI and OpenAIRE ID | Exact match |
| Publication year | 2024 | 2024 |
| EC project signal | Three project objects with EC funder data | Project/funding relation confirmed |
| Named projects | QIA-Phase1, QUANGO, QSNP | Not surfaced in the executed trace |
| Dataset | One Figshare collection edge | Non-zero total; rows not returned |
| Software | Two code-record edges | Non-zero total; rows not returned |
| Role in the artifact | Canonical census and metrics | Human-facing interoperability cross-check |

## Decision

Keep the direct OpenAIRE Graph API pipeline as the reproducible, denominator-complete method. Publish this MCP trace as an honest cross-check that confirms record identity and the EC project signal while exposing pagination and field-surfacing limits in the current agent route.

## Reproduction

1. Sign in to the official Alien Intelligence OpenAIRE demo.
2. Submit the prompt above without altering the DOI.
3. Expand the tool-call trace and record the returned OpenAIRE ID, relation totals, row counts, and project filter result.
4. Treat absent rendered relations as “not observable through this run.”
5. Compare the response with `evidence-snapshot.json` and the frozen API record before drawing any substantive conclusion.

Official hackathon call: `https://innovation.openaire.eu/component/content/article/openaire-ai-hackathon.html?catid=8`

