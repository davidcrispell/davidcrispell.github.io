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
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var travelRatio = 0.65;
    var supportsTimeline = CSS.supports("animation-timeline: scroll(root)") &&
      CSS.supports("animation-range: 0px 100px");
    var useTimeline;
    var bottom = 0;
    var travel = 0;
    var start = 0;
    var lastY = 0;
    var lastOffset;

    function progress(y) {
      return Math.min(1, Math.max(0, (y - start) / travel));
    }

    function setStart(y) {
      start = y;
      if (useTimeline) header.style.animationRange = start + "px " + (start + travel) + "px";
    }

    function onScroll() {
      var y = Math.min(bottom, Math.max(0, window.scrollY));
      // Inside the range the browser scrubs the transform. Once the bar reaches
      // an end, move the range to the turning point on the first reverse scroll.
      if (header.matches(":has(:focus-visible, .section-menu[open])")) {
        if (start !== y) setStart(y);
      } else if (y < lastY && lastY > start + travel) {
        setStart(lastY - travel);
      } else if (y > lastY && lastY < start) {
        setStart(lastY);
      }
      lastY = y;
      if (useTimeline) return;
      var offset = progress(y);
      if (reducedMotion.matches) offset = Math.round(offset);
      if (offset !== lastOffset) header.style.setProperty("--nav-offset", (-100 * offset) + "%");
      lastOffset = offset;
    }

    function measure() {
      bottom = Math.max(0, root.scrollHeight - root.clientHeight);
      lastY = Math.min(lastY, bottom);
      var distance = header.offsetHeight / travelRatio;
      if (!distance) return;
      if (distance !== travel) {
        var newStart = travel ? Math.max(0, lastY - progress(lastY) * distance) : 0;
        travel = distance;
        setStart(newStart);
      }
      onScroll();
    }

    var sizes = new ResizeObserver(measure);
    function syncLayout() {
      sizes.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      useTimeline = compact.matches && supportsTimeline && !reducedMotion.matches;
      header.classList.toggle("scroll-driven-nav", useTimeline);
      header.style.removeProperty("animation-range");
      header.style.removeProperty("--nav-offset");
      travel = 0;
      lastY = 0;
      lastOffset = undefined;
      if (compact.matches) {
        measure();
        sizes.observe(root);
        sizes.observe(header);
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    }

    syncLayout();
    compact.addEventListener("change", syncLayout);
    reducedMotion.addEventListener("change", syncLayout);
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
