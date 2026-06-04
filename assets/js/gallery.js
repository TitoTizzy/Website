/* ============================================================
   GALLERY.JS — Module galeries OUH Haiti
   ============================================================ */

'use strict';

const Gallery = {

  /* ── Chargement des galeries ── */
  async loadGalleries() {
    await DataStore.init();
    return DataStore.getAll('galeries');
  },

  /* ── Sauvegarde une galerie ── */
  async saveGallery(galleryData) {
    const isNew = !galleryData.id;
    const user = window.Auth?.getCurrentUser();

    const data = {
      ...galleryData,
      updatedAt: new Date().toISOString()
    };

    if (!data.createdBy && user) data.createdBy = user.id;

    let result;
    if (isNew) {
      result = await DataStore.create('galeries', data);
      await DataStore.logAction(user?.id, 'gallery.create', { title: data.title });
    } else {
      result = await DataStore.update('galeries', data.id, data);
      await DataStore.logAction(user?.id, 'gallery.update', { id: data.id, title: data.title });
    }

    return result;
  },

  /* ── Supprime une galerie ── */
  async deleteGallery(id) {
    await DataStore.delete('galeries', id);
    const user = window.Auth?.getCurrentUser();
    await DataStore.logAction(user?.id, 'gallery.delete', { id });
    return true;
  },

  /* ── Render galeries publiques ── */
  renderGalleryGrid(galleries) {
    if (!galleries.length) {
      return `<div class="empty-state">
        <div class="empty-state-icon">🖼️</div>
        <h3 class="empty-state-title">Aucune galerie disponible</h3>
        <p class="empty-state-text">Revenez bientôt pour découvrir nos photos !</p>
      </div>`;
    }

    return `<div class="grid grid-3">
      ${galleries.map((g, i) => `
        <div class="gallery-card" onclick="Gallery.openLightbox(${i})" role="button" tabindex="0" aria-label="Ouvrir la galerie ${g.title}">
          <div class="gallery-card-img">
            ${g.coverImage
              ? `<img src="${g.coverImage}" alt="${g.title}" loading="lazy" />`
              : `<div style="width:100%;height:100%;background:var(--gradient-hero);display:flex;align-items:center;justify-content:center;font-size:3rem;" aria-hidden="true">🖼️</div>`
            }
          </div>
          <div class="gallery-card-overlay">
            <h3 class="gallery-card-title">${g.title}</h3>
            <p class="gallery-card-count">${g.images?.length || 0} photo(s) • ${g.category || ''}</p>
          </div>
        </div>
      `).join('')}
    </div>`;
  },

  /* ── Lightbox natif ── */
  _lightboxGalleries: [],
  _lightboxCurrentGallery: 0,
  _lightboxCurrentImage: 0,

  initLightbox(galleries) {
    this._lightboxGalleries = galleries;
  },

  openLightbox(galleryIndex, imageIndex = 0) {
    const gallery = this._lightboxGalleries[galleryIndex];
    if (!gallery?.images?.length) return;

    this._lightboxCurrentGallery = galleryIndex;
    this._lightboxCurrentImage = imageIndex;

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Galerie ${gallery.title}`);
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(10,14,26,0.95);z-index:3000;
      display:flex;align-items:center;justify-content:center;
      animation:fadeIn 0.2s ease;
    `;

    overlay.innerHTML = `
      <button id="lb-close" aria-label="Fermer la galerie" style="position:absolute;top:1.5rem;right:1.5rem;background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:1.25rem;transition:background 0.2s;">✕</button>
      <button id="lb-prev" aria-label="Image précédente" style="position:absolute;left:1.5rem;background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:1.5rem;transition:background 0.2s;">‹</button>
      <div id="lb-content" style="max-width:90vw;max-height:90vh;text-align:center;">
        <img id="lb-img" src="" alt="" style="max-width:100%;max-height:80vh;object-fit:contain;border-radius:8px;" />
        <p id="lb-caption" style="color:rgba(255,255,255,0.7);font-family:'DM Sans',sans-serif;font-size:0.875rem;margin-top:1rem;"></p>
        <p id="lb-counter" style="color:rgba(255,255,255,0.4);font-family:'DM Sans',sans-serif;font-size:0.75rem;margin-top:0.25rem;"></p>
      </div>
      <button id="lb-next" aria-label="Image suivante" style="position:absolute;right:1.5rem;background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:1.5rem;transition:background 0.2s;">›</button>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    this._updateLightboxImage();

    // Events
    overlay.querySelector('#lb-close').addEventListener('click', () => this.closeLightbox());
    overlay.querySelector('#lb-prev').addEventListener('click', () => this.lightboxNav(-1));
    overlay.querySelector('#lb-next').addEventListener('click', () => this.lightboxNav(1));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeLightbox();
    });

    // Keyboard
    this._lightboxKeyHandler = (e) => {
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.lightboxNav(-1);
      if (e.key === 'ArrowRight') this.lightboxNav(1);
    };
    document.addEventListener('keydown', this._lightboxKeyHandler);

    // Touch swipe
    let touchStartX = 0;
    overlay.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    overlay.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) this.lightboxNav(diff > 0 ? 1 : -1);
    }, { passive: true });
  },

  _updateLightboxImage() {
    const gallery = this._lightboxGalleries[this._lightboxCurrentGallery];
    const image = gallery?.images?.[this._lightboxCurrentImage];
    if (!image) return;

    const img = document.getElementById('lb-img');
    const caption = document.getElementById('lb-caption');
    const counter = document.getElementById('lb-counter');

    if (img) img.src = typeof image === 'string' ? image : image.src || image.url || '';
    if (img) img.alt = (typeof image === 'object' && image.alt) || gallery.title;
    if (caption) caption.textContent = (typeof image === 'object' && image.caption) || '';
    if (counter) counter.textContent = `${this._lightboxCurrentImage + 1} / ${gallery.images.length}`;
  },

  lightboxNav(direction) {
    const gallery = this._lightboxGalleries[this._lightboxCurrentGallery];
    const total = gallery?.images?.length || 0;
    this._lightboxCurrentImage = (this._lightboxCurrentImage + direction + total) % total;
    this._updateLightboxImage();
  },

  closeLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    overlay?.remove();
    document.body.style.overflow = '';
    if (this._lightboxKeyHandler) {
      document.removeEventListener('keydown', this._lightboxKeyHandler);
    }
  },

  /* ── Upload image via FileReader ── */
  handleImageUpload(files) {
    return Promise.all(Array.from(files).map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          src: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type,
          caption: '',
          alt: file.name.replace(/\.[^.]+$/, '')
        });
        reader.readAsDataURL(file);
      });
    }));
  },

  /* ── Drag & Drop réorganisation ── */
  initDragAndDrop(container) {
    let dragged = null;

    container.querySelectorAll('[draggable="true"]').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        dragged = item;
        e.dataTransfer.effectAllowed = 'move';
        item.style.opacity = '0.5';
      });

      item.addEventListener('dragend', () => {
        item.style.opacity = '';
        dragged = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (dragged && dragged !== item) {
          const parent = item.parentNode;
          const draggedIndex = [...parent.children].indexOf(dragged);
          const targetIndex  = [...parent.children].indexOf(item);
          if (draggedIndex < targetIndex) {
            parent.insertBefore(dragged, item.nextSibling);
          } else {
            parent.insertBefore(dragged, item);
          }
        }
      });
    });
  }
};

window.Gallery = Gallery;
