# Open Quantum Evidence Atlas

An interactive OpenAIRE evidence-chain audit of EU–Japan quantum research. The artifact traces how observable links fall from funding and projects to datasets and software, then uses Q‑NEKO as a prospective policy-observability benchmark.

The `/audit` route is a reusable Evidence Chain Auditor. It filters and recomputes the verified snapshot, accepts compatible JSON snapshots, extracts high-completeness records, exports JSON/CSV/Markdown results, and performs a live OpenAIRE alias preflight.

## Headline finding

Among 645 EU27–Japan quantum publications from 2020–2026, 60.8% connect to a project and funder. In the 250-record Scholix audit, 27.2% connect to a dataset and 8.8% to software. A stricter 87-record title-literal sensitivity check preserves the pattern.

“Connected” means at least one explicit OpenAIRE edge. An absent edge means not observable in the Graph; it is not evidence that the underlying output does not exist.

## Run and verify

```bash
npm install
npm run dev
npm test
```

The test suite performs a production build, server-renders the artifact, verifies social metadata, and checks the published metric denominators.

## Reproducibility

The public reproducibility pack includes:

- `public/evidence-snapshot.json` — bounded result snapshot and metric semantics
- `public/connection-rates.csv` — connection numerators, denominators and intervals
- `public/reproducibility/openaire_feasibility.py` — OpenAIRE extraction/audit pipeline
- `public/reproducibility/openaire_connection_rates.ipynb` — executed notebook
- `public/reproducibility/eu27_japan_corpus.csv` — the deduplicated observed corpus
- `public/reproducibility/scholix_link_audit.csv` — audited research-product links
- `public/submission-story.md` — the required 1–2 page hackathon story

Snapshot timestamp: `2026-07-18T01:20:47Z`.

## License

Artifact and story: CC BY 4.0. Code: MIT.
