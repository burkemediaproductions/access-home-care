(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

  // Set aria-current="page" for nav links
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  qsa('a[data-nav]').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/\/+$/, '') || '/';
    if (href === path) a.setAttribute('aria-current', 'page');
  });


// Mobile drawer (animated)
const drawer = qs('[data-drawer]');
const openBtn = qs('[data-drawer-open]');
const closeBtn = qs('[data-drawer-close]');
const focusablesSel =
  'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
let lastFocus = null;

const setDrawer = (open) => {
  if (!drawer) return;

  drawer.dataset.open = open ? 'true' : 'false';
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');

  // Prevent interaction when closed
  if (open) {
    drawer.removeAttribute('inert');
  } else {
    drawer.setAttribute('inert', '');
  }

  // Hamburger button state
  if (openBtn) {
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    openBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';

  if (open) {
    lastFocus = document.activeElement;
    requestAnimationFrame(() => {
      const panel = drawer.querySelector('.drawer-panel') || drawer;
      const first = panel.querySelector(focusablesSel);
      first && first.focus();
    });
  } else {
    lastFocus && typeof lastFocus.focus === 'function' && lastFocus.focus();
  }
};

// Open / close buttons
openBtn && openBtn.addEventListener('click', () => setDrawer(true));
closeBtn && closeBtn.addEventListener('click', () => setDrawer(false));

// Click backdrop to close
drawer && drawer.addEventListener('click', (e) => {
  if (e.target === drawer) setDrawer(false);
});

// Keyboard support
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setDrawer(false);

  if (e.key === 'Tab' && drawer?.dataset.open === 'true') {
    const panel = drawer.querySelector('.drawer-panel') || drawer;
    const items = qsa(focusablesSel, panel).filter(
      (n) => !n.hasAttribute('disabled')
    );
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Ensure initial inert state
if (drawer && drawer.dataset.open !== 'true') {
  drawer.setAttribute('inert', '');
}



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

  
  // Reviews carousel (3-up desktop, 1-up mobile) + randomized order
  const reviewsCarousel = qs('[data-carousel="reviews"]');
  if (reviewsCarousel) {
    const track = qs('[data-carousel-track]', reviewsCarousel);
    const prevBtn = qs('[data-carousel-prev]', reviewsCarousel);
    const nextBtn = qs('[data-carousel-next]', reviewsCarousel);

    if (track) {
      const seedKey = 'access_reviews_seed_v1';
      let seed = Number(sessionStorage.getItem(seedKey));
      if (!seed || Number.isNaN(seed)) {
        seed = Math.floor(Math.random() * 1e9);
        sessionStorage.setItem(seedKey, String(seed));
      }

      // Small seeded RNG (mulberry32)
      const rng = (a) => () => {
        let t = (a += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const rand = rng(seed);

      // Shuffle once per session
      const cards = Array.from(track.children);
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      cards.forEach((c) => track.appendChild(c));

      // --- Read more / Read less (truncate long reviews cleanly) ---
      const truncateAtWord = (text, maxChars) => {
        const clean = (text || '').trim().replace(/\s+/g, ' ');
        if (clean.length <= maxChars) return clean;
        const slice = clean.slice(0, maxChars + 1);
        const lastSpace = slice.lastIndexOf(' ');
        const cut = (lastSpace > 40 ? slice.slice(0, lastSpace) : slice.slice(0, maxChars)).trim();
        return `${cut}…`;
      };

      const setupReviewToggles = () => {
        const isMobile = window.matchMedia('(max-width: 980px)').matches;
        // Slightly shorter on mobile so 1-up cards stay tidy
        const maxChars = isMobile ? 240 : 320;

        Array.from(track.children).forEach((card) => {
          const quoteEl = card.querySelector('.review-quote');
          const authorEl = card.querySelector('.review-author');
          if (!quoteEl || !authorEl) return;

          // Cache original (including curly quotes) once
          if (!quoteEl.dataset.full) quoteEl.dataset.full = quoteEl.textContent.trim();

          const full = quoteEl.dataset.full;

          // Preserve curly quotes if present
          const hasOpen = full.startsWith('“') || full.startsWith('"');
          const hasClose = full.endsWith('”') || full.endsWith('"');
          const open = hasOpen ? full[0] : '';
          const close = hasClose ? full[full.length - 1] : '”';
          const core = full.slice(hasOpen ? 1 : 0, hasClose ? -1 : undefined).trim();

          const truncated = truncateAtWord(core, maxChars);
          const needsToggle = truncated.length < core.length;

          // Create/ensure a .review-more container (insert right before the author line)
          let moreEl = card.querySelector('.review-more');
          if (!moreEl) {
            moreEl = document.createElement('div');
            moreEl.className = 'review-more';
            authorEl.insertAdjacentElement('beforebegin', moreEl);
          }

          // Ensure button exists
          let btn = card.querySelector('.review-toggle');
          if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'review-toggle';
            btn.dataset.bound = 'true';
            moreEl.appendChild(btn);

            btn.addEventListener('click', () => {
              const nowExpanded = card.dataset.expanded !== 'true';
              card.dataset.expanded = nowExpanded ? 'true' : 'false';
              render(card, quoteEl, btn, open, close, core, truncated);
              window.requestAnimationFrame(update);
            });
          }

          // Default collapsed unless user expanded already
          if (card.dataset.expanded !== 'true') card.dataset.expanded = 'false';

          // If no toggle needed, show full and hide controls
          if (!needsToggle) {
            btn.hidden = true;
            card.dataset.expanded = 'false';
            quoteEl.textContent = `${open}${core}${close}`.trim();
            return;
          }

          btn.hidden = false;
          render(card, quoteEl, btn, open, close, core, truncated);
        });
      };

      const render = (card, quoteEl, btn, open, close, core, truncated) => {
        const expanded = card.dataset.expanded === 'true';
        if (expanded) {
          btn.textContent = 'Read less';
          quoteEl.textContent = `${open}${core}${close}`.trim();
        } else {
          btn.textContent = 'Read more';
          quoteEl.textContent = `${open}${truncated}${close}`.trim();
        }
      };

      let index = 0;

      const getPerView = () => (window.matchMedia('(max-width: 980px)').matches ? 1 : 3);

      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

      const update = () => {
        const items = Array.from(track.children);
        if (!items.length) return;

        const perView = getPerView();
        const maxIndex = Math.max(0, items.length - perView);
        index = clamp(index, 0, maxIndex);

        // Compute slide width (card width + gap)
        const first = items[0];
        const cardW = first.getBoundingClientRect().width;
        const styles = window.getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;

        const offset = index * (cardW + gap);
        track.style.transform = `translateX(-${offset}px)`;

        if (prevBtn) prevBtn.disabled = index <= 0;
        if (nextBtn) nextBtn.disabled = index >= maxIndex;
      };

      // Randomize starting position (so it feels fresh)
      setupReviewToggles();

      const initStart = () => {
        const perView = getPerView();
        const items = Array.from(track.children);
        const maxIndex = Math.max(0, items.length - perView);
        index = maxIndex ? Math.floor(rand() * (maxIndex + 1)) : 0;
      };

      initStart();
      window.addEventListener('load', update);
      window.addEventListener('resize', () => {
        setupReviewToggles();
        // Let layout settle a tick
        window.requestAnimationFrame(update);
      });

      prevBtn && prevBtn.addEventListener('click', () => { index -= 1; update(); });
      nextBtn && nextBtn.addEventListener('click', () => { index += 1; update(); });

      // Optional: allow keyboard arrows when focused
      reviewsCarousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { index -= 1; update(); }
        if (e.key === 'ArrowRight') { index += 1; update(); }
      });

      // Run once now (after initial layout)
      window.requestAnimationFrame(update);
    }
  }


  // Current year
  const y = qs('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  // Autoplay videos only when they are near the center of the viewport (desktop-first)
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const autoVideos = qsa('video.autoplay-on-view');

  if (!prefersReducedMotion && 'IntersectionObserver' in window && autoVideos.length) {
    const ioVideo = new IntersectionObserver((entries) => {
		entries.forEach((en) => {
		const v = en.target;
		const wrap = v.closest('.assessment-media') || v.parentElement;

		if (en.isIntersecting) {
		v.muted = true;
		const p = v.play();
		if (p && typeof p.catch === 'function') p.catch(() => {});
		if (wrap) wrap.classList.add('is-playing');
		} else {
		// Pause on the current frame (do NOT reset time)
		v.pause();
		if (wrap) wrap.classList.remove('is-playing');
		}
	});
	}, {
  root: null,
      rootMargin: '-13% 0px -43% 0px',
      threshold: 0.15,
    });

    autoVideos.forEach((v) => {
	v.muted = true;
	v.pause();           // ensure clean start
	v.playsInline = true;
	ioVideo.observe(v);
	});
  } else {
    autoVideos.forEach((v) => v && typeof v.pause === 'function' && v.pause());
  }
})();

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accordion] .faq-q");
  if (!btn) return;

  const item = btn.closest(".faq-item");
  const panel = item.querySelector(".faq-a");
  const accordion = item.closest("[data-accordion]");

  const isOpen = btn.getAttribute("aria-expanded") === "true";

  // close others (single-open behavior)
  accordion.querySelectorAll(".faq-item").forEach((other) => {
    if (other === item) return;
    other.classList.remove("is-open");
    const b = other.querySelector(".faq-q");
    const p = other.querySelector(".faq-a");
    b.setAttribute("aria-expanded", "false");
    p.hidden = true;
  });

  // toggle this one
  btn.setAttribute("aria-expanded", String(!isOpen));
  item.classList.toggle("is-open", !isOpen);
  panel.hidden = isOpen;
});
