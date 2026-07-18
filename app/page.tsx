"use client";

import { useState } from "react";

type ScopeKey = "observed" | "strict";

const scopes = {
  observed: {
    label: "Observed corpus",
    shortLabel: "Broad",
    count: 645,
    description: "Eight quantum search phrases · EU27 + Japan affiliations · 2020–2026",
    metrics: [
      { label: "Project", value: 60.8, count: "392 / 645", note: "all records audited" },
      { label: "Funding", value: 60.8, count: "392 / 645", note: "all records audited" },
      { label: "Dataset", value: 27.8, count: "179 / 645", note: "95% interval 24.4–31.3" },
      { label: "Software", value: 7.4, count: "48 / 645", note: "95% interval 5.7–9.7" },
    ],
  },
  strict: {
    label: "Title-literal subset",
    shortLabel: "Strict",
    count: 87,
    description: "A sensitivity check: a quantum phrase must appear in the title",
    metrics: [
      { label: "Project", value: 51.7, count: "45 / 87", note: "all records audited" },
      { label: "Funding", value: 51.7, count: "45 / 87", note: "all records audited" },
      { label: "Dataset", value: 24.1, count: "21 / 87", note: "all records audited" },
      { label: "Software", value: 8.0, count: "7 / 87", note: "all records audited" },
    ],
  },
};

const chain = [
  {
    key: "funder",
    step: "01",
    label: "Funder",
    short: "European Commission",
    eyebrow: "Graph-linked funding",
    title: "European Commission",
    body: "The publication carries three result→project edges. Each project edge contains an EC funder object—more reliable here than the top-level publiclyFunded flag.",
    facts: ["Horizon Europe", "Horizon 2020", "3 funded-project edges"],
    link: "https://explore.openaire.eu/search/result?id=doi_dedup___::82d8842e25b2e9bdbe03ab4c5db972db",
    linkLabel: "OpenAIRE record",
  },
  {
    key: "projects",
    step: "02",
    label: "Projects",
    short: "QIA · QUANGO · QSNP",
    eyebrow: "Three linked projects",
    title: "QIA-Phase1 · QUANGO · QSNP",
    body: "One publication is linked to three European quantum-network programmes, creating a visible path from grant identifiers to a research result.",
    facts: ["101102140", "101004341", "101114043"],
    link: "https://doi.org/10.3030/101102140",
    linkLabel: "Example grant DOI",
  },
  {
    key: "institutions",
    step: "03",
    label: "Institutions",
    short: "OIST ↔ European network",
    eyebrow: "Resolved EU–Japan affiliation",
    title: "OIST connects into a European network",
    body: "The graph resolves Okinawa Institute of Science and Technology alongside Leiden, TU Delft, CNRS, Sorbonne, ICFO and LIST. This is the bilateral evidence gate used by the Atlas.",
    facts: ["Japan: OIST", "EU: FR · ES · LU · NL", "Organisation IDs retained"],
    link: "https://ror.org/02qg15b79",
    linkLabel: "OIST ROR record",
  },
  {
    key: "publication",
    step: "04",
    label: "Publication",
    short: "Connecting quantum cities",
    eyebrow: "Open publication · CC BY",
    title: "Connecting quantum cities",
    body: "A 2024 paper simulates a satellite-based European quantum network using NetSquid. It is the centre of the traceable chain—not a hand-picked policy document.",
    facts: ["DOI 10.1088/1367-2630/ad5b13", "Published 1 Jul 2024", "14 citations in snapshot"],
    link: "https://doi.org/10.1088/1367-2630/ad5b13",
    linkLabel: "Open the publication",
  },
  {
    key: "dataset",
    step: "05",
    label: "Dataset",
    short: "Satellite measurement data",
    eyebrow: "Scholix-linked dataset",
    title: "A referenced measurement collection",
    body: "OpenAIRE exposes a references edge to ‘Quantum-limited measurements of optical signals from a geostationary satellite’ on Figshare.",
    facts: ["Dataset edge present", "Figshare collection", "DOI-resolved"],
    link: "https://doi.org/10.6084/m9.figshare.c.3813670",
    linkLabel: "Open the dataset",
  },
  {
    key: "software",
    step: "06",
    label: "Software",
    short: "2 cited code records",
    eyebrow: "Scholix-linked software",
    title: "Two code records complete the chain",
    body: "The paper cites ‘netsquid-freespace’ and ‘quantumcity’ software records collected from GitHub and Software Heritage. This is the kind of reusable output that is visible in only 7.4% of the full observed corpus.",
    facts: ["netsquid-freespace", "quantumcity", "GitHub + Software Heritage"],
    link: "https://explore.openaire.eu/search/result?id=openaire____::0203e43bc9da9dd3318eede5cd1e5544",
    linkLabel: "Open a software record",
  },
];

