import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the evidence atlas and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const visibleHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>Open Quantum Evidence Atlas \| EU–Japan<\/title>/i);
  assert.match(html, /Funding is visible\./i);
  assert.match(visibleHtml, /Only\s+17 of 645 EU–Japan quantum publications/i);
  assert.match(html, /Watch the 119s demo/i);
  assert.match(html, /Alien \/ OpenAIRE MCP cross-check/i);
  assert.match(html, /<b>30<\/b>\s*initial MCP calls/i);
  assert.match(html, /Page 0 has the rows/i);
  assert.match(html, /MCP schema\/offset defect/i);
  assert.match(html, /Static integration diagnostic/i);
  assert.match(visibleHtml, /6\/6 integrity checks passed/i);
  assert.match(visibleHtml, /8\/8 discovery counts unchanged/i);
  assert.match(visibleHtml, /Full census.*645 IDs.*exact match/i);
  assert.match(html, /Q‑NEKO is the test case/i);
  assert.match(html, /Build the broad Atlas/i);
  assert.match(html, /property="og:image" content="http:\/\/localhost(?::3000)?\/og-atlas-v1\.2\.png"/i);
  assert.match(html, /role="tablist"/i);
  assert.match(html, /Wilson 95% binomial reference bands/i);
});

test("server-renders the reusable Evidence Chain Auditor", async () => {
  const response = await render("/audit");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Evidence Chain Auditor/i);
  assert.match(html, /Turn a policy question/i);
  assert.match(html, /Run evidence audit/i);
  assert.match(html, /Check OpenAIRE live/i);
  assert.match(html, /Upload JSON/i);
  assert.match(html, /directional relation rows/i);
  assert.match(html, /four software rows resolve to two unique software records/i);
});

test("server-renders the public captioned walkthrough", async () => {
  const response = await render("/video");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /PUBLIC WALKTHROUGH/i);
  assert.match(html, /open-quantum-evidence-atlas-120s\.mp4/i);
  assert.match(html, /Burned-in captions/i);
  assert.match(html, /119-second/i);
});

test("publishes a denominator-complete reproducibility pack", async () => {
  const [snapshotText, ratesText, storyText, mcpText, reproText, recheckText, comparisonText, imageInfo, videoInfo, transcriptInfo] = await Promise.all([
    readFile(new URL("../public/evidence-snapshot.json", import.meta.url), "utf8"),
    readFile(new URL("../public/connection-rates.csv", import.meta.url), "utf8"),
    readFile(new URL("../public/submission-story.md", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/openaire-mcp-crosscheck.md", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/openaire_mcp_pagination_repro.py", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/live-recheck.json", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/refresh-comparison.json", import.meta.url), "utf8"),
    stat(new URL("../public/og-atlas-v1.2.png", import.meta.url)),
    stat(new URL("../public/media/open-quantum-evidence-atlas-120s.mp4", import.meta.url)),
    stat(new URL("../public/media/open-quantum-evidence-atlas-transcript.txt", import.meta.url)),
  ]);

  const snapshot = JSON.parse(snapshotText);
  assert.equal(snapshot.observed_corpus.eu27_japan_publications, 645);
  assert.deepEqual(snapshot.observed_corpus.software, {
    connected: 48,
    audited: 645,
    rate_percent: 7.4,
    wilson_95_percent: [5.7, 9.7],
  });
  assert.equal(snapshot.q_neko_watchlist.openaire_project_union, 0);
  assert.match(ratesText, /observed,software,48,645,7\.4,5\.7,9\.7/);
  assert.match(storyText, /Observation lag—not project failure/i);
  assert.match(mcpText, /default of `0`/i);
  assert.match(mcpText, /ResearchLinksInput.*page.*greater than or equal to `1`/i);
  assert.match(mcpText, /netsquid-freespace software on GitHub/i);
  assert.match(reproText, /"page": page/);
  assert.match(reproText, /"mismatch_reproduced": reproduced/);
  const recheck = JSON.parse(recheckText);
  assert.deepEqual(recheck.summary, {
    checks_passed: 6,
    checks_total: 6,
    term_queries_changed: 0,
    q_neko_project_hits: 0,
    q_neko_product_hits: 0,
  });
  const comparison = JSON.parse(comparisonText);
  assert.equal(comparison.exact_match, true);
  assert.equal(comparison.corpus.new_records, 645);
  assert.equal(comparison.link_audit.state_changes.length, 0);
  assert.ok(imageInfo.size > 100_000, "social preview should be a real raster asset");
  assert.ok(videoInfo.size > 10_000_000, "public walkthrough should be the verified final MP4");
  assert.ok(transcriptInfo.size > 500, "public walkthrough should include a transcript");
});

test("builds an audit dataset that reproduces the published findings", async () => {
  const data = JSON.parse(await readFile(new URL("../public/audit-dataset.json", import.meta.url), "utf8"));
  assert.equal(data.schema_version, 1);
  assert.equal(data.records.length, 645);
  assert.deepEqual(data.checks, {
    records: 645,
    unique_records: 645,
    projects: 392,
    link_rows: 645,
    unique_link_rows: 645,
    missing_link_rows: 0,
    broad_audited: 645,
    broad_datasets: 179,
    broad_software: 48,
    strict_records: 87,
    strict_projects: 45,
    strict_datasets: 21,
    strict_software: 7,
  });
});
