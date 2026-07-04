(function () {
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");

  function setMode(isDark, persist) {
    root.classList.toggle("dark", isDark);
    toggle.setAttribute("aria-pressed", String(isDark));
    window.dispatchEvent(new Event("color-mode-change"));
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
  var artButton = document.querySelector("[data-random-art]");
  var artImage = document.querySelector("[data-random-art-image]");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var darkBackground = "#25221f";
  var activeIndex = -1;
  var images = [
    {
      src: "assets/ground-dan-hillier.jpeg",
      alt: "Ground by Dan Hillier",
      background: "#f4eddb",
    },
    {
      src: "assets/subliminal-learning-owl.jpeg",
      alt: "Subliminal learning owl artwork",
      background: "#ddccae",
    },
    {
      src: "assets/cherrytree.jpg",
      alt: "Cherry tree artwork",
      background: "#dbd0bc",
    },
    {
      src: "assets/butterflies.png",
      alt: "Butterflies and flowers artwork",
      background: "#efe4ce",
    },
  ];

  if (!artButton || !artImage) {
    return;
  }

  function updateThemeMeta() {
    if (!themeMeta || activeIndex < 0) {
      return;
    }

    themeMeta.setAttribute(
      "content",
      root.classList.contains("dark") ? darkBackground : images[activeIndex].background
    );
  }

  function setImage(index) {
    activeIndex = index;
    artImage.src = images[index].src;
    artImage.alt = images[index].alt;
    root.style.setProperty("--image-background", images[index].background);
    try {
      localStorage.setItem("image-background", images[index].background);
    } catch (error) {
      return;
    }
    updateThemeMeta();
  }

  function randomIndex() {
    if (images.length < 2) {
      return 0;
    }

    var nextIndex = activeIndex;
    while (nextIndex === activeIndex) {
      nextIndex = Math.floor(Math.random() * images.length);
    }
    return nextIndex;
  }

  setImage(randomIndex());

  artButton.addEventListener("click", function () {
    setImage(randomIndex());
  });

  window.addEventListener("color-mode-change", updateThemeMeta);
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
