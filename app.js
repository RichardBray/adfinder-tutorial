const form = document.getElementById("search");
const results = document.getElementById("results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const brand = document.getElementById("brand").value;
  results.textContent = "Searching...";

  const response = await fetch(`/api/ads?q=${encodeURIComponent(brand)}`);
  const { meta } = await response.json();

  if (!meta) {
    results.textContent = `No advertiser found for "${brand}".`;
    return;
  }

  results.innerHTML = `<h2>Meta ads for ${meta.advertiser}</h2>`;
  for (const ad of meta.ads) {
    results.innerHTML += `
      <a class="card" href="${ad.ad_library_url}" target="_blank">
        <img src="${ad.media?.thumbnail_url ?? ad.media?.image_url ?? ""}" />
        <p><b>${ad.hook_text ?? ad.one_line}</b></p>
        <small>${ad.is_active ? "Running" : "Stopped"} · since ${ad.started_at.slice(0, 10)}</small>
      </a>`;
  }
});
