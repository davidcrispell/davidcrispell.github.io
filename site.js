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
  var artCaption = document.querySelector("[data-random-art-caption]");
  var floralFrame = document.querySelector("[data-floral-frame]");
  var artStepButtons = document.querySelectorAll("[data-art-step]");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var darkBackground = "#25221f";
  var fadeDuration = 190;
  var activeIndex = -1;
  var images = [
    {
      src: "assets/ground-dan-hillier.jpeg",
      alt: "Ground by Dan Hillier",
      width: 895,
      height: 1200,
      plate: "Plate I",
      caption: "Ground — Dan Hillier",
      theme: {
        background: "#f4eddb",
        ink: "#000000",
        muted: "#000000",
        accent: "#000000",
        accent2: "#000000",
        inkDark: "#ffffff",
        mutedDark: "#ffffff",
        accentDark: "#ffffff",
        accent2Dark: "#ffffff",
      },
    },
    {
      src: "assets/cherrytree.jpg",
      alt: "Cherry tree artwork",
      width: 551,
      height: 773,
      plate: "Plate II",
      caption: "Cherry Tree — Jane Crowther",
      theme: {
        background: "#dbd0bc",
        ink: "#38322e",
        muted: "#75695f",
        accent: "#c40014",
        accent2: "#5c6b3a",
        accentDark: "#ff7a82",
        accent2Dark: "#abb0ac",
      },
    },
    {
      src: "assets/butterflies.png",
      alt: "Butterflies and flowers artwork",
      width: 551,
      height: 773,
      plate: "Plate III",
      caption: "Butterflies — Jane Crowther",
      theme: {
        background: "#efe4ce",
        ink: "#423b30",
        muted: "#7c7260",
        accent: "#c40014",
        accent2: "#81825a",
        accentDark: "#ff7a82",
        accent2Dark: "#8f9bb3",
      },
    },
    {
      src: "assets/ada-lovelace.jpg",
      alt: "Ada Lovelace portrait",
      width: 853,
      height: 1280,
      plate: "Plate IV",
      caption: "Ada Lovelace",
      theme: {
        background: "#f8f0ed",
        ink: "#1f2838",
        muted: "#899184",
        accent: "#1f208c",
        accent2: "#899184",
        inkDark: "#f1f4fd",
        mutedDark: "#c9d4ea",
        accentDark: "#ff7b74",
        accent2Dark: "#aab9d3",
      },
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
      root.classList.contains("dark") ? darkBackground : images[activeIndex].theme.background
    );
  }

  function setThemeVar(name, value) {
    if (value) {
      root.style.setProperty(name, value);
    } else {
      root.style.removeProperty(name);
    }
  }

  function applyTheme(theme) {
    setThemeVar("--image-background", theme.background);
    setThemeVar("--image-ink", theme.ink);
    setThemeVar("--image-muted", theme.muted);
    setThemeVar("--image-accent", theme.accent);
    setThemeVar("--image-accent-2", theme.accent2);
    setThemeVar("--image-ink-dark", theme.inkDark);
    setThemeVar("--image-muted-dark", theme.mutedDark);
    setThemeVar("--image-accent-dark", theme.accentDark);
    setThemeVar("--image-accent-2-dark", theme.accent2Dark);
    setThemeVar("--image-frame-border", theme.frameBorder);
    try {
      localStorage.setItem("image-theme", JSON.stringify(theme));
      localStorage.removeItem("image-background");
    } catch (error) {
      return;
    }
  }

  function showImage(index) {
    artImage.src = images[index].src;
    artImage.alt = images[index].alt;
  }

  function setArtFrameHeight(index) {
    var image = images[index];
    var style = window.getComputedStyle(artButton);
    var paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    var paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    var contentWidth = artButton.clientWidth - paddingX;

    if (contentWidth <= 0 || !image.width || !image.height) {
      return;
    }

    artButton.style.height = contentWidth * (image.height / image.width) + paddingY + "px";
  }

  function seededRandom(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function addFramePart(type, x, y, rotation, scale, delay) {
    if (!floralFrame) {
      return;
    }

    function unit(value) {
      return typeof value === "number" ? value + "%" : value;
    }

    var part = document.createElement("span");
    part.className = "floral-frame__" + type;
    part.style.setProperty("--x", unit(x));
    part.style.setProperty("--y", unit(y));
    part.style.setProperty("--r", rotation + "deg");
    part.style.setProperty("--s", scale);
    part.style.setProperty("--delay", delay + "ms");
    floralFrame.appendChild(part);
  }

  function addVine(side) {
    if (!floralFrame) {
      return;
    }

    var vine = document.createElement("span");
    vine.className = "floral-frame__vine floral-frame__vine--" + side;
    floralFrame.appendChild(vine);
  }

  function renderFloralFrame(index) {
    if (!floralFrame) {
      return;
    }

    var random = seededRandom(7193 + index * 917);
    var sides = [
      { name: "top", horizontal: true, rotation: -28 },
      { name: "right", horizontal: false, rotation: 58 },
      { name: "bottom", horizontal: true, rotation: 152 },
      { name: "left", horizontal: false, rotation: -122 },
    ];

    floralFrame.classList.remove("is-grown");
    floralFrame.innerHTML = "";
    ["top", "right", "bottom", "left"].forEach(addVine);

    sides.forEach(function (side, sideIndex) {
      var count = side.horizontal ? 9 : 7;

      for (var i = 0; i < count; i += 1) {
        var along = 11 + (78 / Math.max(count - 1, 1)) * i + (random() - 0.5) * 4;
        var edgeOffset = 11 + random() * 10;
        var x = along;
        var y = along;
        var rotation = side.rotation + (i % 2 === 0 ? -38 : 34) + (random() - 0.5) * 18;
        var scale = 0.72 + random() * 0.46;
        var delay = 410 + sideIndex * 110 + i * 34;

        if (side.name === "top") {
          y = edgeOffset + "px";
        } else if (side.name === "bottom") {
          y = "calc(100% - " + edgeOffset + "px)";
        } else if (side.name === "left") {
          x = edgeOffset + "px";
        } else {
          x = "calc(100% - " + edgeOffset + "px)";
        }

        addFramePart("leaf", x, y, rotation, scale, delay);

        if (i % 3 === 1) {
          addFramePart("bud", x, y, 0, 0.78 + random() * 0.5, delay + 70);
        }
      }
    });

    [
      ["18px", "18px"],
      ["calc(100% - 18px)", "18px"],
      ["calc(100% - 18px)", "calc(100% - 18px)"],
      ["18px", "calc(100% - 18px)"],
      [50, "16px"],
      [50, "calc(100% - 16px)"],
    ].forEach(function (point, i) {
      addFramePart(
        "flower",
        point[0],
        point[1],
        random() * 180,
        0.72 + random() * 0.5,
        620 + i * 85
      );
    });

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        floralFrame.classList.add("is-grown");
      });
    });
  }

  function setImage(index, immediate) {
    activeIndex = index;
    applyTheme(images[index].theme);
    setArtFrameHeight(index);
    renderFloralFrame(index);
    if (artCaption) {
      artCaption.innerHTML =
        '<span class="plate-no">' + images[index].plate + "</span> " + images[index].caption;
    }
    updateThemeMeta();

    if (immediate) {
      showImage(index);
      return;
    }

    artImage.classList.add("is-fading");
    window.setTimeout(function () {
      showImage(index);
      var settle = function () {
        artImage.classList.remove("is-fading");
      };
      if (artImage.decode) {
        artImage.decode().then(settle, settle);
      } else {
        settle();
      }
    }, fadeDuration);
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

  function stepImage(delta) {
    var nextIndex = activeIndex + delta;
    if (nextIndex < 0) {
      nextIndex = images.length - 1;
    }
    if (nextIndex >= images.length) {
      nextIndex = 0;
    }
    setImage(nextIndex);
  }

  setImage(randomIndex(), true);

  artButton.addEventListener("click", function () {
    setImage(randomIndex());
  });

  artStepButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      stepImage(Number(button.getAttribute("data-art-step")) || 1);
    });
  });

  window.addEventListener("resize", function () {
    if (activeIndex >= 0) {
      setArtFrameHeight(activeIndex);
    }
  });

  window.addEventListener("color-mode-change", updateThemeMeta);
})();

