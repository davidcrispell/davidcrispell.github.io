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
  var artFrame = document.querySelector("[data-art-frame]");
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
        background: "#ece6dc",
        ink: "#38322e",
        muted: "#75695f",
        accent: "#c40014",
        accent2: "#5c6b3a",
        accentDark: "#ffffff",
        accent2Dark: "#ffffff",
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
        background: "#f6efdf",
        ink: "#423b30",
        muted: "#7c7260",
        accent: "#c40014",
        accent2: "#81825a",
        accentDark: "#ffffff",
        accent2Dark: "#ffffff",
      },
    },
    {
      src: "assets/ada-lovelace.jpg",
      alt: "Ada Lovelace portrait",
      width: 853,
      height: 1280,
      plate: "Plate IV",
      caption: "Ada Lovelace",
      frame: "assets/floral-frame-ada.png",
      theme: {
        background: "#fcf8f7",
        ink: "#1f2838",
        muted: "#465a75",
        accent: "#1f208c",
        accent2: "#465a75",
        inkDark: "#f1f4fd",
        mutedDark: "#c9d4ea",
        accentDark: "#ffffff",
        accent2Dark: "#ffffff",
      },
    },
  ];

  /* The plates are muted (see index.html), so the image/button may be absent
     while the palette arrows still exist. Run whenever EITHER is present; the
     image-specific helpers below no-op when their elements are missing. */
  if (!artButton && !artStepButtons.length) {
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
    if (!artImage) {
      return;
    }
    artImage.src = images[index].src;
    artImage.alt = images[index].alt;
  }

  function setArtFrameHeight(index) {
    if (!artButton) {
      return;
    }

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

  function renderArtFrame(index) {
    if (!artFrame || !artButton) {
      return;
    }

    /* Hug the painting: the frame overlay sits exactly on the image's
       edges, inside the button's padding (the mat). */
    var style = window.getComputedStyle(artButton);
    artFrame.style.top = style.paddingTop;
    artFrame.style.right = style.paddingRight;
    artFrame.style.bottom = style.paddingBottom;
    artFrame.style.left = style.paddingLeft;

    var frameSrc = images[index].frame;
    if (!frameSrc) {
      artFrame.classList.remove("is-visible");
      return;
    }

    var frameImage = artFrame.querySelector("img");
    if (!frameImage) {
      frameImage = document.createElement("img");
      frameImage.alt = "";
      artFrame.appendChild(frameImage);
    }
    if (frameImage.getAttribute("src") !== frameSrc) {
      frameImage.src = frameSrc;
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        artFrame.classList.add("is-visible");
      });
    });
  }

  function setImage(index, immediate) {
    activeIndex = index;
    applyTheme(images[index].theme);
    setArtFrameHeight(index);
    renderArtFrame(index);
    if (artCaption) {
      artCaption.innerHTML =
        '<span class="plate-no">' + images[index].plate + "</span> " + images[index].caption;
    }
    updateThemeMeta();
    try {
      localStorage.setItem("image-theme-index", String(index));
    } catch (error) {
      /* non-fatal: palette still applies for this page view */
    }

    if (immediate || !artImage) {
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

  /* Default palette is Plate I (Ground — Dan Hillier), not a random plate, so
     a first-time visitor always lands on the same look. A returning visitor
     keeps whichever palette they last stepped to. Colour mode (light/dark) is
     handled separately in the <head> and already defaults to the system
     preference when nothing has been saved. */
  function defaultIndex() {
    var saved = null;
    try {
      saved = localStorage.getItem("image-theme-index");
    } catch (error) {
      saved = null;
    }

    var index = saved === null ? 0 : Number(saved);
    if (!isFinite(index) || index < 0 || index >= images.length) {
      index = 0;
    }
    return index;
  }

  setImage(defaultIndex(), true);

  if (artButton) {
    artButton.addEventListener("click", function () {
      setImage(randomIndex());
    });
  }

  artStepButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      stepImage(Number(button.getAttribute("data-art-step")) || 1);
    });
  });

  window.addEventListener("resize", function () {
    if (activeIndex >= 0) {
      setArtFrameHeight(activeIndex);
      renderArtFrame(activeIndex);
    }
  });

  window.addEventListener("load", function () {
    if (activeIndex >= 0) {
      setArtFrameHeight(activeIndex);
      renderArtFrame(activeIndex);
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

/* Footnote popovers for touch devices. On a pointer device the CSS hover
   preview already does this job and clicking the marker jumps to the note at
   the foot of the page, so we leave those alone. Without hover there is no
   way to preview, so a tap opens the note in place instead of navigating. */
(function () {
  var body = document.querySelector("[data-footnotes-body]");
  var footnotes = document.querySelector("[data-footnotes-list]");

  if (!body || !footnotes) {
    return;
  }

  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  var links = body.querySelectorAll(".footnote-ref");

  if (!links.length) {
    return;
  }

  var openRef = null;
  var backdrop = null;

  function closePopover() {
    if (!openRef) {
      return;
    }
    openRef.classList.remove("is-open");
    openRef = null;
    if (backdrop && backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
  }

  /* The tooltip is centred on its marker, which pushes it off-screen near the
     edges. Nudge it back inside the viewport once it is visible. */
  function clampPopover(ref) {
    var tip = ref.querySelector(".footnote-tooltip");

    if (!tip) {
      return;
    }

    tip.style.transform = "translateX(-50%)";

    var rect = tip.getBoundingClientRect();
    var margin = 12;
    var shift = 0;

    if (rect.left < margin) {
      shift = margin - rect.left;
    } else if (rect.right > window.innerWidth - margin) {
      shift = window.innerWidth - margin - rect.right;
    }

    if (shift) {
      tip.style.transform = "translateX(calc(-50% + " + Math.round(shift) + "px))";
    }
  }

  function togglePopover(ref) {
    var wasOpen = openRef === ref;
    closePopover();

    if (wasOpen) {
      return;
    }

    backdrop = document.createElement("div");
    backdrop.className = "footnote-backdrop";
    backdrop.addEventListener("click", closePopover);
    document.body.appendChild(backdrop);

    ref.classList.add("is-open");
    openRef = ref;
    clampPopover(ref);
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (canHover.matches) {
        return; // let the anchor jump down to the note
      }
      event.preventDefault();
      togglePopover(link.closest("sup"));
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePopover();
    }
  });

  window.addEventListener("resize", closePopover);
  canHover.addEventListener("change", closePopover);
})();

(function () {
  var panel = document.querySelector(".contents-panel");
  var toggle = document.querySelector(".contents-toggle");
  var list = document.querySelector("[data-contents-list]");
  var headings = document.querySelectorAll(".essay-body h2");
  var desktopQuery = window.matchMedia("(min-width: 1100px)");
  var hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  var sectionLinks = [];
  var closeTimer = null;
  var hoverTimer = null;
  var isPinned = false;
  var fadeDuration = 220;
  var hoverCloseDelay = 260;

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

  /* On a desktop pointer the contents reveal themselves when the cursor
     approaches the left edge, and hide again on the way out. The hamburger
     still works and PINS the panel open, so it stays put while you read. */
  var hoverZone = document.createElement("div");
  hoverZone.className = "contents-hover-zone";
  hoverZone.setAttribute("aria-hidden", "true");
  document.body.appendChild(hoverZone);

  function hoverCapable() {
    return desktopQuery.matches && hoverQuery.matches;
  }

  function cancelHoverClose() {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  }

  function scheduleHoverClose() {
    cancelHoverClose();
    if (isPinned) {
      return;
    }
    hoverTimer = window.setTimeout(function () {
      hoverTimer = null;
      if (!isPinned) {
        setOpen(false);
      }
    }, hoverCloseDelay);
  }

  /* Driven off the pointer's X position rather than enter/leave on the zone.
     The panel overlaps the zone but is a sibling, so enter/leave fire in an
     order that depends on the exact path taken; a position test does not care.
     Left of the column -> open. Back over the column -> fade out. */
  var pointerInMargin = false;

  document.addEventListener("mousemove", function (event) {
    if (!hoverCapable() || isPinned) {
      return;
    }

    var inside = event.clientX < hoverZone.getBoundingClientRect().right;

    if (inside === pointerInMargin) {
      return;
    }

    pointerInMargin = inside;

    if (inside) {
      cancelHoverClose();
      setOpen(true);
    } else {
      scheduleHoverClose();
    }
  });

  /* Keyboard users get the same reveal by tabbing into the panel. */
  panel.addEventListener("focusin", function () {
    cancelHoverClose();
    setOpen(true);
  });

  panel.addEventListener("focusout", function (event) {
    if (hoverCapable() && !panel.contains(event.relatedTarget)) {
      scheduleHoverClose();
    }
  });

  toggle.addEventListener("click", function () {
    var willOpen = !panel.classList.contains("is-open");
    isPinned = hoverCapable() ? willOpen : false;
    cancelHoverClose();
    setOpen(willOpen);
  });

  list.addEventListener("click", function (event) {
    if (event.target.closest("a") && !desktopQuery.matches) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") {
      return;
    }
    isPinned = false;
    cancelHoverClose();
    setOpen(false);
  });

  desktopQuery.addEventListener("change", function () {
    isPinned = false;
    cancelHoverClose();
    setOpen(false);
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

  /* Show the contents briefly on arrival so readers know the margin holds
     something, then let it fade out. Hovering during the reveal keeps it up. */
  if (hoverCapable()) {
    setOpen(true);
    hoverTimer = window.setTimeout(function () {
      hoverTimer = null;
      if (!isPinned && !pointerInMargin) {
        setOpen(false);
      }
    }, 2400);
  } else {
    setOpen(false);
  }

  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
})();
