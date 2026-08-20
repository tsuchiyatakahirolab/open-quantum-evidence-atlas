# Alien / OpenAIRE MCP pagination diagnostic

**Executed:** 18 July 2026  
**Routes:** Official Alien Intelligence OpenAIRE demo and OpenAIRE Graph API

**Model shown by the demo:** Sonnet 4.6

**Purpose:** Separate a genuine evidence null from a recoverable MCP integration defect.

**Stable submission diagnostic:** https://atlas.tsuchiyatakahiro.com/reproducibility/openaire-mcp-crosscheck.md

## Replay prompt

The public reviewer prompt that bounded the run was:

> Using the OpenAIRE Graph only, cross-check DOI 10.1088/1367-2630/ad5b13. Return identity, funding, projects, organisations, datasets, software and provenance. Treat missing relations as not observable.

This prompt fixes the record, requested entity types and missing-edge semantics. The deterministic API audit—not generated prose—remains the source of every aggregate rate.

## Initial cross-check

The authenticated Alien/OpenAIRE run used 30 OpenAIRE MCP calls. It directly established:

- DOI `10.1088/1367-2630/ad5b13` resolves to `doi_dedup___::82d8842e25b2e9bdbe03ab4c5db972db`.
- The record is a 2024 publication.
- DOI plus `rel_project_code=101102140` returns exactly the target record, confirming EC grant **QIA-Phase1**.
- `get_research_links(target_type=dataset)` reported `total: 1` but returned no rows on pages 1 and 2.
- `get_research_links(target_type=software)` reported `total: 2` but returned no rows on pages 1 and 2.

The last two observations initially looked like a pagination boundary. They were then isolated in a controlled comparison.

## Root cause

The official OpenAPI definition for `GET /v1/researchProducts/links` gives `page` a default of `0`. Direct calls confirm that this operation is zero-indexed for the tested record:

| Target type | Page | `totalLinks` | Rows returned |
| --- | ---: | ---: | ---: |
| dataset | 0 | 1 | 1 |
| dataset | 1 | 1 | 0 |
| dataset | 2 | 1 | 0 |
| software | 0 | 2 | 2 |
| software | 1 | 2 | 0 |
| software | 2 | 2 | 0 |

Two targeted Alien MCP calls then explicitly requested `page=0`. Both failed validation before an upstream URL was produced. The demo reported that `ResearchLinksInput` requires `page` to be greater than or equal to `1`.

This is an **off-by-one contract mismatch in the MCP wrapper**:

- upstream link operation: zero-indexed, default page 0;
- Alien MCP input model: page 1 or greater;
- effect for result sets smaller than one page: the only data page is skipped while the total count remains visible.

It is not an OpenAIRE data-null and not an upstream pagination failure.

## Rows recovered at page 0

### Dataset

- **Title:** Quantum-limited measurements of optical signals from a geostationary satellite
- **Type:** dataset / Collection
- **DOI:** `10.6084/m9.figshare.c.3813670`
- **Relation:** `references`
- **Provenance:** OpenAIRE

### Software

1. **netsquid-freespace software on GitHub**

   OpenAIRE ID: `openaire____::0203e43bc9da9dd3318eede5cd1e5544`
2. **quantumcity software on GitHub**

   OpenAIRE ID: `openaire____::4f63b22fef29eff8bc0dc768945bfe9c`

Both software rows are typed as software, carry a `cites` relation, have OpenAIRE provenance, and were collected from GitHub and Software Heritage.

## Corrective action

Either server-side repair is sufficient:

1. define the MCP `page` field with a default of `0` and minimum of `0`; or
2. retain a one-indexed MCP interface and send `page - 1` to this upstream link operation.

A regression test should request a known one-row dataset relation and verify that the first MCP page returns the row rather than only `totalLinks`.

Until the MCP wrapper is repaired, the Atlas uses the direct link endpoint with `page=0` as its reproducible fallback. A non-zero total with an empty result page is classified as a tool inconsistency, not as “no relation.”

## Time-bounded rechecks

An uncached bounded recheck on 29 July 2026 reconfirmed the representative contract: the featured DOI and grant resolved, page 0 returned one dataset and two software rows, and page 1 returned no rows despite retaining the same non-zero totals. All eight discovery-query counts matched the full refresh, while the four Q‑NEKO aliases returned no project or product hits.

On 20 August the same bounded contract detected continuing Graph drift. The featured dataset total remained at zero, so that relation no longer tests pagination; the two software rows remained on page 0 while page 1 returned none, so the connector defect remains reproducible. All eight discovery totals differed from the 29 July snapshot. Q‑NEKO appeared as one exact project record plus five raw research-product alias hits; the Atlas's two indexed Zenodo releases were excluded, and the remaining three records were independently returned by `relProjectCode=101241875`. These are explicit graph links, not causal proof of grant production or reuse. The machine-readable result and source are published as `live-recheck.json` and `openaire_live_recheck.py`.

## Reproduction

Run `openaire_mcp_pagination_repro.py` in this directory. It queries page 0 and page 1 for both target types, prints the returned titles and identifiers, and marks whether the mismatch is reproduced.

- Official OpenAPI: `https://api.openaire.eu/graph/v3/api-docs`
- Swagger UI: `https://api.openaire.eu/graph/swagger-ui/index.html`
- Alien demo: `https://demo.alien.club/openaire`
- Hackathon call: `https://innovation.openaire.eu/component/content/article/openaire-ai-hackathon.html?catid=8`
