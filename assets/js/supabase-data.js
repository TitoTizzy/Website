/* ============================================================
   SUPABASE-DATA.JS — Couche de données Supabase
   ------------------------------------------------------------
   Réimplémente l'API de DataStore (storage.js) au-dessus de
   Supabase/PostgreSQL, en conservant les MÊMES noms de méthodes
   et le MÊME format camelCase, afin que toutes les pages admin
   et publiques existantes fonctionnent sans modification.

   Chargement requis AVANT ce fichier :
     1. https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
     2. supabase-config.js

   Activé seulement si window.SUPABASE_READY === true.
   Sinon, le DataStore IndexedDB d'origine reste en place (repli).
   ============================================================ */
'use strict';

(function () {
  if (!window.SUPABASE_CONFIG || !window.SUPABASE_READY) {
    console.info('[Supabase] Config absente — repli sur IndexedDB local.');
    return;
  }
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('[Supabase] SDK non chargé. Vérifiez la balise <script> du CDN.');
    return;
  }

  const sb = supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey,
    { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ouh-auth' } }
  );
  window.sb = sb;

  /* ── Tables gérées + mapping de colonnes camelCase ↔ snake_case ── */
  const COLMAP = {
    articles:    { publishedAt: 'published_at', authorId: 'author_id', createdAt: 'created_at', updatedAt: 'updated_at' },
    albums:      { coverUrl: 'cover_url', createdAt: 'created_at', updatedAt: 'updated_at' },
    galeries:    { albumId: 'album_id', createdAt: 'created_at', updatedAt: 'updated_at' },
    medecins:    { couleurDebut: 'couleur_debut', couleurFin: 'couleur_fin', photoUrl: 'photo_url', createdAt: 'created_at', updatedAt: 'updated_at' },
    conseil:     { roleTag: 'role_tag', photoUrl: 'photo_url', createdAt: 'created_at', updatedAt: 'updated_at' },
    site_images: { fileName: 'file_name', updatedAt: 'updated_at' },
    settings:    { 'articles-per-page': 'articles_per_page', updatedAt: 'updated_at' },
    admins:      { displayName: 'display_name', lastLogin: 'last_login', createdBy: 'created_by', userId: 'user_id', createdAt: 'created_at', updatedAt: 'updated_at' },
    logs:        { userId: 'user_id', createdAt: 'created_at' }
  };

  function toDb(store, obj) {
    const map = COLMAP[store] || {};
    const out = {};
    for (const k in obj) out[map[k] || k] = obj[k];
    return out;
  }
  function fromDb(store, row) {
    if (!row) return row;
    const map = COLMAP[store] || {};
    const inv = {}; for (const k in map) inv[map[k]] = k;
    const out = {};
    for (const k in row) out[inv[k] || k] = row[k];
    return out;
  }

  /* ============================================================
     DataStore — API compatible (remplace l'IndexedDB)
     ============================================================ */
  const DataStore = {
    async init() { return sb; },

    async getAll(store) {
      const { data, error } = await sb.from(store).select('*');
      if (error) throw error;
      return (data || []).map(r => fromDb(store, r));
    },

    async getById(store, id) {
      const { data, error } = await sb.from(store).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return fromDb(store, data);
    },

    async create(store, payload) {
      const row = toDb(store, payload);
      const { data, error } = await sb.from(store).insert(row).select().single();
      if (error) throw error;
      return fromDb(store, data);
    },

    async update(store, id, patch) {
      const row = toDb(store, patch);
      delete row.id;
      const { data, error } = await sb.from(store).update(row).eq('id', id).select().single();
      if (error) throw error;
      return fromDb(store, data);
    },

    async delete(store, id) {
      const { error } = await sb.from(store).delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    /* ── Articles ── */
    async getPublishedArticles() {
      const { data, error } = await sb.from('articles').select('*')
        .eq('status', 'published').order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => fromDb('articles', r));
    },
    async getArticlesByCategory(category) {
      return (await this.getPublishedArticles()).filter(a => a.category === category);
    },
    async searchArticles(query) {
      const q = (query || '').toLowerCase();
      return (await this.getPublishedArticles()).filter(a =>
        a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q));
    },
    async getArticleBySlug(slug) {
      const { data, error } = await sb.from('articles').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return fromDb('articles', data);
    },

    /* ── Galeries ── */
    async getPublishedGalleries() {
      const { data, error } = await sb.from('galeries').select('*')
        .eq('status', 'published').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => fromDb('galeries', r));
    },
    async getGalleriesByCategory(category) {
      return (await this.getPublishedGalleries()).filter(g => g.category === category);
    },

    /* ── Albums ── */
    async getPublishedAlbums() {
      const { data, error } = await sb.from('albums').select('*')
        .eq('status', 'published').order('ordre', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => fromDb('albums', r));
    },
    async getAllAlbums() {
      const { data, error } = await sb.from('albums').select('*').order('ordre', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => fromDb('albums', r));
    },
    async getAlbumPhotos(albumId, publishedOnly) {
      let q = sb.from('galeries').select('*').eq('album_id', albumId)
        .order('created_at', { ascending: true });
      if (publishedOnly) q = q.eq('status', 'published');
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => fromDb('galeries', r));
    },

    /* ── Médecins ── */
    async getMedecins() {
      const { data, error } = await sb.from('medecins').select('*')
        .eq('active', true).order('ordre', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => fromDb('medecins', r));
    },
    async getAllMedecins() {
      const { data, error } = await sb.from('medecins').select('*').order('ordre', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => fromDb('medecins', r));
    },

    /* ── Conseil d'administration ── */
    async getConseil() {
      const { data, error } = await sb.from('conseil').select('*')
        .eq('active', true).order('ordre', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => fromDb('conseil', r));
    },
    async getAllConseil() {
      const { data, error } = await sb.from('conseil').select('*').order('ordre', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => fromDb('conseil', r));
    },

    /* ── Admins ── */
    async findAdminByUsername(username) {
      const { data } = await sb.from('admins').select('*').eq('username', username).maybeSingle();
      return fromDb('admins', data);
    },
    async findAdminByEmail(email) {
      const { data } = await sb.from('admins').select('*').eq('email', email).maybeSingle();
      return fromDb('admins', data);
    },
    async getActiveAdmins() {
      const { data, error } = await sb.from('admins').select('*').eq('active', true);
      if (error) throw error;
      return (data || []).map(r => fromDb('admins', r));
    },

    /* ── Settings ── */
    async getSettings() {
      const { data, error } = await sb.from('settings').select('*').eq('id', 'site-settings').maybeSingle();
      if (error) throw error;
      return fromDb('settings', data);
    },
    async saveSettings(settingsData) {
      const row = toDb('settings', { ...settingsData, id: 'site-settings' });
      const { data, error } = await sb.from('settings').upsert(row).select().single();
      if (error) throw error;
      return fromDb('settings', data);
    },

    /* ── Logs ── */
    async logAction(userId, action, details = {}) {
      try {
        const { data, error } = await sb.from('logs')
          .insert({ user_id: userId || null, action, details }).select().single();
        if (error) throw error;
        return fromDb('logs', data);
      } catch (err) { console.warn('Logging failed:', err.message); return null; }
    },
    async getLogs(filters = {}) {
      let q = sb.from('logs').select('*').order('created_at', { ascending: false });
      if (filters.userId) q = q.eq('user_id', filters.userId);
      if (filters.action) q = q.ilike('action', '%' + filters.action + '%');
      if (filters.dateFrom) q = q.gte('created_at', new Date(filters.dateFrom).toISOString());
      if (filters.dateTo)   q = q.lte('created_at', new Date(filters.dateTo).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => fromDb('logs', r));
    },

    /* ── Upload d'image vers Supabase Storage ──
       Renvoie l'URL publique du fichier téléversé. */
    async uploadImage(file, keyPrefix) {
      const bucket = window.SUPABASE_CONFIG.bucket || 'medias';
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = (keyPrefix ? keyPrefix + '/' : '') + Date.now() + '-' +
                   Math.random().toString(36).slice(2, 8) + '.' + ext;
      const { error } = await sb.storage.from(bucket).upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type
      });
      if (error) throw error;
      const { data } = sb.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },

    /* ── Click Events (Analytics visiteurs) ── */
    async getClickEvents(filters = {}) {
      let q = sb.from('click_events').select('*').order('created_at', { ascending: false });
      if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
      if (filters.dateTo)   q = q.lte('created_at', filters.dateTo);
      if (filters.page)     q = q.eq('page', filters.page);
      q = q.limit(filters.limit || 2000);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id, page: r.page, element: r.element,
        label: r.label, href: r.href, section: r.section,
        posX: r.pos_x, posY: r.pos_y, createdAt: r.created_at
      }));
    },
    async purgeClickEvents() {
      const { error } = await sb.from('click_events').delete().gt('created_at', '2000-01-01');
      if (error) throw error;
      return true;
    },

    /* importFromJSON : no-op côté serveur (les données vivent dans la base). */
    async importFromJSON() { return; }
  };

  window.DataStore = DataStore;
  console.info('[Supabase] Couche de données active ✔');
})();
