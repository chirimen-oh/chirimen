document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("../../version.txt");
  document.getElementById("bfooter").textContent = await res.text();

  if (location.host !== "chirimen.org") return;
  document
    .querySelectorAll(".hide-on-production")
    .forEach(node => (node.hidden = true));
});
