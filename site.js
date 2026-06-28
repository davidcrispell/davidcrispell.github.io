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
    backlink.setAttribute("aria-label", "Return to footnote reference " + number);

    item.appendChild(backlink);
    item.insertAdjacentHTML("beforeend", originalNote);
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
