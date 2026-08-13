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

test("serves built assets before application routes", async () => {
  const workerUrl = new URL("../worker.atlas.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const assetResponse = await worker.fetch(
    new Request("http://localhost/assets/example.css"),
    { ASSETS: { fetch: async () => new Response("asset", { status: 200 }) } },
    {},
  );
  assert.equal(await assetResponse.text(), "asset");
});

test("keeps Wrangler bundling enabled for the Cloudflare size limit", async () => {
  const config = await readFile(new URL("../wrangler.atlas.jsonc", import.meta.url), "utf8");
  assert.doesNotMatch(config, /"no_bundle"\s*:\s*true/i);
  assert.doesNotMatch(config, /dist\/server\/\*\*\/\*\.js/i);
});

test("routes POST bodies directly to the application without disturbing them", async () => {
  const workerUrl = new URL("../worker.atlas.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  let assetFetches = 0;

  const response = await worker.fetch(
    new Request("http://localhost/api/watchlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aliases: [] }),
    }),
    { ASSETS: { fetch: async () => { assetFetches += 1; return new Response("asset"); } } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(assetFetches, 0);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Provide 1–5 aliases/i);
});

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
  assert.match(html, /TWO-LAYER OPENAIRE DESIGN/i);
  assert.match(html, /MCP verifies interactively/i);
  assert.match(html, /API counts deterministically/i);
  assert.match(html, /<b>30<\/b>\s*initial MCP calls/i);
  assert.match(html, /Source: OpenAIRE Graph/i);
  assert.match(html, /Page 0 has the rows/i);
  assert.match(html, /MCP schema\/offset defect/i);
  assert.match(html, /Static integration diagnostic/i);
  assert.match(visibleHtml, /8\/8 discovery totals moved/i);
  assert.match(visibleHtml, /Q‑NEKO.*4 raw.*3 self-excluded.*3 grant-linked/i);
  assert.match(visibleHtml, /Featured links now.*0 dataset.*2 software/i);
  assert.match(visibleHtml, /29 Jul census.*645 IDs.*verified/i);
  assert.match(html, /Takahiro Tsuchiya, Ph\.D\./i);
  assert.match(html, /Professor, Kyoto University of Foreign Studies.*individual submission/i);
  assert.match(html, /rel="canonical" href="https:\/\/atlas\.tsuchiyatakahiro\.com"/i);
  assert.match(html, /Q‑NEKO is the test case/i);
  assert.match(html, /Build the broad Atlas/i);
  assert.match(html, /property="og:image" content="http:\/\/localhost(?::3000)?\/og-atlas\.png"/i);
  assert.match(html, /role="tablist"/i);
  assert.match(html, /Wilson 95% binomial reference bands/i);
  assert.match(html, /VERIFY IN 3 MINUTES/i);
  assert.match(html, /POLICY EVALUATOR/i);
  assert.match(html, /RESEARCH FUNDER/i);
  assert.match(html, /OPEN SCIENCE TEAM/i);
  assert.match(html, /DESIGN CONTRAST/i);
  assert.match(html, /Machine-readable MCP run manifest/i);
  assert.match(html, /does not assert.*named grant caused or produced/i);
  assert.match(html, /fresh full census requires (?:an OpenAIRE bearer token|authenticated access)/i);
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
    readFile(new URL("../public/reproducibility/full-census-verification.json", import.meta.url), "utf8"),
    stat(new URL("../public/og-atlas.png", import.meta.url)),
    stat(new URL("../public/media/open-quantum-evidence-atlas-120s.mp4", import.meta.url)),
    stat(new URL("../public/media/open-quantum-evidence-atlas-transcript.txt", import.meta.url)),
  ]);

  const snapshot = JSON.parse(snapshotText);
  assert.equal(snapshot.observed_corpus.eu27_japan_publications, 645);
  assert.equal(snapshot.source.name, "OpenAIRE Graph");
  assert.equal(snapshot.source.license, "CC BY 4.0");
  assert.match(snapshot.source.transformations, /deduplication/i);
  assert.equal(snapshot.license.derived_artifact, "CC BY 4.0");
  assert.deepEqual(snapshot.observed_corpus.software, {
    connected: 48,
    audited: 645,
    rate_percent: 7.4,
    wilson_95_percent: [5.7, 9.7],
  });
  assert.equal(snapshot.q_neko_watchlist.openaire_project_union, 0);
  assert.match(ratesText, /observed,software,48,645,7\.4,5\.7,9\.7/);
  assert.match(storyText, /The clock then moved/i);
  assert.match(storyText, /four raw hits, three self-excluded candidates, and three records explicitly related/i);
  assert.match(mcpText, /default of `0`/i);
  assert.match(mcpText, /## Replay prompt/i);
  assert.match(mcpText, /ResearchLinksInput.*page.*greater than or equal to `1`/i);
  assert.match(mcpText, /netsquid-freespace software on GitHub/i);
  assert.match(reproText, /"page": page/);
  assert.match(reproText, /"mismatch_reproduced": reproduced/);
  const recheck = JSON.parse(recheckText);
  assert.deepEqual(recheck.summary, {
    checks_passed: 4,
    checks_total: 6,
    term_queries_changed: 8,
    q_neko_project_hits: 1,
    q_neko_product_hits: 3,
    q_neko_product_hits_raw: 4,
    q_neko_product_hits_self_excluded: 3,
    q_neko_self_product_hits: 1,
    q_neko_verified_grant_output_hits: 3,
    q_neko_unique_project_records_sampled: 1,
    q_neko_unique_product_records_sampled: 3,
    q_neko_unique_product_records_sampled_raw: 4,
  });
  assert.deepEqual(recheck.request_policy, {
    authenticated: false,
    requests_made: 23,
    unauthenticated_limit_per_hour: 60,
  });
  assert.equal(recheck.q_neko_verified_grant_outputs.project_code, "101241875");
  assert.equal(recheck.q_neko_verified_grant_outputs.verified_hits, 3);
  assert.equal(recheck.q_neko["Q-Neko"].product_samples_self[0].pids[0].value, "10.5281/zenodo.21913414");
  const comparison = JSON.parse(comparisonText);
  assert.equal(comparison.exact_match, true);
  assert.equal(comparison.corpus.records, 645);
  assert.equal(comparison.corpus.ids_verified, 645);
  assert.equal(comparison.link_audit.state_mismatches.length, 0);
  assert.ok(imageInfo.size > 100_000, "social preview should be a real raster asset");
  assert.ok(videoInfo.size > 10_000_000, "public walkthrough should be the verified final MP4");
  assert.ok(transcriptInfo.size > 500, "public walkthrough should include a transcript");
});

