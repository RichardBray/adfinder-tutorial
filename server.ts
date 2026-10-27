import Firecrawl, { type AlexandriaCall } from "@mendable/firecrawl-js";
import index from "./index.html";

// The API key is read here, on the server. The browser only ever talks to /api/ads.
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

// Runs one or more Alexandria calls in a single request and returns each call's data.
async function alexandria(...calls: AlexandriaCall[]): Promise<any[]> {
  const result = await firecrawl.scrape({ alexandria: calls });
  return result.alexandria.map((call) => {
    if (call.error) console.error(call.capability, call.error.message);
    return call.data;
  });
}

async function findMetaAds(brand: string) {
  const [advertisers] = await alexandria({
    provider: "upspring",
    capability: "advertisers/search",
    options: { name: brand, limit: 1 },
  });
  const advertiser = advertisers?.data?.[0];
  if (!advertiser) return null;

  const [ads] = await alexandria({
    provider: "upspring",
    capability: "ads/browse",
    options: { advertiser_id: [advertiser.id], order_by: "best", limit: 12, include: "media" },
  });
  return { advertiser: advertiser.name, ads: ads?.data ?? [] };
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/": index,
    "/api/ads": async (req) => {
      const brand = new URL(req.url).searchParams.get("q") ?? "";
      const meta = await findMetaAds(brand);
      return Response.json({ meta });
    },
  },
});

console.log(`Ad Finder running at ${server.url}`);
