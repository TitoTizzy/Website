/* ============================================================
   SITE-IMAGES.JS — Remplacement des photos du site vitrine
   Applique les images téléversées depuis le panel admin
   (magasin IndexedDB « site_images ») sur les éléments
   marqués d'un attribut data-img-key.
   Dépend de storage.js (DataStore).
   ============================================================ */
'use strict';

(function () {

  async function applyOverrides() {
    const elements = document.querySelectorAll('[data-img-key]');
    if (!elements.length) return;

    let overrides = {};
    try {
      if (typeof DataStore === 'undefined') return;
      await DataStore.init();
      const records = await DataStore.getAll('site_images');
      records.forEach(r => { if (r && r.id) overrides[r.id] = r; });
    } catch (err) {
      console.warn('site-images: lecture impossible', err);
      return;
    }

    elements.forEach(el => {
      const key = el.getAttribute('data-img-key');
      const rec = overrides[key];
      if (!rec) return;

      /* Remplacement du fichier image : URL Storage (Supabase) en priorité,
         sinon base64 local (repli IndexedDB). */
      const imgSrc = rec.url || rec.dataUrl;
      if (imgSrc) {
        if (el.hasAttribute('data-img-bg')) {
          el.style.backgroundImage = "url('" + imgSrc + "')";
        } else {
          el.src = imgSrc;
          el.removeAttribute('srcset');
          /* S'assurer que la photo remplit son conteneur sans déborder */
          if (!el.style.objectFit) {
            el.style.objectFit    = 'cover';
            el.style.objectPosition = el.style.objectPosition || 'center';
            el.style.width        = el.style.width  || '100%';
            el.style.height       = el.style.height || '100%';
          }
        }
      }

      /* Remplacement du texte alternatif / titre (description) */
      if (rec.alt && !el.hasAttribute('data-img-bg')) {
        el.alt = rec.alt;
      }
      if (rec.alt) {
        el.setAttribute('aria-label', rec.alt);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOverrides);
  } else {
    applyOverrides();
  }

  /* Exposé pour rechargement manuel éventuel */
  window.SiteImages = { apply: applyOverrides };
})();
