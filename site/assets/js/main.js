(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  // Set aria-current="page" for nav links
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  qsa('a[data-nav]').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/\/+$/, '') || '/';
    if (href === path) a.setAttribute('aria-current', 'page');
  });

  // Mobile drawer
  const drawer = qs('[data-drawer]');
  const openBtn = qs('[data-drawer-open]');
  const closeBtn = qs('[data-drawer-close]');
  const focusablesSel = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
  let lastFocus = null;

  const setDrawer = (open) => {
    if (!drawer) return;
    drawer.dataset.open = open ? 'true' : 'false';
    drawer.style.display = open ? 'block' : 'none';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      lastFocus = document.activeElement;
      // focus first link
      const first = drawer.querySelector(focusablesSel);
      first && first.focus();
    } else {
      lastFocus && lastFocus.focus && lastFocus.focus();
    }
  };

  openBtn && openBtn.addEventListener('click', () => setDrawer(true));
  closeBtn && closeBtn.addEventListener('click', () => setDrawer(false));
  drawer && drawer.addEventListener('click', (e) => {
    if (e.target === drawer) setDrawer(false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setDrawer(false);
    if (e.key === 'Tab' && drawer && drawer.dataset.open === 'true') {
      // simple focus trap
      const items = qsa(focusablesSel, drawer).filter(n => !n.hasAttribute('disabled'));
      if (!items.length) return;
      const first = items[0], last = items[items.length-1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  // Scroll reveal
  const reveals = qsa('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // Current year
  const y = qs('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());
})();
