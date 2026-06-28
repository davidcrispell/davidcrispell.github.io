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
