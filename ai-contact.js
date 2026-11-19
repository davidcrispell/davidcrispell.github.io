(function () {
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
