import { NextResponse } from "next/server";

const API_ROOT = "https://api.openaire.eu/graph";
const MAX_ALIASES = 5;
const MAX_ALIAS_LENGTH = 120;

type OpenAireResponse = {
  header?: { numFound?: number };
  results?: Array<Record<string, unknown>>;
};

async function fetchOpenAire(path: string, parameters: Record<string, string>) {
  const url = new URL(`${API_ROOT}${path}`);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "OpenQuantumEvidenceAtlas/1.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`OpenAIRE returned HTTP ${response.status}`);
  return { payload: await response.json() as OpenAireResponse, url: url.toString() };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { aliases?: unknown };
    if (!Array.isArray(body.aliases)) {
      return NextResponse.json({ error: "aliases must be an array" }, { status: 400 });
    }

    const aliases = [...new Set(body.aliases
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean))]
      .slice(0, MAX_ALIASES);

    if (!aliases.length || aliases.some((alias) => alias.length > MAX_ALIAS_LENGTH)) {
      return NextResponse.json({ error: "Provide 1–5 aliases of at most 120 characters." }, { status: 400 });
    }

    const results = await Promise.all(aliases.map(async (alias) => {
      const [projects, products] = await Promise.all([
        fetchOpenAire("/v3/projects", { search: alias, page: "1", pageSize: "20" }),
        fetchOpenAire("/v3/research-products", { search: `"${alias}"`, page: "1", pageSize: "20", includeStats: "true" }),
      ]);

      return {
        alias,
        projects: {
          count: Number(projects.payload.header?.numFound ?? 0),
          query_url: projects.url,
          items: (projects.payload.results ?? []).slice(0, 5).map((item) => ({
            id: item.id,
            code: item.code,
            acronym: item.acronym,
            title: item.title,
            start_date: item.startDate,
            end_date: item.endDate,
          })),
        },
        products: {
          count: Number(products.payload.header?.numFound ?? 0),
          query_url: products.url,
          items: (products.payload.results ?? []).slice(0, 5).map((item) => ({
            id: item.id,
            title: item.mainTitle,
            publication_date: item.publicationDate,
            type: item.type,
          })),
        },
      };
    }));

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      aliases: results,
      totals: {
        project_alias_hits: results.reduce((total, result) => total + result.projects.count, 0),
        product_alias_hits: results.reduce((total, result) => total + result.products.count, 0),
      },
      semantics: "Alias-hit totals can contain duplicates across aliases. Zero means not observable for these exact queries, not evidence of no activity.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OpenAIRE lookup failed" }, { status: 502 });
  }
}
