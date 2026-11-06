/* Motion is an enhancement: the document remains readable without this file. */
(function siteMotion() {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const toggle = document.getElementById('motion-toggle');
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.reading-progress');
  const targets = '[data-reveal], .card, .section-heading';
  const seen = new WeakSet();
  let userPaused = false;
  let revealObserver;
  let scrollFrame = 0;
  let pointerFrame = 0;

  try {
    userPaused = localStorage.getItem('motion-paused') === 'true';
  } catch (_) {
    // Browsers may deny storage; the current-page controls still work.
  }

  function motionAllowed() {
    return !userPaused && !reduceMotion.matches;
  }

  function reveal(element) {
    element.classList.add('is-visible');
    if (revealObserver) revealObserver.unobserve(element);
  }

  function watch(element) {
    if (seen.has(element)) return;
    seen.add(element);
    if (!motionAllowed() || !revealObserver) return;
    const bounds = element.getBoundingClientRect();
    // Visible content should appear immediately, including restored scroll positions.
    if (bounds.top < window.innerHeight && bounds.bottom > 0) {
      element.classList.add('is-visible');
      return;
    }
    element.classList.add('reveal-ready');
    revealObserver.observe(element);
  }

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { threshold: 0.04, rootMargin: '0px 0px 24px 0px' });
  }

  function applyPreference() {
    const allowed = motionAllowed();
    root.dataset.motion = allowed ? 'running' : 'paused';
    if (!allowed) {
      document.querySelectorAll('.reveal-ready').forEach(reveal);
    }
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(!allowed));
      toggle.disabled = reduceMotion.matches;
      toggle.setAttribute('aria-label', reduceMotion.matches
        ? 'Animations paused by your reduced motion preference'
        : allowed ? 'Pause animations' : 'Resume animations');
      toggle.title = reduceMotion.matches ? 'Reduced motion is enabled in your system settings' : toggle.getAttribute('aria-label');
      const label = toggle.querySelector('[data-motion-label]');
      if (label) label.textContent = allowed ? 'Motion on' : 'Motion off';
    }
  }

  applyPreference();
  document.querySelectorAll(targets).forEach(watch);

  // Newly loaded project cards receive the same enhancement as static content.
  if ('MutationObserver' in window && revealObserver) {
    new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches(targets)) watch(node);
        node.querySelectorAll(targets).forEach(watch);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  // Keyboard focus always exposes the element, even before it crosses the viewport.
  document.addEventListener('focusin', event => {
    let element = event.target;
    while (element && element !== document.body) {
      if (element.classList.contains('reveal-ready')) reveal(element);
      element = element.parentElement;
    }
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      try { localStorage.setItem('motion-paused', String(userPaused)); } catch (_) {}
      applyPreference();
    });
  }
  reduceMotion.addEventListener('change', applyPreference);

  function updateScroll() {
    scrollFrame = 0;
    const distance = root.scrollHeight - window.innerHeight;
    const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  function scheduleScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });
  window.addEventListener('load', scheduleScroll, { once: true });
  updateScroll();

  document.querySelectorAll('.workflow-panel').forEach(panel => {
    panel.addEventListener('pointermove', event => {
      if (!finePointer.matches || !motionAllowed() || pointerFrame) return;
      const x = event.clientX;
      const y = event.clientY;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const bounds = panel.getBoundingClientRect();
        panel.style.setProperty('--pointer-x', `${x - bounds.left}px`);
        panel.style.setProperty('--pointer-y', `${y - bounds.top}px`);
      });
    }, { passive: true });
    panel.addEventListener('pointerleave', () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      panel.style.removeProperty('--pointer-x');
      panel.style.removeProperty('--pointer-y');
    });
  });

  function updateVisibility() {
    root.dataset.pageHidden = String(document.hidden);
  }
  document.addEventListener('visibilitychange', updateVisibility);
  updateVisibility();
})();
