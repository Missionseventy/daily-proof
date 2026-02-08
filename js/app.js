// js/app.js
// Daily Proof - frontend helpers (Pricing buttons + simple UI wiring)

const GUMROAD_MONTHLY_URL = "https://missionsseventy.gumroad.com/l/citlrs";
const GUMROAD_LIFETIME_URL = "https://missionsseventy.gumroad.com/l/nscnb";

function setLink(id, url) {
  const el = document.getElementById(id);
  if (el) {
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Pricing page buttons
  setLink("buy-monthly", GUMROAD_MONTHLY_URL);
  setLink("buy-lifetime", GUMROAD_LIFETIME_URL);

  // Optional: Any other CTA buttons on other pages if you add these IDs later
  setLink("cta-monthly", GUMROAD_MONTHLY_URL);
  setLink("cta-lifetime", GUMROAD_LIFETIME_URL);
});



