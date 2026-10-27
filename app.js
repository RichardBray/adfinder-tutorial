const form = document.getElementById("search");
const results = document.getElementById("results");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const brand = document.getElementById("brand").value;
  results.textContent = `You searched for: ${brand}`;
});
