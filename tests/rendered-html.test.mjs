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
  assert.match(html, /<title>Open Quantum Evidence Atlas \| EU–Japan<\/title>/i);
  assert.match(html, /Funding is visible\./i);
  assert.match(html, /Trace a complete chain/i);
  assert.match(html, /Q‑NEKO is the test case/i);
  assert.match(html, /Build the broad Atlas/i);
  assert.match(html, /property="og:image" content="http:\/\/localhost(?::3000)?\/og-atlas-v1\.1\.png"/i);
  assert.match(html, /role="tablist"/i);
  assert.match(html, /Wilson 95% confidence intervals/i);
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
});

test("publishes a denominator-complete reproducibility pack", async () => {
  const [snapshotText, ratesText, storyText, imageInfo] = await Promise.all([
    readFile(new URL("../public/evidence-snapshot.json", import.meta.url), "utf8"),
    readFile(new URL("../public/connection-rates.csv", import.meta.url), "utf8"),
    readFile(new URL("../public/submission-story.md", import.meta.url), "utf8"),
    stat(new URL("../public/og-atlas-v1.1.png", import.meta.url)),
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
  assert.ok(imageInfo.size > 100_000, "social preview should be a real raster asset");
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
