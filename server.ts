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

async function browseMetaAds(advertiser: any) {
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
      const params = new URL(req.url).searchParams;
      const brand = params.get("q") ?? "";
      const domain = params.get("domain") ?? "";

      // Two datasets in one request: Upspring (Meta ads) and Google's Ads Transparency Center.
      const [advertisers, google] = await alexandria(
        {
          provider: "upspring",
          capability: "advertisers/search",
          options: { name: brand, limit: 1 },
        },
        {
          provider: "adstransparency-google-com",
          capability: "ad-transparency/list_ads",
          options: { domain, region: "anywhere", limit: 12 },
        },
      );

      // Meta needs a second round trip: the ads lookup takes the advertiser id we just found.
      const meta = await browseMetaAds(advertisers?.data?.[0]);
      const googleAds = (google?.ads ?? []).sort((a: any, b: any) => b.days_shown - a.days_shown);

      return Response.json({ meta, google: googleAds });
    },
  },
});

console.log(`Ad Finder running at ${server.url}`);
