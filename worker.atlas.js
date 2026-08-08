import application from "./dist/server/index.js";

const worker = {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const canBeAsset = (request.method === "GET" || request.method === "HEAD")
      && !url.pathname.startsWith("/api/");

    if (canBeAsset) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    return application.fetch(request, env, context);
  },
};

export default worker;
