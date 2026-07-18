import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const corpusPath = new URL("../public/reproducibility/eu27_japan_corpus.csv", import.meta.url);
const linksPath = new URL("../public/reproducibility/scholix_link_audit.csv", import.meta.url);
const metricsPath = new URL("../public/reproducibility/metrics.json", import.meta.url);
const outputPath = new URL("../public/audit-dataset.json", import.meta.url);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift().map((value) => value.replace(/^\uFEFF/, ""));
  return rows.filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

const bool = (value) => String(value).toLowerCase() === "true";
const number = (value) => Number(value || 0);
const list = (value) => String(value || "").split(";").map((item) => item.trim()).filter(Boolean);
const hash = (value) => createHash("sha256").update(value).digest("hex");

const [corpusText, linksText, metricsText] = await Promise.all([
  readFile(corpusPath, "utf8"),
  readFile(linksPath, "utf8"),
  readFile(metricsPath, "utf8"),
]);

const corpus = parseCsv(corpusText);
const links = parseCsv(linksText);
const metrics = JSON.parse(metricsText);
const linksById = new Map(links.map((row) => [row.id, row]));
const broadSampleIds = new Set([...corpus].sort((a, b) => hash(a.id).localeCompare(hash(b.id))).slice(0, 250).map((row) => row.id));

const records = corpus.map((row) => {
  const link = linksById.get(row.id);
  return {
    id: row.id,
    title: row.title,
    publication_date: row.publication_date,
    doi: row.doi || null,
    matched_terms: list(row.matched_terms),
    countries: list(row.countries),
    strict_title_match: bool(row.strict_title_match),
    project_connected: bool(row.project_connected),
    funding_connected: bool(row.funding_connected),
    project_count: number(row.project_count),
    funder_count: number(row.funder_count),
    broad_sample: broadSampleIds.has(row.id),
    dataset_connected: link ? bool(link.dataset_connected) : null,
    dataset_outgoing_links: link ? number(link.dataset_outgoing_links) : null,
    dataset_incoming_links: link ? number(link.dataset_incoming_links) : null,
    software_connected: link ? bool(link.software_connected) : null,
    software_outgoing_links: link ? number(link.software_outgoing_links) : null,
    software_incoming_links: link ? number(link.software_incoming_links) : null,
  };
});

const terms = [...new Set(records.flatMap((record) => record.matched_terms))].sort();
const countries = [...new Set(records.flatMap((record) => record.countries).filter((country) => country !== "JP"))].sort();
const broadAudit = records.filter((record) => record.broad_sample);
const strict = records.filter((record) => record.strict_title_match);

const count = (rows, field) => rows.filter((row) => row[field] === true).length;
const checks = {
  records: records.length,
  projects: count(records, "project_connected"),
  broad_audited: broadAudit.length,
  broad_datasets: count(broadAudit, "dataset_connected"),
  broad_software: count(broadAudit, "software_connected"),
  strict_records: strict.length,
  strict_projects: count(strict, "project_connected"),
  strict_datasets: count(strict, "dataset_connected"),
  strict_software: count(strict, "software_connected"),
};

const expected = {
  records: 645,
  projects: 392,
  broad_audited: 250,
  broad_datasets: 68,
  broad_software: 22,
  strict_records: 87,
  strict_projects: 45,
  strict_datasets: 21,
  strict_software: 7,
};

for (const [key, value] of Object.entries(expected)) {
  if (checks[key] !== value) throw new Error(`Audit data check failed for ${key}: ${checks[key]} !== ${value}`);
}

await writeFile(outputPath, JSON.stringify({
  schema_version: 1,
  generated_at: metrics.as_of,
  title: "EU27–Japan quantum research",
  description: "OpenAIRE research-product snapshot with project, funding, dataset and software audit states.",
  source: {
    product_api: "https://api.openaire.eu/graph/v3/research-products",
    link_api: "https://api.openaire.eu/graph/v1/researchProducts/links",
  },
  terms,
  countries,
  records,
  checks,
}, null, 2));

console.log(`Built audit-dataset.json with ${records.length} records.`);
