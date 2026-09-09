(function () {
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  var savedMode = null;

  try {
    savedMode = localStorage.getItem("color-mode");
  } catch (error) {
    savedMode = null;
  }

  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var useDark = savedMode ? savedMode === "dark" : prefersDark;

  function setMode(isDark, persist) {
    root.classList.toggle("dark", isDark);
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
    }
    if (persist) {
      try {
        localStorage.setItem("color-mode", isDark ? "dark" : "light");
      } catch (error) {
        return;
      }
    }
  }

  setMode(useDark, false);
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMode(!root.classList.contains("dark"), true);
    });
  }

  document.querySelectorAll("[data-copy-target]").forEach(function (button) {
    button.addEventListener("click", async function () {
      var target = document.getElementById(button.getAttribute("data-copy-target"));
      var status = button.querySelector("span");
      if (!target || !status) {
        return;
      }

      var original = status.textContent;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        status.textContent = "Copied";
      } catch (error) {
        status.textContent = "Select and copy";
      }
      window.setTimeout(function () {
        status.textContent = original;
      }, 1800);
    });
  });
})();
