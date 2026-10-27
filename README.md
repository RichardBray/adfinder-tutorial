# Ad Finder

A tiny app that finds a brand's ads with [Firecrawl Alexandria](https://firecrawl.dev): Meta ads from Upspring and Google ads from the Google Ads Transparency Center. Plain HTML, a little vanilla JS, and a Bun server.

## Run it

```sh
cp .env.example .env      # then paste your key after FIRECRAWL_API_KEY=
bun install
bun run dev               # http://localhost:3000 (set PORT to change it)
```

Try **Factor** with **factor75.com**. Upspring only indexes direct-to-consumer brands, so big names like HelloFresh may come back empty. Hungryroot is another one to try.

## The branches

Each branch builds on the one before it. `main` is the finished app.

### `1-scaffold`: a Bun server and a search box

`server.ts` serves `index.html`; `app.js` echoes what you typed.

```ts
import index from "./index.html";

Bun.serve({ routes: { "/": index } });
```

### `2-meta-ads`: Meta ads with Alexandria

Adds the Firecrawl SDK (`bun add --exact @mendable/firecrawl-js`) and a `/api/ads?q=...` route. The SDK's `scrape()` accepts an `alexandria` array, so no raw `fetch` is needed. The key stays on the server: the browser only calls `/api/ads`.

```ts
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

const result = await firecrawl.scrape({
  alexandria: [{ provider: "upspring", capability: "advertisers/search", options: { name: brand, limit: 1 } }],
});
```

Finding ads is two calls: `advertisers/search` gives the advertiser `id`, then `ads/browse` returns its best ads.

```ts
options: { advertiser_id: [advertiser.id], order_by: "best", limit: 12, include: "media" }
```

### `3-google-ads`: Google ads in the same request

Adds a domain field and a second dataset. Alexandria takes up to 10 calls in one request, so the Upspring advertiser lookup and the Google lookup go out together:

```ts
const [advertisers, google] = await alexandria(
  { provider: "upspring", capability: "advertisers/search", options: { name: brand, limit: 1 } },
  { provider: "adstransparency-google-com", capability: "ad-transparency/list_ads", options: { domain, region: "anywhere", limit: 12 } },
);
```

Google ads are sorted longest-running first:

```ts
google.ads.sort((a, b) => b.days_shown - a.days_shown);
```

## Where the data lives

Each Alexandria call comes back in `result.alexandria[i].data`:

- Upspring: `data.data` is the array (advertisers, or ads with `hook_text`, `started_at`, `is_active`, `media.thumbnail_url`, `ad_library_url`).
- Google: `data.ads` is the array (`format`, `days_shown`, `first_shown_at`, `last_shown_at`, `preview.image_url`, `url`). Video ads have no `preview.image_url`.

## Cost

Each result reports its `creditsCost`. At the time of writing: Upspring `advertisers/search` and `ads/browse` cost 50 credits each, Google `list_ads` 5, so one full search is about 105 credits. A search that finds nothing costs 0.
