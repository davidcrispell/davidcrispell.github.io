(function () {
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");

  function setMode(isDark, persist) {
    root.classList.toggle("dark", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
    if (persist) {
      try {
        localStorage.setItem("color-mode", isDark ? "dark" : "light");
      } catch (error) {
        return;
      }
    }
  }

  if (!toggle) {
    return;
  }

  setMode(root.classList.contains("dark"), false);

  toggle.addEventListener("click", function () {
    setMode(!root.classList.contains("dark"), true);
  });
})();

(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var target = { x: 0.18, y: -0.26 };
  var current = { x: target.x, y: target.y };
  var rafId = null;
  var hasMotionInput = false;

  if (reduceMotion.matches) {
    return;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function render() {
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;

    var x = 50 + current.x * 34;
    var y = 32 + current.y * 26;
    var angle = 132 + current.x * 34 - current.y * 18;

    root.style.setProperty("--reflection-x", clamp(x, 10, 90).toFixed(2) + "%");
    root.style.setProperty("--reflection-y", clamp(y, 4, 82).toFixed(2) + "%");
    root.style.setProperty("--reflection-angle", angle.toFixed(2) + "deg");

    if (Math.abs(target.x - current.x) > 0.002 || Math.abs(target.y - current.y) > 0.002) {
      rafId = window.requestAnimationFrame(render);
      return;
    }

    rafId = null;
  }

  function setTarget(x, y) {
    target.x = clamp(x, -1, 1);
    target.y = clamp(y, -1, 1);

    if (!rafId) {
      rafId = window.requestAnimationFrame(render);
    }
  }

  function handlePointer(event) {
    if (hasMotionInput || !event.isPrimary && event.pointerType !== "mouse") {
      return;
    }

    setTarget(
      event.clientX / window.innerWidth * 2 - 1,
      event.clientY / window.innerHeight * 2 - 1
    );
  }

  function handleOrientation(event) {
    if (event.beta == null || event.gamma == null) {
      return;
    }

    hasMotionInput = true;
    setTarget(event.gamma / 35, (event.beta - 45) / 45);
  }

  function requestMotionPermission() {
    if (
      typeof DeviceOrientationEvent === "undefined" ||
      typeof DeviceOrientationEvent.requestPermission !== "function"
    ) {
      return;
    }

    DeviceOrientationEvent.requestPermission()
      .then(function (state) {
        if (state === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, true);
        }
      })
      .catch(function () {
        hasMotionInput = false;
      });
  }

  window.addEventListener("pointermove", handlePointer, { passive: true });

  if (typeof DeviceOrientationEvent !== "undefined") {
    window.addEventListener("deviceorientation", handleOrientation, true);
    document.addEventListener("pointerdown", requestMotionPermission, {
      once: true,
      passive: true,
    });
  }

  render();
})();

(function () {
  var body = document.querySelector("[data-footnotes-body]");
  var footnotes = document.querySelector("[data-footnotes-list]");

  if (!body || !footnotes) {
    return;
  }

  var refs = body.querySelectorAll("sup");
  var items = footnotes.querySelectorAll("li");

  refs.forEach(function (sup) {
    var number = sup.textContent.trim();
    var index = Number(number) - 1;
    var item = items[index];

    if (!/^\d+$/.test(number) || !item) {
      return;
    }

    var refId = "fnref-" + number;
    var noteId = "fn-" + number;
    var originalNote = item.innerHTML.trim();
    var label = "[" + number + "]";

    sup.id = refId;
    sup.textContent = "";

    var link = document.createElement("a");
    link.href = "#" + noteId;
    link.className = "footnote-ref";
    link.textContent = label;

    var tooltip = document.createElement("span");
    tooltip.className = "footnote-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.innerHTML = '<span class="footnote-tooltip__label">' + label + "</span> " + originalNote;

    sup.appendChild(link);
    sup.appendChild(tooltip);

    item.id = noteId;
    item.innerHTML = "";

    var backlink = document.createElement("a");
    backlink.href = "#" + refId;
    backlink.className = "footnote-backref";
    backlink.textContent = label;
    backlink.title = "Return to inline footnote reference " + label;
    backlink.setAttribute("aria-label", "Return to inline footnote reference " + number);

    item.appendChild(backlink);
    item.insertAdjacentHTML("beforeend", originalNote);
  });

  footnotes.addEventListener("click", function (event) {
    var backlink = event.target.closest(".footnote-backref");

    if (!backlink) {
      return;
    }

    var target = document.querySelector(backlink.getAttribute("href"));

    if (!target) {
      return;
    }

    var targetLink = target.querySelector(".footnote-ref");
    var scrollTarget = target.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * 0.25;

    event.preventDefault();
    window.scrollTo({
      top: Math.max(scrollTarget, 0),
      behavior: "auto",
    });

    if (targetLink) {
      targetLink.focus({ preventScroll: true });
      targetLink.classList.remove("is-return-target");
      window.requestAnimationFrame(function () {
        targetLink.classList.add("is-return-target");
      });
    }

    if (window.history && window.history.pushState) {
      window.history.pushState(null, "", backlink.getAttribute("href"));
    } else {
      window.location.hash = backlink.getAttribute("href").slice(1);
    }
  });
})();

(function () {
  var panel = document.querySelector(".contents-panel");
  var toggle = document.querySelector(".contents-toggle");
  var list = document.querySelector("[data-contents-list]");
  var headings = document.querySelectorAll(".essay-body h2");
  var desktopQuery = window.matchMedia("(min-width: 1100px)");
  var sectionLinks = [];
  var closeTimer = null;
  var fadeDuration = 220;

  if (!panel || !toggle || !list || !headings.length) {
    return;
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  headings.forEach(function (heading, index) {
    if (!heading.id) {
      heading.id = slugify(heading.textContent) || "section-" + (index + 1);
    }

    var item = document.createElement("li");
    var link = document.createElement("a");
    link.href = "#" + heading.id;
    link.textContent = heading.textContent;
    item.appendChild(link);
    list.appendChild(item);
    sectionLinks.push(link);
  });

  function setOpen(isOpen) {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    panel.classList.remove("is-closing");
    toggle.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("contents-open", isOpen);

    if (isOpen) {
      panel.classList.add("is-open");
      return;
    }

    if (!panel.classList.contains("is-open")) {
      return;
    }

    panel.classList.remove("is-open");
    panel.classList.add("is-closing");
    closeTimer = window.setTimeout(function () {
      panel.classList.remove("is-closing");
      closeTimer = null;
    }, fadeDuration);
  }

  toggle.addEventListener("click", function () {
    setOpen(!panel.classList.contains("is-open"));
  });

  list.addEventListener("click", function (event) {
    if (event.target.closest("a") && !desktopQuery.matches) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  desktopQuery.addEventListener("change", function () {
    setOpen(false);
  });

  function updateActiveSection() {
    var activeHeading = headings[0];

    headings.forEach(function (heading) {
      if (heading.getBoundingClientRect().top <= window.innerHeight * 0.36) {
        activeHeading = heading;
      }
    });

    sectionLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + activeHeading.id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  setOpen(false);
  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
})();
