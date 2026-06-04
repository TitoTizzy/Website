/* ============================================================
   MAIN.JS — JavaScript principal OUH Haiti
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────
   UTILITAIRES
   ───────────────────────────────────────────── */

/**
 * Formate une date en français haïtien
 */
function formatDate(dateString, locale = 'fr-FR') {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Tronque un texte à maxLength caractères
 */
function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Debounce — limite les appels répétés
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle — limite les appels dans le temps
 */
function throttle(fn, limit = 100) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Génère un UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Slugifie un titre en français
 */
function generateSlug(text) {
  const map = {
    'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'î': 'i', 'ï': 'i', 'í': 'i',
    'ô': 'o', 'ö': 'o', 'ó': 'o',
    'ù': 'u', 'û': 'u', 'ü': 'u', 'ú': 'u',
    'ç': 'c', 'ñ': 'n'
  };
  return text.toLowerCase()
    .replace(/[àâäáèéêëîïíôöóùûüúçñ]/g, (c) => map[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ─────────────────────────────────────────────
   PAGE LOADER
   ───────────────────────────────────────────── */
function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }, 800);
  });
}

/* ─────────────────────────────────────────────
   NAVBAR
   ───────────────────────────────────────────── */
function initNavbar() {
  const navbar  = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (!navbar) return;

  let lastScrollY = 0;
  let ticking = false;

  // Sticky shadow + hide/show on scroll
  function handleScroll() {
    const scrollY = window.scrollY;

    // Shadow
    if (scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Hide on scroll down, show on scroll up (after 100px)
    if (scrollY > 100) {
      if (scrollY > lastScrollY) {
        navbar.classList.add('hidden');
      } else {
        navbar.classList.remove('hidden');
      }
    } else {
      navbar.classList.remove('hidden');
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });

  // Hamburger toggle
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Fermer au clic sur un lien
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Toggle sous-menus mobile
    mobileNav.querySelectorAll('[data-toggle-submenu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.toggleSubmenu;
        const submenu = document.getElementById(targetId);
        if (submenu) {
          submenu.classList.toggle('open');
          const icon = btn.querySelector('.mobile-toggle-icon');
          if (icon) icon.textContent = submenu.classList.contains('open') ? '▲' : '▼';
        }
      });
    });
  }

  // Dropdown keyboard accessibility
  document.querySelectorAll('.nav-item[data-has-dropdown]').forEach(item => {
    const trigger = item.querySelector('.nav-link');

    if (trigger) {
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.classList.toggle('open');
        }
        if (e.key === 'Escape') {
          item.classList.remove('open');
          trigger.focus();
        }
      });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!item.contains(e.target)) {
        item.classList.remove('open');
      }
    });
  });

  // Mark active link
  markActiveNavLink();
}

function markActiveNavLink() {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const linkPath = href.replace(/\/$/, '') || '/';

    if (
      currentPath === linkPath ||
      currentPath.endsWith(linkPath) ||
      (linkPath !== '/' && currentPath.includes(linkPath))
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ─────────────────────────────────────────────
   HERO SLIDER
   ───────────────────────────────────────────── */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let currentIndex = 0;
  let autoPlayInterval = null;
  let touchStartX = 0;
  let touchEndX   = 0;

  const fadeTypes = ['fade-type-1', 'fade-type-2', 'fade-type-3', 'fade-type-4'];

  function goTo(index) {
    const randomFade = fadeTypes[Math.floor(Math.random() * fadeTypes.length)];
    slides[currentIndex].classList.remove('active', ...fadeTypes);
    dots[currentIndex]?.classList.remove('active');
    currentIndex = (index + slides.length) % slides.length;
    slides[currentIndex].classList.remove(...fadeTypes);
    slides[currentIndex].classList.add('active', randomFade);
    dots[currentIndex]?.classList.add('active');
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(next, 5000);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  // Dots navigation
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAutoPlay();
    });
  });

  // Touch / swipe
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    heroEl.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    heroEl.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? next() : prev();
        startAutoPlay();
      }
    }, { passive: true });

    // Pause on hover (desktop)
    heroEl.addEventListener('mouseenter', stopAutoPlay);
    heroEl.addEventListener('mouseleave', startAutoPlay);
  }

  // Init
  goTo(0);
  startAutoPlay();
}

/* ─────────────────────────────────────────────
   SCROLL ANIMATIONS (IntersectionObserver)
   ───────────────────────────────────────────── */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
   ───────────────────────────────────────────── */
function animateCounter(el, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function step(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOut(progress);
    const current  = Math.floor(start + eased * (target - start));

    el.textContent = current.toLocaleString('fr-FR');

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toLocaleString('fr-FR');
    }
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const statItems = document.querySelectorAll('.stat-item[data-count]');
  if (!statItems.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const numEl  = el.querySelector('.stat-number');
        if (numEl && !el.dataset.counted) {
          el.dataset.counted = 'true';
          animateCounter(numEl, target, 2000);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  statItems.forEach(item => observer.observe(item));
}

/* ─────────────────────────────────────────────
   BACK TO TOP
   ───────────────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, 200), { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATIONS
   ───────────────────────────────────────────── */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
}

/* ─────────────────────────────────────────────
   MODAL DE CONFIRMATION
   ───────────────────────────────────────────── */
function confirmModal(title, message, onConfirm, onCancel) {
  // Remove existing modal
  document.getElementById('confirm-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'confirm-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'confirm-modal-title');

  overlay.innerHTML = `
    <div class="modal" role="document">
      <h3 class="modal-title" id="confirm-modal-title">${title}</h3>
      <p class="modal-text">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modal-cancel">Annuler</button>
        <button class="btn btn-secondary" id="modal-confirm">Confirmer</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  function close() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 300);
  }

  overlay.querySelector('#modal-cancel').addEventListener('click', () => {
    close();
    onCancel?.();
  });

  overlay.querySelector('#modal-confirm').addEventListener('click', () => {
    close();
    onConfirm?.();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
      onCancel?.();
    }
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      close();
      onCancel?.();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

/* ─────────────────────────────────────────────
   SMOOTH SCROLL FOR ANCHOR LINKS
   ───────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ─────────────────────────────────────────────
   HERO SCROLL ARROW
   ───────────────────────────────────────────── */
function initHeroScrollArrow() {
  const arrow = document.querySelector('.hero-scroll');
  if (!arrow) return;

  arrow.addEventListener('click', () => {
    const nextSection = document.querySelector('.hero + *');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ─────────────────────────────────────────────
   INITIALISATION GLOBALE
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initNavbar();
  initHeroSlider();
  initScrollAnimations();
  initCounters();
  initBackToTop();
  initSmoothScroll();
  initHeroScrollArrow();
});

// Exporter pour usage dans d'autres modules
window.OUH = {
  formatDate,
  truncateText,
  debounce,
  throttle,
  generateUUID,
  generateSlug,
  showToast,
  confirmModal
};
