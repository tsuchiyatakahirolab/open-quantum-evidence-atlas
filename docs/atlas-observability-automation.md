# Atlas observability automation

The Atlas follows the same operating boundary as the research database group:
scheduled collection is not automatic publication.

## Lanes

| Lane | Cadence | Access | Purpose | Output |
| --- | --- | --- | --- | --- |
| Bounded | Daily at 06:30 JST | Public API; 22 requests | Compare discovery totals, the featured DOI/grant path, the Scholix page contract, and the Q-NEKO timeline with the latest accepted bounded baseline | Isolated manifest and review bundle |
| Full census | Monday at 06:30 JST, only when enabled | `OPENAIRE_ACCESS_TOKEN` required | Recompute the corpus and all dataset/software relation checks | Isolated census, metric diff, manifest, and review bundle |

The weekly schedule falls back to the bounded lane unless both the repository
variable `ATLAS_FULL_CENSUS_ENABLED=true` and the Actions secret
`OPENAIRE_ACCESS_TOKEN` are present.

## Classification

- `GREEN`: monitored integrity and decision metrics are stable.
- `REVIEW_REQUIRED`: discovery totals, Q-NEKO timeline results, the Scholix
  boundary, the census denominator, or a connection metric changed.
- `CRITICAL`: a featured integrity check failed, the census is incomplete or
  duplicated, the request policy was violated, or the observation could not run.

## Publication gate

Runs write only under the runner's temporary directory and are uploaded as a
30-day GitHub Actions artifact. The workflow has read-only repository
permissions and verifies that no tracked file changed. It cannot commit, push,
merge, deploy, or update the public snapshot.

Promotion remains a separate human-reviewed action:

1. Inspect `review-bundle.md`, `manifest.json`, and any census diff.
2. Reproduce material changes locally when needed.
3. Update metrics, narrative, notebook outputs, and release evidence together.
4. Review the resulting diff and explicitly approve the commit and deployment.

The full-census baseline (`metrics.json`) and bounded-monitoring baseline
(`live-recheck.json`) are intentionally separate. Accepting a bounded drift
does not rewrite the 645-record rates; it only makes the accepted observation
the comparison point for the next scheduled probe.

## Local commands

```text
npm run atlas:ops:bounded
npm run atlas:ops:full
npm run atlas:ops:test
```

The full command requires `OPENAIRE_ACCESS_TOKEN`. Both commands default to an
isolated `.tmp/atlas-observability/<timestamp>` run directory.
