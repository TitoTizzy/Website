/* ============================================================
   STORAGE.JS — Couche données IndexedDB OUH Haiti
   ============================================================ */

'use strict';

/* Encapsulé dans une IIFE : n'expose QUE via window.DataStore, sans créer
   de liaison lexicale globale « DataStore » qui masquerait une surcharge
   ultérieure (ex. couche Supabase). Permet le basculement IndexedDB ↔ Supabase. */
(function () {

class DataStore {
  static DB_NAME    = 'ouh-cms';
  static DB_VERSION = 4;
  static STORES     = ['articles', 'galeries', 'admins', 'logs', 'settings', 'medecins', 'site_images', 'albums'];

  static db = null;

  /* ── Initialisation ── */
  static async init() {
    if (DataStore.db) return DataStore.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DataStore.DB_NAME, DataStore.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        DataStore.STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: 'id',
              autoIncrement: false
            });

            // Index spécifiques par store
            if (storeName === 'articles') {
              store.createIndex('status',    'status',    { unique: false });
              store.createIndex('category',  'category',  { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
              store.createIndex('slug',      'slug',      { unique: true });
            }

            if (storeName === 'galeries') {
              store.createIndex('status',    'status',    { unique: false });
              store.createIndex('category',  'category',  { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }

            if (storeName === 'admins') {
              store.createIndex('username', 'username', { unique: true });
              store.createIndex('email',    'email',    { unique: true });
              store.createIndex('role',     'role',     { unique: false });
            }

            if (storeName === 'logs') {
              store.createIndex('userId',    'userId',    { unique: false });
              store.createIndex('action',    'action',    { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }

            if (storeName === 'medecins') {
              store.createIndex('ordre',  'ordre',  { unique: false });
              store.createIndex('active', 'active', { unique: false });
            }
          }
        });
      };

      request.onsuccess = (event) => {
        DataStore.db = event.target.result;
        /* Si une autre tab demande une mise à niveau du schéma,
           on ferme cette connexion pour ne pas la bloquer. */
        DataStore.db.onversionchange = () => {
          DataStore.db.close();
          DataStore.db = null;
        };
        resolve(DataStore.db);
      };

      request.onblocked = () => {
        console.warn('IndexedDB: mise à niveau bloquée par une autre tab ouverte.');
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /* ── CRUD Générique ── */
  static async getAll(storeName) {
    const db = await DataStore.init();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction(storeName, 'readonly');
      const store   = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror   = () => reject(request.error);
    });
  }

  static async getById(storeName, id) {
    const db = await DataStore.init();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction(storeName, 'readonly');
      const store   = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror   = () => reject(request.error);
    });
  }

  static async create(storeName, data) {
    const db = await DataStore.init();
    const record = {
      ...data,
      id:        data.id || window.OUH?.generateUUID() || crypto.randomUUID(),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx      = db.transaction(storeName, 'readwrite');
      const store   = tx.objectStore(storeName);
      const request = store.add(record);
      request.onsuccess = () => resolve(record);
      request.onerror   = () => reject(request.error);
    });
  }

  static async update(storeName, id, data) {
    const db = await DataStore.init();
    const existing = await DataStore.getById(storeName, id);
    if (!existing) throw new Error(`Record ${id} not found in ${storeName}`);

    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx      = db.transaction(storeName, 'readwrite');
      const store   = tx.objectStore(storeName);
      const request = store.put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror   = () => reject(request.error);
    });
  }

  static async delete(storeName, id) {
    const db = await DataStore.init();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction(storeName, 'readwrite');
      const store   = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror   = () => reject(request.error);
    });
  }

  /* ── Articles ── */
  static async getPublishedArticles() {
    const articles = await DataStore.getAll('articles');
    return articles
      .filter(a => a.status === 'published')
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
  }

  static async getArticlesByCategory(category) {
    const articles = await DataStore.getPublishedArticles();
    return articles.filter(a => a.category === category);
  }

  static async searchArticles(query) {
    const articles = await DataStore.getPublishedArticles();
    const q = query.toLowerCase();
    return articles.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.excerpt?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q)
    );
  }

  static async getArticleBySlug(slug) {
    const articles = await DataStore.getAll('articles');
    return articles.find(a => a.slug === slug) || null;
  }

  /* ── Galeries ── */
  static async getPublishedGalleries() {
    const galleries = await DataStore.getAll('galeries');
    return galleries
      .filter(g => g.status === 'published')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async getGalleriesByCategory(category) {
    const galleries = await DataStore.getPublishedGalleries();
    return galleries.filter(g => g.category === category);
  }

  /* ── Admins ── */
  static async findAdminByUsername(username) {
    const admins = await DataStore.getAll('admins');
    return admins.find(a => a.username === username) || null;
  }

  static async findAdminByEmail(email) {
    const admins = await DataStore.getAll('admins');
    return admins.find(a => a.email === email) || null;
  }

  static async getActiveAdmins() {
    const admins = await DataStore.getAll('admins');
    return admins.filter(a => a.active !== false);
  }

  /* ── Logs ── */
  static async logAction(userId, action, details = {}) {
    const log = {
      id:        crypto.randomUUID(),
      userId,
      action,
      details:   JSON.stringify(details),
      ip:        'N/A', // pas accessible côté client
      createdAt: new Date().toISOString()
    };

    try {
      await DataStore.create('logs', log);
    } catch (err) {
      console.warn('Logging failed:', err);
    }

    return log;
  }

  static async getLogs(filters = {}) {
    const logs = await DataStore.getAll('logs');
    let result = [...logs];

    if (filters.userId) {
      result = result.filter(l => l.userId === filters.userId);
    }
    if (filters.action) {
      result = result.filter(l => l.action.includes(filters.action));
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(l => new Date(l.createdAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      result = result.filter(l => new Date(l.createdAt) <= to);
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /* ── Médecins ── */
  static async getMedecins() {
    const all = await DataStore.getAll('medecins');
    return all
      .filter(m => m.active !== false)
      .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  }

  static async getAllMedecins() {
    const all = await DataStore.getAll('medecins');
    return all.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  }

  /* ── Settings ── */
  static async getSettings() {
    const settings = await DataStore.getAll('settings');
    return settings[0] || null;
  }

  static async saveSettings(settingsData) {
    const existing = await DataStore.getSettings();
    if (existing) {
      return DataStore.update('settings', existing.id, settingsData);
    } else {
      return DataStore.create('settings', { id: 'site-settings', ...settingsData });
    }
  }

  /* ── Import depuis JSON (migration initiale) ── */
  static async importFromJSON(storeName, jsonPath) {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error(`Cannot fetch ${jsonPath}`);
      const data = await response.json();

      if (!Array.isArray(data)) {
        // Settings object
        await DataStore.saveSettings({ ...data, id: 'site-settings' });
        return;
      }

      for (const item of data) {
        const existing = item.id ? await DataStore.getById(storeName, item.id) : null;
        if (!existing) {
          await DataStore.create(storeName, item);
        }
      }
    } catch (err) {
      console.warn(`Import from JSON failed (${jsonPath}):`, err);
    }
  }

  /* ── Initialisation des données par défaut ── */
  static async initializeDefaults() {
    await DataStore.init();

    // Import depuis les fichiers JSON
    await DataStore.importFromJSON('admins',   '/data/admins.json');
    await DataStore.importFromJSON('settings', '/data/settings.json');
    // Articles et galeries : tableaux vides, ne pas importer si déjà des données

    console.log('✅ DataStore initialized');
  }
}

// Exposer globalement
window.DataStore = DataStore;

})();