(function () {
  var body = document.querySelector(".essay-body");

  if (!body) {
    return;
  }

  var paragraph = body.querySelector("p");

  if (!paragraph) {
    return;
  }

  var node = paragraph.firstChild;
  while (node && node.nodeType === 1) {
    node = node.firstChild;
  }

  if (!node || node.nodeType !== 3) {
    return;
  }

  var text = node.textContent;
  var opening = text.match(/^(\s*["'“‘]?)([A-Za-z])/);

  if (!opening) {
    return;
  }

  var span = document.createElement("span");
  span.className = "dropcap";
  span.textContent = opening[1].trim() + opening[2];
  node.textContent = text.slice(opening[0].length);
  node.parentNode.insertBefore(span, node);
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

  var marker = document.createElement("span");
  marker.className = "contents-marker";
  marker.setAttribute("aria-hidden", "true");
  list.appendChild(marker);

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
    if (event.key === "Escape" && !desktopQuery.matches) {
      setOpen(false);
    }
  });

  desktopQuery.addEventListener("change", function () {
    setOpen(desktopQuery.matches);
  });

  function updateActiveSection() {
    var doc = document.documentElement;
    var maxScroll = doc.scrollHeight - window.innerHeight;
    var fraction = maxScroll > 0 ? Math.min(Math.max(window.pageYOffset / maxScroll, 0), 1) : 0;
    var markerHeight = marker.offsetHeight || 22;
    var offset = fraction * (list.offsetHeight - markerHeight);

    marker.style.transform = "translateY(" + offset + "px)";

    var markerCenter = offset + markerHeight / 2;
    var activeLink = sectionLinks[sectionLinks.length - 1];

    for (var i = 0; i < sectionLinks.length; i++) {
      var item = sectionLinks[i].closest("li");
      if (markerCenter < item.offsetTop + item.offsetHeight) {
        activeLink = sectionLinks[i];
        break;
      }
    }

    sectionLinks.forEach(function (link) {
      var isActive = link === activeLink;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  setOpen(desktopQuery.matches);
  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
})();
