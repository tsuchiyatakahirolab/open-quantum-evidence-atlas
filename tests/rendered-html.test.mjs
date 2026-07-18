import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
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
  assert.match(html, /property="og:image" content="http:\/\/localhost(?::3000)?\/og-atlas\.png"/i);
  assert.match(html, /role="tablist"/i);
  assert.match(html, /Wilson 95% confidence intervals/i);
});

test("publishes a denominator-complete reproducibility pack", async () => {
  const [snapshotText, ratesText, storyText, imageInfo] = await Promise.all([
    readFile(new URL("../public/evidence-snapshot.json", import.meta.url), "utf8"),
    readFile(new URL("../public/connection-rates.csv", import.meta.url), "utf8"),
    readFile(new URL("../public/submission-story.md", import.meta.url), "utf8"),
    stat(new URL("../public/og-atlas.png", import.meta.url)),
  ]);

  const snapshot = JSON.parse(snapshotText);
  assert.equal(snapshot.observed_corpus.eu27_japan_publications, 645);
  assert.deepEqual(snapshot.observed_corpus.software, {
    connected: 22,
    audited: 250,
    rate_percent: 8.8,
    wilson_95_percent: [5.9, 13.0],
  });
  assert.equal(snapshot.q_neko_watchlist.openaire_project_union, 0);
  assert.match(ratesText, /observed,software,22,250,8\.8,5\.9,13\.0/);
  assert.match(storyText, /Observation lag—not project failure/i);
  assert.ok(imageInfo.size > 100_000, "social preview should be a real raster asset");
});
