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
    // Keep Plate III's saved preference available if it returns to the picker.
    root.dataset.palette = palette === "butterflies" ? "redwood" : palette;
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
    var touch = window.matchMedia("(pointer: coarse)");
    var bottom = 0;
    var height = 0;
    var hidden = 0;
    var lastY = 0;
    var lastOffset;
    var frame = 0;

    function onScroll() {
      var y = Math.min(bottom, Math.max(0, window.scrollY));
      var delta = y - lastY;
      var revealing = header.classList.contains("is-revealing");
      var pinned = header.matches(":has(:focus-visible, .section-menu[open])");
      // Keep the turning point through small fluctuations in touch momentum.
      // Several small movements in the same direction still count as a reversal.
      if (touch.matches && y > 0 && !pinned &&
          ((revealing && delta > 0 && delta < 5) ||
           (!revealing && hidden > 0 && delta < 0 && delta > -5))) return;

      if (delta < 0 && hidden > 0 && !pinned) {
        header.classList.add("is-revealing");
      } else if (delta > 0 && revealing && !pinned) {
        // Resume from the visible position if the scroll reverses during the reveal.
        if (touch.matches) {
          var transform = getComputedStyle(header).transform;
          hidden = transform === "none" ? 0 : Math.max(0, -new DOMMatrixReadOnly(transform).m42);
        } else {
          hidden = Math.max(0, -header.getBoundingClientRect().top);
        }
        header.classList.remove("is-revealing");
      }
      if (delta < 0 || y === 0 || pinned) {
        hidden = 0;
      } else {
        hidden = Math.min(height, hidden + delta);
      }
      lastY = y;
      // Move the fixed box itself so pointer hit testing follows its painted position.
      var offset = reducedMotion.matches ? (hidden > height / 2 ? height : 0) : hidden;
      if (offset !== lastOffset) header.style.setProperty("--nav-offset", -offset + "px");
      lastOffset = offset;
    }

    function queueScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        onScroll();
      });
    }

    function measure() {
      bottom = Math.max(0, root.scrollHeight - root.clientHeight);
      lastY = Math.min(lastY, bottom);
      var newHeight = header.offsetHeight;
      if (height) hidden *= newHeight / height;
      height = newHeight;
      onScroll();
    }

    var sizes = new ResizeObserver(measure);
    function syncLayout() {
      sizes.disconnect();
      window.cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", queueScroll);
      header.removeEventListener("pointerdown", onScroll);
      header.classList.remove("is-revealing");
      header.style.removeProperty("--nav-offset");
      hidden = 0;
      // Entering the compact layout mid-page is not a downward scroll.
      lastY = Math.max(0, window.scrollY);
      lastOffset = undefined;
      if (compact.matches) {
        measure();
        sizes.observe(root);
        sizes.observe(header);
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", touch.matches ? queueScroll : onScroll, { passive: true });
        // Record a menu- or keyboard-revealed bar before the press changes focus.
        header.addEventListener("pointerdown", onScroll, { passive: true });
      }
    }

    syncLayout();
    compact.addEventListener("change", syncLayout);
    touch.addEventListener("change", syncLayout);
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
