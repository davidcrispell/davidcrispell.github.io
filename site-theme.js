// Apply the saved palette and mode before the page is painted.
(function () {
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var revision = new URL(document.currentScript.src).searchParams.get("v");
  var compact = window.matchMedia("(max-width: 960px)");
  var artworkPalettes = ["ground", "cherry-tree", "butterflies", "ada-lovelace"];

  function syncBrowserColor() {
    if (meta) {
      meta.content = getComputedStyle(root).getPropertyValue("--background").trim();
    }
  }

  function restorePreferences() {
    var palette = "redwood";
    var dark = false;
    try {
      var mode = localStorage.getItem("color-mode");
      if (mode) dark = mode === "dark";
      var saved = localStorage.getItem("color-palette");
      if (saved === "blank-slate" || saved === "redwood" || artworkPalettes.includes(saved)) {
        palette = saved;
      } else {
        // Index 3 was saved automatically. Only the other old indices
        // distinguish a visitor's choice from the previous default.
        var oldSelection = localStorage.getItem("image-theme-index");
        if (["0", "1", "2"].includes(oldSelection)) {
          palette = artworkPalettes[Number(oldSelection)];
        }
      }
    } catch (error) {
      if (root.dataset.palette) return;
    }
    root.dataset.palette = palette;
    root.classList.toggle("dark", dark);
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) toggle.setAttribute("aria-pressed", String(dark));
    syncBrowserColor();
    window.dispatchEvent(new Event("theme-restored"));
  }

  restorePreferences();
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) restorePreferences();
  });
  window.addEventListener("storage", function (event) {
    if (!event.key || event.key === "color-palette" || event.key === "color-mode") {
      restorePreferences();
    }
  });
  window.addEventListener("color-mode-change", syncBrowserColor);
  window.addEventListener("palette-change", syncBrowserColor);

  function initSectionMenu() {
    var menu = document.querySelector(".section-menu");
    if (!menu) return;
    var summary = menu.querySelector("summary");

    function updateLayout() {
      var hadFocus = menu.contains(document.activeElement);
      menu.open = !compact.matches;
      if (hadFocus) {
        var desktopLink = menu.closest(".reader-contents") &&
          (menu.querySelector("a[aria-current]") || menu.querySelector("a"));
        var target = compact.matches ? summary : desktopLink || document.querySelector(".theme-toggle");
        target.focus({ preventScroll: true });
      }
    }
    function closeOutside(event) {
      if (compact.matches && menu.open && !menu.contains(event.target)) menu.open = false;
    }
    menu.addEventListener("click", function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!compact.matches || !link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      menu.open = false;
      var target = document.getElementById(link.hash.slice(1));
      if (target) {
        if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    });
    document.addEventListener("pointerdown", closeOutside, { passive: true });
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && compact.matches && menu.open) {
        menu.open = false;
        summary.focus({ preventScroll: true });
      }
    });
    updateLayout();
    compact.addEventListener("change", updateLayout);
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) updateLayout();
    });
  }

  function initMobileHeader() {
    var header = document.querySelector(".home-header, .reader-rail, .ai-contact-page .site-header");
    if (!header) return;
    var turnY = 0;
    var threshold = 8;

    function onScroll() {
      // Safari can report offsets outside the document during rubber-band scrolling.
      var bottom = Math.max(0, root.scrollHeight - root.clientHeight);
      var y = Math.min(bottom, Math.max(0, window.scrollY));
      turnY = Math.min(turnY, bottom);

      // Measure from the last turning point so small finger movements don't flicker.
      var hidden = header.classList.contains("is-scroll-hidden");
      turnY = hidden ? Math.max(turnY, y) : Math.min(turnY, y);
      if (y === 0 || Math.abs(y - turnY) >= threshold) {
        header.classList.toggle("is-scroll-hidden", y > turnY);
        turnY = y;
      }
    }

    function syncLayout() {
      turnY = Math.max(0, window.scrollY);
      header.classList.toggle("is-scroll-hidden", compact.matches && turnY > 0);
      if (compact.matches) {
        window.addEventListener("scroll", onScroll, { passive: true });
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    }

    syncLayout();
    compact.addEventListener("change", syncLayout);
    window.addEventListener("pageshow", syncLayout);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSectionMenu();
    initMobileHeader();
    // Pages can cache HTML for ten minutes. Use the same release for both
    // sides of a home/article round trip, including an already-cached home.
    if (revision) {
      document.querySelectorAll('a[href="./"], .waterman-home a[href$=".html"]').forEach(function (link) {
        var target = new URL(link.href);
        if (target.origin === location.origin) {
          target.searchParams.set("v", revision);
          link.href = target.href;
        }
      });
    }
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