const stateLegend = [
  { className: "linked", label: "Connected in OpenAIRE" },
  { className: "external", label: "External policy anchor" },
  { className: "missing", label: "Not observable" },
  { className: "unaudited", label: "Not audited" },
];

export default function Home() {
  const [scope, setScope] = useState<ScopeKey>("observed");
  const [selected, setSelected] = useState(0);
  const activeScope = scopes[scope];
  const activeNode = chain[selected];

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Open Quantum Evidence Atlas home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>OPEN QUANTUM<br />EVIDENCE ATLAS</span>
        </a>
        <div className="nav-links">
          <a href="/audit">Run auditor</a>
          <a href="#trace">Trace</a>
          <a href="#mcp">MCP check</a>
          <a href="#watch">Watchlist</a>
          <a href="#method">Method</a>
          <a href="https://github.com/tsuchiyatakahirolab/open-quantum-evidence-atlas" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <span className="audit-stamp"><span /> AUDIT · 18 JUL 2026</span>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>OpenAIRE Graph · Theme C</span><b>EU ↔ JAPAN</b></div>
          <h1>Funding is visible.<br /><em>Reuse is not.</em></h1>
          <p className="hero-lede">
            Across <strong>645 EU–Japan quantum publications</strong>, six in ten connect to a project.
            Fewer than one in ten connects to software in the full-corpus link audit.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/audit">Run the auditor <span aria-hidden="true">→</span></a>
            <a className="button quiet" href="#trace">Trace a complete chain</a>
          </div>
          <p className="source-line">Measured, not model-estimated · OpenAIRE Graph v3 + research-product links</p>
        </div>

        <div className="hero-signal" aria-label="Connection rate falls from project and funding to software">
          <div className="signal-orbit orbit-one" />
          <div className="signal-orbit orbit-two" />
          <div className="signal-grid" aria-hidden="true" />
          <div className="signal-topline"><span>EVIDENCE SIGNAL</span><span>n = 645 / 645</span></div>
          <div className="signal-main">
            <span className="signal-number">60.8</span>
            <span className="signal-arrow">→</span>
            <span className="signal-number dim">7.4</span>
          </div>
          <div className="signal-labels"><span>PROJECT-LINKED</span><span>SOFTWARE-LINKED</span></div>
          <div className="signal-floor">
            <span><i className="status linked" /> Graph edge</span>
            <span><i className="status linked" /> Full-corpus Scholix audit</span>
          </div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Headline evidence metrics">
        <div className="shell metric-strip-inner">
          <div><strong>2,334</strong><span>Japan-query union</span></div>
          <div><strong>645</strong><span>EU27–Japan corpus</span></div>
          <div><strong>392</strong><span>project-linked</span></div>
          <div><strong>179 / 645</strong><span>dataset-linked</span></div>
          <div><strong>48 / 645</strong><span>software-linked</span></div>
        </div>
      </section>

      <section className="section shell" id="finding">
        <div className="section-heading split-heading">
          <div>
            <p className="kicker">01 · THE EVIDENCE GAP</p>
            <h2>The graph sees investment.<br />It loses reusable outputs.</h2>
          </div>
          <p>
            “Connected” means at least one explicit OpenAIRE edge. “Not connected” means the edge was not
            observable—it does <em>not</em> prove that no dataset or software exists.
          </p>
        </div>

        <div className="scope-panel">
          <div className="scope-switch" role="group" aria-label="Choose analysis scope">
            {(Object.keys(scopes) as ScopeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={scope === key ? "active" : ""}
                aria-pressed={scope === key}
                onClick={() => setScope(key)}
              >
                <span>{scopes[key].shortLabel}</span>
                <b>n = {scopes[key].count}</b>
              </button>
            ))}
          </div>
          <div className="scope-meta">
            <span>{activeScope.label}</span>
            <p>{activeScope.description}</p>
          </div>
        </div>

        <div className="finding-grid">
          <div className="metric-rails">
            {activeScope.metrics.map((metric, index) => (
              <div className="rail-row" key={`${scope}-${metric.label}`}>
                <div className="rail-label"><span>{metric.label}</span><b>{metric.value.toFixed(1)}%</b></div>
                <div className="rail-track" aria-label={`${metric.label}: ${metric.value}%`}>
                  <span
                    className={`rail-fill rail-${index}`}
                    style={{ width: `${metric.value}%`, animationDelay: `${index * 70}ms` }}
                  />
                </div>
                <div className="rail-foot"><span>{metric.count}</span><span>{metric.note}</span></div>
              </div>
            ))}
          </div>
          <aside className="gap-card">
            <p>FUNDING → SOFTWARE GAP</p>
            <div className="gap-ratio">8.2<span>×</span></div>
            <h3>A visibility cliff, not a minor drop.</h3>
            <p>The near-identical strict-title result (51.7% → 8.0%) shows the conclusion is not created by the broad search alone.</p>
            <div className="gap-rule"><span /></div>
            <small>Sensitivity check: 87 title-literal records</small>
          </aside>
        </div>
      </section>

      <section className="trace-section" id="trace">
        <div className="shell">
          <div className="section-heading trace-heading">
            <div>
              <p className="kicker light">02 · ONE COMPLETE CHAIN</p>
              <h2>Click the chain.<br />Inspect the evidence.</h2>
            </div>
            <div className="legend" aria-label="Evidence state legend">
              {stateLegend.map((state) => (
                <span key={state.label}><i className={`status ${state.className}`} />{state.label}</span>
              ))}
            </div>
          </div>

          <div className="chain-nav" role="tablist" aria-label="Evidence chain">
            {chain.map((node, index) => (
              <button
                key={node.key}
                type="button"
                role="tab"
                aria-selected={selected === index}
                className={selected === index ? "active" : ""}
                onClick={() => setSelected(index)}
              >
                <span className="chain-step">{node.step}</span>
                <span className="chain-label">{node.label}</span>
                <span className="chain-short">{node.short}</span>
                <i className="status linked" />
              </button>
            ))}
          </div>

          <article className="chain-detail" role="tabpanel" aria-live="polite">
            <div className="detail-index">{activeNode.step}</div>
            <div className="detail-copy">
              <p className="kicker light">{activeNode.eyebrow}</p>
              <h3>{activeNode.title}</h3>
              <p>{activeNode.body}</p>
              <a href={activeNode.link} target="_blank" rel="noreferrer">{activeNode.linkLabel} <span aria-hidden="true">↗</span></a>
            </div>
            <div className="detail-facts">
              {activeNode.facts.map((fact) => <span key={fact}>{fact}</span>)}
            </div>
          </article>
          <p className="chain-provenance">Featured chain: OpenAIRE product <code>doi_dedup___::82d884…</code> · Links independently inspectable above</p>
        </div>
      </section>

      <section className="mcp-section" id="mcp">
        <div className="shell">
          <div className="section-heading split-heading mcp-heading">
            <div>
              <p className="kicker">03 · ALIEN / OPENAIRE MCP CROSS-CHECK</p>
              <h2>The agent found the record.<br />It also found a tool boundary.</h2>
            </div>
            <p>
              On 18 July 2026, the official Alien/OpenAIRE demo re-queried the featured DOI through
              authenticated OpenAIRE tools. This is a single-record interoperability check—not a
              replacement for the frozen 645-record API audit.
            </p>
          </div>

          <div className="mcp-grid">
            <article className="mcp-query-card">
              <div className="mcp-card-top">
                <span><i className="status linked" /> EXECUTED</span>
                <b>OFFICIAL ALIEN DEMO · SONNET 4.6</b>
              </div>
              <p className="mcp-prompt">
                “Using the OpenAIRE Graph only, cross-check DOI
                <strong> 10.1088/1367-2630/ad5b13</strong>. Return identity, funding, projects,
                organisations, datasets, software and provenance. Treat missing relations as not observable.”
              </p>
              <div className="mcp-call-strip">
                <span><b>29</b> tool calls</span>
                <span><b>1</b> exact DOI</span>
                <span><b>0</b> model-estimated metrics</span>
              </div>
              <a href="https://demo.alien.club/openaire" target="_blank" rel="noreferrer">
                Open the official demo <span aria-hidden="true">↗</span>
              </a>
            </article>

            <article className="mcp-findings-card">
              <p className="mcp-label">DIRECTLY OBSERVED IN THE MCP RUN</p>
              <ul>
                <li><span>Identity</span><b>Exact DOI resolved to <code>doi_dedup___::82d884…</code></b></li>
                <li><span>Publication</span><b>2024 record retrieved from OpenAIRE</b></li>
                <li><span>Funding</span><b>EC-linked project signal confirmed</b></li>
                <li><span>Relations</span><b>60 returned link rows, all typed as <code>cites</code></b></li>
              </ul>
            </article>

            <article className="mcp-boundary-card">
              <p className="mcp-label">TOOL BOUNDARY, NOT A NULL FINDING</p>
              <h3>Non-zero totals.<br />Zero typed rows returned.</h3>
              <p>
                The dataset and software link tools reported records in their totals but returned no rows on
                pages 1 or 2. Organisation/country fields and the three named project objects were also not
                surfaced in this trace. Those relations are therefore <strong>not observable through this MCP run</strong>,
                not absent from OpenAIRE.
              </p>
            </article>
          </div>

          <div className="mcp-comparison" role="table" aria-label="API audit and MCP cross-check comparison">
            <div role="row" className="mcp-comparison-head">
              <span role="columnheader">Evidence question</span>
              <span role="columnheader">Frozen API audit</span>
              <span role="columnheader">Alien/OpenAIRE MCP</span>
            </div>
            <div role="row">
              <span role="cell">Record identity</span><b role="cell">Exact match</b><b role="cell">Exact match</b>
            </div>
            <div role="row">
              <span role="cell">EC project signal</span><b role="cell">3 project objects</b><b role="cell">Confirmed; names not surfaced</b>
            </div>
            <div role="row">
              <span role="cell">Dataset / software edges</span><b role="cell">1 dataset · 2 software</b><b role="cell">Typed endpoint pagination boundary</b>
            </div>
            <div role="row">
              <span role="cell">Role in this artifact</span><b role="cell">Canonical census</b><b role="cell">Human-facing cross-check</b>
            </div>
          </div>

          <div className="mcp-footnote">
            <p><strong>Decision:</strong> keep the direct API pipeline as the reproducible denominator-complete method, and publish the MCP trace as an honest interoperability test.</p>
            <a href="/reproducibility/openaire-mcp-crosscheck.md" download>Download executed cross-check record · MD ↓</a>
          </div>
        </div>
      </section>

      <section className="section shell" id="watch">
        <div className="watch-grid">
          <div className="watch-copy">
            <p className="kicker">04 · PROSPECTIVE WATCHLIST</p>
            <h2>Q‑NEKO is the test case.<br /><em>Not the corpus.</em></h2>
            <p>
              Q‑NEKO is the first EU–Japan joint quantum-technology project: €4m in European funding,
              running 2026–2028. At the audit date, four names and identifiers returned no OpenAIRE project
              and no research product.
            </p>
            <div className="watch-actions">
              <a href="https://www.eurohpc-ju.europa.eu/research-innovation/our-projects/q-neko_en" target="_blank" rel="noreferrer">EuroHPC project record ↗</a>
              <a href="https://www8.cao.go.jp/cstp/stmain/20260413ryoshi_en.html" target="_blank" rel="noreferrer">Japan Cabinet Office ↗</a>
            </div>
          </div>

          <div className="watch-card">
            <div className="watch-card-top"><span><i className="status external" /> EXTERNAL ANCHOR</span><b>01 JAN 2026 → 31 DEC 2028</b></div>
            <div className="watch-zero">
              <div><strong>0</strong><span>projects found</span></div>
              <div className="zero-divider" />
              <div><strong>0</strong><span>products found</span></div>
            </div>
            <div className="watch-callout"><i className="status missing" /><p><strong>Observation lag ≠ research failure.</strong><br />It is a measurable delay between policy launch and graph visibility.</p></div>
            <details>
              <summary>Show audited aliases</summary>
              <ul>
                <li>Q-Neko</li>
                <li>QNEKO</li>
                <li>Nippon-Europe Quantum Koraborēshon</li>
                <li>HORIZON-EUROHPC-JU-2024-INCO-06</li>
              </ul>
            </details>
          </div>
        </div>
      </section>

      <section className="decision-section" id="decision">
        <div className="shell">
          <div className="decision-title">
            <p className="kicker">05 · DECISION BRIEF</p>
            <h2>Build the broad Atlas.<br />Use Q‑NEKO as a live benchmark.</h2>
            <p>One policy decision, three operating moves.</p>
          </div>
          <div className="decision-grid">
            <article>
              <span>01</span>
              <h3>Keep the 645-record baseline</h3>
              <p>A Q‑NEKO-only product would currently be an empty graph. The broad cohort supplies a defensible benchmark now.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Make reuse edges a deliverable</h3>
              <p>Require grant, DOI, repository and Software Heritage identifiers to connect before project close—not after evaluation.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Re-audit the policy lag</h3>
              <p>Track when Q‑NEKO first appears, then measure time-to-project, time-to-publication and time-to-reusable-output.</p>
            </article>
          </div>
          <div className="falsification">
            <span>WHAT WOULD CHANGE THE CONCLUSION?</span>
            <p>If added repository identifiers or improved OpenAIRE classification lifts software visibility near the 28% dataset rate, the “software cliff” weakens. This Atlas publishes its denominator so that claim can be tested.</p>
          </div>
          <div className="falsification">
            <span>PROSPECTIVE GQSO PATH</span>
            <p>The Atlas is a standalone OpenAIRE audit today. Connecting its evidence-chain metrics to the Global Quantum Statecraft Observatory is a next-stage integration path—not a current partnership or completed system link.</p>
          </div>
        </div>
      </section>

      <section className="section shell method-section" id="method">
        <div className="section-heading split-heading">
          <div>
            <p className="kicker">06 · REUSE THE AUDIT</p>
            <h2>Every number has<br />a denominator.</h2>
          </div>
          <p>The artifact separates observed links from unknowns, retains API URLs in the analysis cache, and publishes a compact evidence snapshot for independent checking.</p>
        </div>

        <div className="method-grid">
          <ol className="method-steps">
            <li><span>01</span><p><strong>Discover</strong> with eight quantum phrases; deduplicate the Japan-query union.</p></li>
            <li><span>02</span><p><strong>Resolve scope</strong> to 2020–2026 publications with Japan + EU27 affiliations.</p></li>
            <li><span>03</span><p><strong>Audit all 645</strong> for project and funder objects in product links.</p></li>
            <li><span>04</span><p><strong>Audit Scholix links</strong> for all 645 observed records; retain the 87 title-literal sensitivity set.</p></li>
            <li><span>05</span><p><strong>Quantify uncertainty</strong> with Wilson 95% confidence intervals.</p></li>
          </ol>
          <div className="download-card">
            <p>REPRODUCIBILITY PACK</p>
            <a href="/evidence-snapshot.json" download><span>Evidence snapshot</span><b>JSON ↓</b></a>
            <a href="/connection-rates.csv" download><span>Connection rates</span><b>CSV ↓</b></a>
            <a href="/reproducibility/openaire_connection_rates.ipynb" download><span>Executed analysis</span><b>IPYNB ↓</b></a>
            <a href="/analysis-report.md" download><span>Analysis report</span><b>MD ↓</b></a>
            <a href="/reproducibility/openaire_feasibility.py" download><span>Source pipeline</span><b>PY ↓</b></a>
            <a href="/reproducibility/openaire-mcp-crosscheck.md" download><span>Executed MCP cross-check</span><b>MD ↓</b></a>
            <a href="/submission-story.md" download><span>1–2 page story</span><b>MD ↓</b></a>
            <a href="https://api.openaire.eu/graph/v3/researchProducts" target="_blank" rel="noreferrer"><span>OpenAIRE endpoint</span><b>API ↗</b></a>
            <small>Snapshot timestamp: 2026-07-18T05:02:39Z</small>
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <div>
            <span className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>OPEN QUANTUM<br />EVIDENCE ATLAS</span></span>
            <p>Turn bilateral research policy into inspectable evidence.</p>
          </div>
          <div className="footer-meta">
            <a href="https://innovation.openaire.eu/component/content/article/openaire-ai-hackathon.html?catid=8" target="_blank" rel="noreferrer">OpenAIRE AI Hackathon · Theme C ↗</a>
            <a href="https://github.com/tsuchiyatakahirolab/open-quantum-evidence-atlas" target="_blank" rel="noreferrer">Source, data &amp; releases · GitHub ↗</a>
            <a href="https://tsuchiyatakahiro.com/research/open-quantum-evidence-atlas" target="_blank" rel="noreferrer">Research archive · TSUCHIYA Takahiro ↗</a>
            <span>Data: OpenAIRE Graph · External anchors: EuroHPC JU &amp; Cabinet Office of Japan</span>
            <span>Code: MIT · Data, artifact and story: CC BY 4.0</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