test("builds an audit dataset that reproduces the published findings", async () => {
  const data = JSON.parse(await readFile(new URL("../public/audit-dataset.json", import.meta.url), "utf8"));
  assert.equal(data.schema_version, 1);
  assert.equal(data.source.name, "OpenAIRE Graph");
  assert.equal(data.source.license, "CC BY 4.0");
  assert.equal(data.license.derived_artifact, "CC BY 4.0");
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

test("publishes machine-readable MCP, responsibility and FAIR hand-off", async () => {
  const [mcpText, responsibilityText, crateText, guideText] = await Promise.all([
    readFile(new URL("../public/reproducibility/mcp-run-manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/responsible-use-manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../public/ro-crate-metadata.json", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/reviewer-guide.md", import.meta.url), "utf8"),
  ]);

  const mcp = JSON.parse(mcpText);
  assert.equal(mcp.initial_run.mcp_calls, 30);
  assert.equal(mcp.targeted_follow_up.page_zero_mcp_probes_rejected, 2);
  assert.equal(mcp.targeted_follow_up.direct_api_page_zero.dataset_rows, 1);
  assert.equal(mcp.targeted_follow_up.direct_api_page_zero.software_rows, 2);
  assert.match(mcp.targeted_follow_up.classification, /not an OpenAIRE evidence null/i);
  assert.match(mcp.two_layer_architecture.interactive_verification_layer, /Alien\/OpenAIRE MCP/i);
  assert.match(mcp.two_layer_architecture.deterministic_census_layer, /Direct OpenAIRE Graph API/i);

  const responsibility = JSON.parse(responsibilityText);
  assert.equal(responsibility.personal_data.private_or_special_category_data_processed, false);
  assert.equal(responsibility.personal_data.people_ranked_or_profiled, false);
  assert.equal(responsibility.ai_disclosure.quantitative_evidence_generated_by_ai, false);
  assert.ok(responsibility.interpretation_boundaries.length >= 7);
  assert.match(responsibility.api_access_policy.authenticated, /OPENAIRE_ACCESS_TOKEN/);

  const crate = JSON.parse(crateText);
  assert.equal(crate["@context"], "https://w3id.org/ro/crate/1.1/context");
  const root = crate["@graph"].find((entity) => entity["@id"] === "./");
  assert.equal(root.version, "1.0.1");
  assert.equal(root.creativeWorkStatus, "Published");
  assert.equal(root.identifier, "https://doi.org/10.5281/zenodo.21914776");
  assert.ok(root.hasPart.some((part) => part["@id"] === "reproducibility/mcp-run-manifest.json"));
  assert.match(guideText, /three-minute verification guide/i);
  assert.match(guideText, /Confirm responsible and FAIR hand-off/i);
});

test("keeps credential-free review bounded and requires authenticated full refreshes", async () => {
  const [fullPipeline, livePipeline, readme, notebook, analysisRequirements, notebookVerifier] = await Promise.all([
    readFile(new URL("../public/reproducibility/openaire_feasibility.py", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/openaire_live_recheck.py", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../public/reproducibility/openaire_connection_rates.ipynb", import.meta.url), "utf8"),
    readFile(new URL("../requirements-analysis.txt", import.meta.url), "utf8"),
    readFile(new URL("../scripts/verify_notebook.py", import.meta.url), "utf8"),
  ]);

  assert.match(fullPipeline, /OPENAIRE_ACCESS_TOKEN/);
  assert.match(fullPipeline, /Authorization.*Bearer/si);
  assert.match(fullPipeline, /2,580 dataset\/software link checks/);
  assert.match(fullPipeline, /wait_for_rate_slot/);
  assert.match(fullPipeline, /AUTHENTICATED_REQUESTS_PER_SECOND/);
  assert.match(livePipeline, /using 23 public API requests/i);
  assert.match(livePipeline, /UNAUTHENTICATED_REQUEST_LIMIT = 60/);
  assert.match(readme, /Public data snapshot: `2026-07-29T00:13:14Z`/);
  assert.match(readme, /Version `v1\.0\.1` is archived under DOI `10\.5281\/zenodo\.21914776`/);
  assert.match(readme, /latest 2026 publication date.*5 May/i);
  assert.match(readme, /not grant-level attribution/i);
  assert.doesNotMatch(notebook, /legacy sample|250-record/i);
  assert.doesNotMatch(notebook, /"OUT = ROOT.*analysis|ROOT' \/ 'analysis/i);
  assert.match(notebook, /public' \/ 'reproducibility/i);
  assert.match(analysisRequirements, /pandas==3\.0\.1/);
  assert.match(analysisRequirements, /matplotlib==3\.10\.9/);
  assert.match(notebookVerifier, /code-cell-/);
});
