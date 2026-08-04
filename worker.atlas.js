import application from "./dist/server/index.js";

const retiredPublicPaths = new Set([
  "/reproducibility/win-probability-artifact.json",
  "/reproducibility/win-probability-report.sql",
  "/reproducibility/win-probability-source-notes.md",
]);

const worker = {
  async fetch(request, env, context) {
    const { pathname } = new URL(request.url);

    if (retiredPublicPaths.has(pathname)) {
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": "noindex, noarchive",
        },
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    return application.fetch(request, env, context);
  },
};

export default worker;
