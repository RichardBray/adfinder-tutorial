const form = document.getElementById("search");
const results = document.getElementById("results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const brand = document.getElementById("brand").value;
  const domain = document.getElementById("domain").value;
  results.textContent = "Searching...";

  const response = await fetch(`/api/ads?q=${encodeURIComponent(brand)}&domain=${encodeURIComponent(domain)}`);
  const { meta, google } = await response.json();

  results.innerHTML = "";
  showMetaAds(meta, brand);
  showGoogleAds(google, domain);
});

function showMetaAds(meta, brand) {
  if (!meta) {
    results.innerHTML += `<p>No Meta advertiser found for "${brand}".</p>`;
    return;
  }

  results.innerHTML += `<h2>Meta ads for ${meta.advertiser}</h2>`;
  for (const ad of meta.ads) {
    results.innerHTML += `
      <a class="card" href="${ad.ad_library_url}" target="_blank">
        <img src="${ad.media?.thumbnail_url ?? ad.media?.image_url ?? ""}" />
        <p><b>${ad.hook_text ?? ad.one_line}</b></p>
        <small>${ad.is_active ? "Running" : "Stopped"} · since ${ad.started_at.slice(0, 10)}</small>
      </a>`;
  }
}

function showGoogleAds(ads, domain) {
  if (ads.length === 0) {
    results.innerHTML += `<p>No Google ads found for ${domain}.</p>`;
    return;
  }

  results.innerHTML += `<h2>Google ads for ${domain} (longest running first)</h2>`;
  for (const ad of ads) {
    // Video ads come without a preview image, so link out to watch them instead.
    const preview = ad.preview?.image_url
      ? `<img src="${ad.preview.image_url}" />`
      : `<div class="no-preview">Video: click to watch</div>`;
    results.innerHTML += `
      <a class="card" href="${ad.url}" target="_blank">
        ${preview}
        <p><b>${ad.format} · ${ad.days_shown} days</b></p>
        <small>${ad.first_shown_at.slice(0, 10)} to ${ad.last_shown_at.slice(0, 10)}</small>
      </a>`;
  }
}
