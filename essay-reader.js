(function () {
  var list = document.querySelector('[data-reader-contents]');
  var disclosure = document.querySelector('.reader-contents details');
  var headings = Array.from(document.querySelectorAll('.essay-body h2, .footnotes h2'));
  var compact = window.matchMedia('(max-width: 960px)');
  var article = document.querySelector('.article-page');
  var rail = document.querySelector('.reader-rail');
  var sidebar = document.getElementById('reader-sidebar');
  var restore = rail.querySelector('.reader-restore');
  var summary = disclosure.querySelector('summary');
  var fadeTimer;
  var pointerInRail = false;
  var links = headings.map(function (heading, index) {
    if (!heading.id) {
      var slug = heading.textContent.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section-' + (index + 1);
      var id = slug;
      for (var suffix = 2; document.getElementById(id); suffix++) {
        id = slug + '-' + suffix;
      }
      heading.id = id;
    }
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent;
    item.appendChild(link);
    list.appendChild(item);
    return link;
  });

  function setRailVisible(visible) {
    var restoreHadFocus = document.activeElement === restore;
    rail.classList.toggle('is-quiet', !visible);
    sidebar.inert = !visible;
    restore.hidden = visible;
    restore.setAttribute('aria-expanded', String(visible));
    if (visible && restoreHadFocus) summary.focus({ preventScroll: true });
  }

  function railInUse() {
    return pointerInRail || sidebar.contains(document.activeElement) ||
      (compact.matches && disclosure.open);
  }

  function scheduleFade() {
    window.clearTimeout(fadeTimer);
    if (!railInUse()) {
      fadeTimer = window.setTimeout(function () {
        if (!railInUse()) setRailVisible(false);
      }, 3000);
    }
  }

  function updateLayout() {
    pointerInRail = false;
    disclosure.open = !compact.matches;
    setRailVisible(true);
    scheduleFade();
  }

  document.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'touch') return;
    var inside = compact.matches ? rail.contains(event.target) :
      event.clientX < article.getBoundingClientRect().left;
    if (inside === pointerInRail) return;
    pointerInRail = inside;
    if (inside) setRailVisible(true);
    scheduleFade();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () {
    pointerInRail = false;
    scheduleFade();
  });
  restore.addEventListener('click', function () {
    setRailVisible(true);
    disclosure.open = true;
    summary.focus({ preventScroll: true });
    scheduleFade();
  });
  sidebar.addEventListener('focusin', function () { window.clearTimeout(fadeTimer); });
  sidebar.addEventListener('focusout', function () { window.setTimeout(scheduleFade, 0); });
  disclosure.addEventListener('toggle', scheduleFade);
  list.addEventListener('click', function (event) {
    if (compact.matches && event.target.closest('a')) disclosure.open = false;
  });
  document.addEventListener('pointerdown', function (event) {
    if (compact.matches && !rail.contains(event.target)) disclosure.open = false;
  }, { passive: true });
  disclosure.addEventListener('keydown', function (event) {
    if (compact.matches && disclosure.open && event.key === 'Escape') {
      disclosure.open = false;
      summary.focus();
    }
  });
  var activeLink;
  function updateCurrentSection() {
    var current = 0;
    for (var i = 1; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top > 100) break;
      current = i;
    }
    if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight) {
      current = headings.length - 1;
    }
    var next = links[current];
    if (next === activeLink) return;
    if (activeLink) activeLink.removeAttribute('aria-current');
    if (next) next.setAttribute('aria-current', 'location');
    activeLink = next;
  }
  updateLayout();
  updateCurrentSection();
  compact.addEventListener('change', updateLayout);
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) updateLayout();
  });
  window.addEventListener('scroll', updateCurrentSection, { passive: true });
  window.addEventListener('resize', updateCurrentSection);
})();
