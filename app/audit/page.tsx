"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "./audit.css";

type AuditRecord = {
  id: string;
  title: string;
  publication_date: string;
  doi: string | null;
  matched_terms: string[];
  countries: string[];
  strict_title_match: boolean;
  project_connected: boolean;
  funding_connected: boolean;
  project_count: number;
  funder_count: number;
  link_audited?: boolean;
  broad_sample: boolean;
  dataset_connected: boolean | null;
  dataset_outgoing_links: number | null;
  dataset_incoming_links: number | null;
  software_connected: boolean | null;
  software_outgoing_links: number | null;
  software_incoming_links: number | null;
};

type AuditDataset = {
  schema_version: number;
  generated_at: string;
  title: string;
  description?: string;
  terms: string[];
  countries: string[];
  records: AuditRecord[];
};

type Filters = {
  query: string;
  term: string;
  country: string;
  fromYear: number;
  toYear: number;
  scope: "broad" | "strict";
};

type Metric = { label: string; connected: number; audited: number; rate: number; low: number; high: number; color: string };

type WatchlistResult = {
  checked_at: string;
  aliases: Array<{
    alias: string;
    projects: { count: number; query_url: string; items: Array<{ id?: string; code?: string; acronym?: string; title?: string }> };
    products: { count: number; query_url: string; items: Array<{ id?: string; title?: string; publication_date?: string }> };
  }>;
  totals: { project_alias_hits: number; product_alias_hits: number };
  semantics: string;
};

const DEFAULT_FILTERS: Filters = { query: "", term: "all", country: "all", fromYear: 2020, toYear: 2026, scope: "broad" };
const DEFAULT_ALIASES = "Q-Neko\nQNEKO\nNippon-Europe Quantum Koraborēshon\nHORIZON-EUROHPC-JU-2024-INCO-06";

function wilson(successes: number, total: number) {
  if (!total) return [0, 0];
  const z = 1.96;
  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const centre = (p + (z * z) / (2 * total)) / denominator;
  const half = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total)) / denominator;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

function metric(label: string, rows: AuditRecord[], field: "project_connected" | "funding_connected" | "dataset_connected" | "software_connected", color: string): Metric {
  const audited = rows.length;
  const connected = rows.filter((row) => row[field] === true).length;
  const [low, high] = wilson(connected, audited);
  return { label, connected, audited, rate: audited ? (connected / audited) * 100 : 0, low: low * 100, high: high * 100, color };
}

