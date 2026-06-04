/* ============================================================
   ADMIN.JS — Utilitaires back-office OUH Haiti
   ============================================================ */

'use strict';

const Admin = {

  /* ── Initialise un tableau admin ── */
  initTable({ tableId, data, columns, actions }) {
    const table = document.getElementById(tableId);
    if (!table) return;
    // Implémentation dans les pages spécifiques
  },

  /* ── Pagination ── */
  renderPagination(container, { page, pages, onPage }) {
    if (!container || pages <= 1) return;

    container.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'admin-page-btn';
    prev.textContent = '←';
    prev.disabled = page <= 1;
    prev.addEventListener('click', () => onPage(page - 1));
    container.appendChild(prev);

    for (let i = 1; i <= pages; i++) {
      const btn = document.createElement('button');
      btn.className = `admin-page-btn ${i === page ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => onPage(i));
      container.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'admin-page-btn';
    next.textContent = '→';
    next.disabled = page >= pages;
    next.addEventListener('click', () => onPage(page + 1));
    container.appendChild(next);
  },

  /* ── Gère le tag input ── */
  initTagInput(containerId, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return [];

    const tags = [];
    const input = container.querySelector('.tag-input');

    function addTag(value) {
      const v = value.trim();
      if (!v || tags.includes(v)) return;
      tags.push(v);

      const tag = document.createElement('span');
      tag.className = 'tag-item';
      tag.innerHTML = `${v}<span class="tag-remove" role="button" aria-label="Supprimer ${v}">×</span>`;
      tag.querySelector('.tag-remove').addEventListener('click', () => {
        tag.remove();
        const idx = tags.indexOf(v);
        if (idx > -1) tags.splice(idx, 1);
        onChange?.(tags);
      });

      container.insertBefore(tag, input);
      if (input) input.value = '';
      onChange?.(tags);
    }

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(input.value);
      }
    });

    container.addEventListener('click', () => input?.focus());

    return { tags, addTag };
  },

  /* ── Upload zone drag & drop ── */
  initUploadZone(zoneId, onFiles) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length) onFiles?.(files);
    });

    zone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.addEventListener('change', () => {
        const files = Array.from(input.files);
        if (files.length) onFiles?.(files);
      });
      input.click();
    });
  },

  /* ── Export CSV ── */
  exportCSV(data, filename = 'export.csv') {
    if (!data.length) return;

    const keys = Object.keys(data[0]);
    const rows = [
      keys.join(','),
      ...data.map(row =>
        keys.map(k => {
          const val = row[k] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },

  /* ── Génère un mot de passe temporaire ── */
  generateTempPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    const arr = new Uint8Array(length);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(b => chars[b % chars.length]).join('');
  }
};

window.Admin = Admin;
