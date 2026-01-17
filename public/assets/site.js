document.addEventListener("DOMContentLoaded", () => {
  const crumbs = document.querySelectorAll(".breadcrumbs .crumb");
  if (crumbs && crumbs.length) {
    crumbs.forEach(c => c.style.cursor = "pointer");
  }
});