function download(filename: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function evidenceState(record: AuditRecord, field: "project_connected" | "funding_connected" | "dataset_connected" | "software_connected", scope: Filters["scope"]) {
  if ((field === "dataset_connected" || field === "software_connected") && !recordLinkAudited(record, scope)) return "not-audited";
  if (record[field] === null) return "not-audited";
  return record[field] ? "connected" : "not-observable";
}

function recordLinkAudited(record: AuditRecord, scope: Filters["scope"]) {
  return record.dataset_connected !== null && (scope === "strict" ? record.strict_title_match : (record.link_audited ?? record.broad_sample));
}

export default function AuditLab() {
  const [dataset, setDataset] = useState<AuditDataset | null>(null);
  const [datasetMode, setDatasetMode] = useState<"bundled" | "uploaded">("bundled");
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS);
  const [runNumber, setRunNumber] = useState(1);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Loading the verified snapshot…");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aliases, setAliases] = useState(DEFAULT_ALIASES);
  const [watchlist, setWatchlist] = useState<WatchlistResult | null>(null);
  const [watchStatus, setWatchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [watchError, setWatchError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/audit-dataset.json")
      .then((response) => {
        if (!response.ok) throw new Error("Snapshot could not be loaded");
        return response.json();
      })
      .then((data: AuditDataset) => {
        setDataset(data);
        setMessage(`${data.records.length} verified records ready`);
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => {
    if (!dataset) return [];
    const query = applied.query.trim().toLowerCase();
    return dataset.records.filter((record) => {
      const year = Number(record.publication_date?.slice(0, 4));
      return (!query || record.title.toLowerCase().includes(query) || record.doi?.toLowerCase().includes(query))
        && (applied.term === "all" || record.matched_terms.includes(applied.term))
        && (applied.country === "all" || record.countries.includes(applied.country))
        && year >= applied.fromYear && year <= applied.toYear
        && (applied.scope === "broad" || record.strict_title_match);
    });
  }, [dataset, applied]);

  const linkAudited = useMemo(() => filtered.filter((record) => recordLinkAudited(record, applied.scope)), [filtered, applied.scope]);
  const linkAuditedIds = useMemo(() => new Set(linkAudited.map((record) => record.id)), [linkAudited]);
  const metrics = useMemo(() => [
    metric("Project", filtered, "project_connected", "#c9ff3d"),
    metric("Funding", filtered, "funding_connected", "#c9ff3d"),
    metric("Dataset", linkAudited, "dataset_connected", "#5cc8ff"),
    metric("Software", linkAudited, "software_connected", "#a18cff"),
  ], [filtered, linkAudited]);

  const candidates = useMemo(() => [...filtered]
    .filter((record) => record.project_connected || (linkAuditedIds.has(record.id) && (record.dataset_connected || record.software_connected)))
    .sort((a, b) => {
      const score = (record: AuditRecord) => Number(record.project_connected) + Number(record.funding_connected) + (linkAuditedIds.has(record.id) ? Number(record.dataset_connected) + Number(record.software_connected) : 0);
      return score(b) - score(a) || b.publication_date.localeCompare(a.publication_date);
    })
    .slice(0, 12), [filtered, linkAuditedIds]);

  const selected = candidates.find((record) => record.id === selectedId) ?? candidates[0] ?? null;
  const completeChains = linkAudited.filter((record) => record.project_connected && record.funding_connected && record.dataset_connected && record.software_connected).length;
  const gapRatio = metrics[3].rate ? metrics[1].rate / metrics[3].rate : null;

  function runAudit(event: FormEvent) {
    event.preventDefault();
    setRunning(true);
    setMessage("Recomputing denominators and evidence states…");
    window.setTimeout(() => {
      setApplied(draft);
      setRunNumber((value) => value + 1);
      setSelectedId(null);
      setRunning(false);
      setMessage("Audit complete · exports ready");
    }, 360);
  }

  async function loadBundled() {
    const response = await fetch("/audit-dataset.json");
    const data = await response.json() as AuditDataset;
    setDataset(data);
    setDatasetMode("bundled");
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setSelectedId(null);
    setMessage(`${data.records.length} verified records restored`);
  }

  async function uploadDataset(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AuditDataset | AuditRecord[];
      const data: AuditDataset = Array.isArray(parsed)
        ? { schema_version: 1, generated_at: new Date().toISOString(), title: file.name, terms: [], countries: [], records: parsed }
        : parsed;
      if (!Array.isArray(data.records) || !data.records.length || !data.records.every((record) => record.id && record.title)) throw new Error("The JSON does not match the audit record schema.");
      data.terms = data.terms?.length ? data.terms : [...new Set(data.records.flatMap((record) => record.matched_terms ?? []))].sort();
      data.countries = data.countries?.length ? data.countries : [...new Set(data.records.flatMap((record) => record.countries ?? []).filter((country) => country !== "JP"))].sort();
      data.records = data.records.map((record) => ({
        ...record,
        matched_terms: record.matched_terms ?? [],
        countries: record.countries ?? [],
        link_audited: record.link_audited ?? record.broad_sample ?? (record.dataset_connected !== null),
        broad_sample: record.broad_sample ?? (record.dataset_connected !== null),
        strict_title_match: record.strict_title_match ?? false,
      }));
      setDataset(data);
      setDatasetMode("uploaded");
      setDraft(DEFAULT_FILTERS);
      setApplied(DEFAULT_FILTERS);
      setSelectedId(null);
      setMessage(`${data.records.length} uploaded records ready`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      event.target.value = "";
    }
  }

  function exportJson() {
    download("evidence-audit.json", "application/json", JSON.stringify({ generated_at: new Date().toISOString(), source: dataset?.title, filters: applied, metrics, complete_chains: completeChains, records: filtered }, null, 2));
  }

  function exportCsv() {
    const headers = ["id", "title", "publication_date", "doi", "countries", "project", "funding", "dataset", "software"];
    const rows = filtered.map((record) => [record.id, record.title, record.publication_date, record.doi, record.countries.join(";"), record.project_connected, record.funding_connected, record.dataset_connected, record.software_connected]);
    download("evidence-audit.csv", "text/csv", [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n"));
  }

  function exportBrief() {
    const lines = [
      "# Evidence Chain Audit — Decision Brief", "",
      `Generated: ${new Date().toISOString()}`, `Source: ${dataset?.title ?? "Uploaded snapshot"}`, "",
      "## Scope", "", `- Records after filters: ${filtered.length}`, `- Link-audited denominator: ${linkAudited.length}`, `- Complete project→data→software chains: ${completeChains}`, "",
      "## Connection rates", "", ...metrics.map((item) => `- ${item.label}: ${item.rate.toFixed(1)}% (${item.connected}/${item.audited}; Wilson 95% CI ${item.low.toFixed(1)}–${item.high.toFixed(1)})`), "",
      "## Decision", "", gapRatio ? `Funding visibility is ${gapRatio.toFixed(1)}× software visibility in this filtered scope. Prioritise persistent software and repository identifiers, then re-run this audit.` : "Software has no observable links in the audited denominator. Verify repository identifiers before interpreting this as no software output.", "",
      "## Semantics", "", "An absent OpenAIRE edge means not observable for this audit; it does not prove that no underlying output exists.",
    ];
    download("evidence-audit-brief.md", "text/markdown", lines.join("\n"));
  }

  async function checkWatchlist(event: FormEvent) {
    event.preventDefault();
    const values = aliases.split("\n").map((value) => value.trim()).filter(Boolean);
    setWatchStatus("loading");
    setWatchError("");
    try {
      const response = await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aliases: values }) });
      const data = await response.json() as WatchlistResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Live lookup failed");
      setWatchlist(data);
      setWatchStatus("idle");
    } catch (error) {
      setWatchStatus("error");
      setWatchError(error instanceof Error ? error.message : "Live lookup failed");
    }
  }

  return (
    <main className="audit-page">
      <header className="audit-nav audit-shell">
        <Link href="/" className="audit-brand"><span aria-hidden="true">◉</span><span>OPEN QUANTUM<br />EVIDENCE ATLAS</span></Link>
        <div className="audit-nav-state"><i /> AUDITOR · PUBLIC BETA</div>
        <Link href="/" className="audit-back">Read the case study ↗</Link>
      </header>

      <section className="audit-hero audit-shell">
        <div>
          <p className="audit-kicker">EVIDENCE CHAIN AUDITOR · V1</p>
          <h1>Turn a policy question<br />into an <em>evidence audit.</em></h1>
          <p>Filter a verified OpenAIRE snapshot, recompute every denominator, surface the strongest chains and export a decision-ready result.</p>
          <a className="audit-cta" href="#configure">Configure the audit <span>↓</span></a>
        </div>
        <aside className="audit-manifest">
          <span>RUNTIME CONTRACT</span>
          <ol>
            <li><b>01</b><p>Choose scope</p><i>topic · partner · years</i></li>
            <li><b>02</b><p>Run audit</p><i>rates · uncertainty · states</i></li>
            <li><b>03</b><p>Inspect chain</p><i>project · data · software</i></li>
            <li><b>04</b><p>Export decision</p><i>JSON · CSV · Markdown</i></li>
          </ol>
        </aside>
      </section>

      <section className="audit-workbench" id="configure">
        <div className="audit-shell">
          <div className="audit-section-head">
            <div><p className="audit-kicker acid">01 · CONFIGURE</p><h2>Define the evidence boundary.</h2></div>
            <div className="dataset-tools">
              <span className={`dataset-badge ${datasetMode}`}>{datasetMode === "bundled" ? "Verified snapshot" : "Uploaded snapshot"}</span>
              <button type="button" onClick={() => uploadRef.current?.click()}>Upload JSON</button>
              {datasetMode === "uploaded" && <button type="button" onClick={loadBundled}>Restore verified</button>}
              <input ref={uploadRef} type="file" accept="application/json,.json" onChange={uploadDataset} hidden />
            </div>
          </div>

          <form className="audit-form" onSubmit={runAudit}>
            <label className="field field-wide"><span>Title or DOI contains</span><input value={draft.query} onChange={(event) => setDraft({ ...draft, query: event.target.value })} placeholder="e.g. quantum network" /></label>
            <label className="field"><span>Research theme</span><select value={draft.term} onChange={(event) => setDraft({ ...draft, term: event.target.value })}><option value="all">All quantum themes</option>{dataset?.terms.map((term) => <option value={term} key={term}>{term}</option>)}</select></label>
            <label className="field"><span>Partner country</span><select value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })}><option value="all">Any partner country</option>{dataset?.countries.map((country) => <option value={country} key={country}>{country}</option>)}</select></label>
            <label className="field"><span>From year</span><input type="number" min="2020" max={draft.toYear} value={draft.fromYear} onChange={(event) => setDraft({ ...draft, fromYear: Number(event.target.value) })} /></label>
            <label className="field"><span>To year</span><input type="number" min={draft.fromYear} max="2026" value={draft.toYear} onChange={(event) => setDraft({ ...draft, toYear: Number(event.target.value) })} /></label>
            <fieldset className="scope-field"><legend>Evidence scope</legend><button type="button" className={draft.scope === "broad" ? "active" : ""} onClick={() => setDraft({ ...draft, scope: "broad" })}><span>Broad</span><small>matched query</small></button><button type="button" className={draft.scope === "strict" ? "active" : ""} onClick={() => setDraft({ ...draft, scope: "strict" })}><span>Strict</span><small>phrase in title</small></button></fieldset>
            <button className="run-button" type="submit" disabled={!dataset || running}>{running ? "Running audit…" : "Run evidence audit"}<span aria-hidden="true">→</span></button>
          </form>
          <div className="audit-status" aria-live="polite"><span>AUDIT #{String(runNumber).padStart(2, "0")}</span><i className={running ? "running" : ""} />{message}</div>
        </div>
      </section>

      <section className="audit-results audit-shell">
        <div className="audit-section-head results-head">
          <div><p className="audit-kicker">02 · RESULTS</p><h2>The evidence signal.</h2></div>
          <div className="result-summary"><span><b>{filtered.length}</b> records</span><span><b>{linkAudited.length}</b> link-audited</span><span><b>{completeChains}</b> complete chains</span></div>
        </div>

        <div className="audit-metrics">
          {metrics.map((item) => <article key={item.label} style={{ "--metric-color": item.color } as React.CSSProperties}>
            <div><span>{item.label}</span><i /></div><strong>{item.rate.toFixed(1)}<small>%</small></strong>
            <div className="metric-track"><span style={{ width: `${item.rate}%` }} /></div>
            <p>{item.connected} / {item.audited}<span>CI {item.low.toFixed(1)}–{item.high.toFixed(1)}</span></p>
          </article>)}
          <article className="ratio-card"><div><span>Funding → software</span></div><strong>{gapRatio ? gapRatio.toFixed(1) : "∞"}<small>×</small></strong><p>{gapRatio ? "visibility gap" : "no software edge observed"}</p></article>
        </div>

        <div className="chain-lab">
          <div className="chain-list">
            <div className="chain-list-head"><div><p className="audit-kicker">03 · CHAINS</p><h3>Highest-completeness records</h3></div><span>{candidates.length} shown</span></div>
            <div className="chain-table" role="list">
              {candidates.map((record) => <button type="button" role="listitem" key={record.id} className={selected?.id === record.id ? "active" : ""} onClick={() => setSelectedId(record.id)}>
                <span className="record-title"><b>{record.title}</b><small>{record.publication_date?.slice(0, 4)} · {record.countries.join(" · ")}</small></span>
                {(["project_connected", "funding_connected", "dataset_connected", "software_connected"] as const).map((field) => <i key={field} className={`evidence-dot ${evidenceState(record, field, applied.scope)}`} title={`${field}: ${evidenceState(record, field, applied.scope)}`} />)}
                <span className="row-arrow">→</span>
              </button>)}
              {!candidates.length && <p className="empty-state">No connected records match this boundary. Broaden the filters or inspect the zero as an observability result.</p>}
            </div>
            <div className="chain-legend"><span><i className="evidence-dot connected" /> connected</span><span><i className="evidence-dot not-observable" /> not observable</span><span><i className="evidence-dot not-audited" /> not audited</span><b>PROJECT · FUNDING · DATA · CODE</b></div>
          </div>

          <aside className="record-inspector">
            {selected ? <>
              <p className="audit-kicker acid">SELECTED RECORD</p>
              <h3>{selected.title}</h3>
              <p className="record-meta">{selected.publication_date} · {selected.doi ?? "No DOI"}</p>
              <div className="inspector-states">
                {(["project_connected", "funding_connected", "dataset_connected", "software_connected"] as const).map((field) => <div key={field}><i className={`evidence-dot ${evidenceState(selected, field, applied.scope)}`} /><span>{field.replace("_connected", "")}</span><b>{evidenceState(selected, field, applied.scope).replaceAll("-", " ")}</b></div>)}
              </div>
              <dl><div><dt>Projects</dt><dd>{selected.project_count}</dd></div><div><dt>Funders</dt><dd>{selected.funder_count}</dd></div><div><dt>Dataset links</dt><dd>{recordLinkAudited(selected, applied.scope) ? (selected.dataset_outgoing_links ?? 0) + (selected.dataset_incoming_links ?? 0) : "—"}</dd></div><div><dt>Software links</dt><dd>{recordLinkAudited(selected, applied.scope) ? (selected.software_outgoing_links ?? 0) + (selected.software_incoming_links ?? 0) : "—"}</dd></div></dl>
              <div className="inspector-links">{selected.doi && <a href={`https://doi.org/${selected.doi}`} target="_blank" rel="noreferrer">Open DOI ↗</a>}<a href={`https://explore.openaire.eu/search/result?id=${encodeURIComponent(selected.id)}`} target="_blank" rel="noreferrer">OpenAIRE record ↗</a></div>
            </> : <p>Select a result to inspect its evidence states.</p>}
          </aside>
        </div>

        <div className="export-bar">
          <div><p className="audit-kicker">04 · EXPORT</p><h3>Take the audit with you.</h3><p>Every export includes the applied filters and denominator.</p></div>
          <div><button type="button" onClick={exportJson}>Evidence <b>JSON ↓</b></button><button type="button" onClick={exportCsv}>Records <b>CSV ↓</b></button><button type="button" onClick={exportBrief}>Policy brief <b>MD ↓</b></button></div>
        </div>
      </section>

      <section className="live-section">
        <div className="audit-shell live-grid">
          <div className="live-copy"><p className="audit-kicker acid">05 · LIVE OBSERVABILITY</p><h2>Check a project<br />before drawing conclusions.</h2><p>Alias lookup queries OpenAIRE now. It is a preflight check, not a substitute for the full snapshot audit.</p></div>
          <form className="watch-form" onSubmit={checkWatchlist}>
            <label><span>One alias or call identifier per line · max 5</span><textarea value={aliases} onChange={(event) => setAliases(event.target.value)} rows={6} /></label>
            <button type="submit" disabled={watchStatus === "loading"}>{watchStatus === "loading" ? "Checking OpenAIRE…" : "Check OpenAIRE live"}<span>↗</span></button>
            {watchError && <p className="watch-error">{watchError}</p>}
          </form>
          <div className="watch-results" aria-live="polite">
            {watchlist ? <>
              <div className="watch-totals"><div><strong>{watchlist.totals.project_alias_hits}</strong><span>project alias hits</span></div><div><strong>{watchlist.totals.product_alias_hits}</strong><span>product alias hits</span></div></div>
              <div className="watch-queries">{watchlist.aliases.map((item) => <details key={item.alias}><summary><span>{item.alias}</span><b>{item.projects.count}P · {item.products.count}R</b></summary><div><a href={item.projects.query_url} target="_blank" rel="noreferrer">Project query ↗</a><a href={item.products.query_url} target="_blank" rel="noreferrer">Product query ↗</a>{[...item.projects.items, ...item.products.items].slice(0, 3).map((result, index) => <p key={`${item.alias}-${index}`}>{result.title ?? result.acronym ?? result.code ?? result.id}</p>)}</div></details>)}</div>
              <p className="watch-semantics">Checked {new Date(watchlist.checked_at).toLocaleString()} · {watchlist.semantics}</p>
            </> : <div className="watch-placeholder"><span>LIVE</span><p>Run the Q‑NEKO aliases to reproduce the observation-lag check against OpenAIRE.</p></div>}
          </div>
        </div>
      </section>

      <footer className="audit-footer"><div className="audit-shell"><span>OPEN QUANTUM EVIDENCE ATLAS</span><p>Snapshot audit + live project preflight · CC BY 4.0</p><Link href="/">Case study ↗</Link></div></footer>
    </main>
  );
}
