// Apply the saved palette and mode before the page is painted.
(function () {
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var palette = "redwood";
  var mode = null;

  try {
    mode = localStorage.getItem("color-mode");
    var saved = localStorage.getItem("color-palette");
    var artworkPalettes = ["ground", "cherry-tree", "butterflies", "ada-lovelace"];
    if (saved === "redwood" || artworkPalettes.includes(saved)) {
      palette = saved;
    } else {
      // The old picker wrote index 3 on every first visit. Let that old
      // default follow the new one. Indices 0 through 2 required a choice.
      var oldSelection = localStorage.getItem("image-theme-index");
      if (["0", "1", "2"].includes(oldSelection)) {
        palette = artworkPalettes[Number(oldSelection)];
      }
    }
  } catch (error) {
    // Storage is optional.
  }

  root.dataset.palette = palette;
  root.classList.toggle("dark", mode ? mode === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);

  function syncBrowserColor() {
    if (meta) {
      meta.content = getComputedStyle(root).getPropertyValue("--background").trim();
    }
  }

  syncBrowserColor();
  window.addEventListener("color-mode-change", syncBrowserColor);
  window.addEventListener("palette-change", syncBrowserColor);

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) {
      return;
    }
    toggle.setAttribute("aria-pressed", String(root.classList.contains("dark")));
    toggle.addEventListener("click", function () {
      var isDark = root.classList.toggle("dark");
      toggle.setAttribute("aria-pressed", String(isDark));
      window.dispatchEvent(new Event("color-mode-change"));
      try {
        localStorage.setItem("color-mode", isDark ? "dark" : "light");
      } catch (error) {
        // The mode still applies for this visit.
      }
    });
  });
})();
