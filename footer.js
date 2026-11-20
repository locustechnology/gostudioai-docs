// Adds "© GoStudio  Terms of Service  Privacy Policy" next to the footer's social icons.
(function () {
  function addLegal() {
    var footer = document.getElementById("footer");
    if (!footer || footer.querySelector(".gs-legal")) return;
    var social = footer.querySelector('a[href*="linkedin.com"], a[href*="instagram.com"]');
    if (!social) return;
    var row = social.parentElement;
    while (row && row !== footer && row.querySelectorAll("a[href*='linkedin.com'], a[href*='instagram.com'], a[href*='facebook.com']").length < 2) {
      row = row.parentElement;
    }
    if (!row || row === footer) row = social.parentElement;
    var legal = document.createElement("div");
    legal.className = "gs-legal";
    legal.innerHTML =
      '<span>© 2026 GoStudio. All rights reserved.</span>' +
      '<a href="https://www.gostudio.ai/terms" target="_blank" rel="noopener">Terms of Service</a>' +
      '<a href="https://www.gostudio.ai/privacy" target="_blank" rel="noopener">Privacy Policy</a>';
    row.parentElement.insertBefore(legal, row.nextSibling);
    row.parentElement.classList.add("gs-footer-row");
  }
  addLegal();
  new MutationObserver(addLegal).observe(document.documentElement, { childList: true, subtree: true });
})();
