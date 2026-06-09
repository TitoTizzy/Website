/* ============================================================
   ADMIN-UI.JS — Module partagé back-office OUH Haiti
   Injecte la sidebar, vérifie l'auth, fournit des helpers UI
   ============================================================ */
'use strict';

/* ── Détection du préfixe de base (compatible GitHub Pages et domaine racine) ──
   Ex : sur titotizzy.github.io/Website/admin/blog/...  → BASE = '/Website/'
        sur ouhhaiti.org/admin/blog/...                 → BASE = '/'          */
const _ADMIN_BASE = (() => {
  const p = window.location.pathname;
  const i = p.indexOf('/admin/');
  return i === -1 ? '/' : p.substring(0, i + 1); // ex: '/Website/' ou '/'
})();

const AdminUI = {

  /* ── Icônes SVG ── */
  ICONS: {
    dashboard:  `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    articles:   `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    galeries:   `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    admins:     `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    parametres: `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    logs:       `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    medecins:   `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/><circle cx="19" cy="5" r="2"/><path d="M19 7v4"/><path d="M17 9h4"/></svg>`,
    conseil:    `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    contact:    `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    medias:     `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    analytics:  `<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="18" y="4" width="4" height="17" rx="1"/></svg>`,
    logout:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
  },

  /* ── Carte : page admin → permission requise ──
     Sert à filtrer la sidebar et à protéger chaque page. */
  PAGE_PERMISSION: {
    dashboard:  null,            // toujours accessible une fois connecté
    articles:   'blog.*',
    galeries:   'gallery.*',
    medecins:   'medecins.*',
    conseil:    'medecins.*',
    contact:    'settings.*',
    medias:     'site_images.*',
    admins:     'admins.*',
    parametres: 'settings.*',
    logs:       'logs.*',
    analytics:  'logs.*'
  },

  /* Vérifie si l'utilisateur courant peut voir/accéder à une page admin */
  canAccessPage(pageKey, user) {
    const perm = this.PAGE_PERMISSION[pageKey];
    if (!perm) return true;                       // dashboard
    return window.Auth ? window.Auth.hasPermission(perm, user) : true;
  },

  /* ── Génère le HTML de la sidebar (filtrée par permissions) ── */
  buildSidebarHTML(activePage, user) {
    const I = this.ICONS;
    const can = (key) => this.canAccessPage(key, user);
    const navLink = (key, href, icon, label) =>
      can(key)
        ? `<a href="${href}" class="admin-nav-link${activePage === key ? ' active' : ''}"${activePage === key ? ' aria-current="page"' : ''}>${icon}${label}</a>`
        : '';

    const contenu = ['articles','galeries','medecins','conseil','medias','contact'].some(can);
    const superSection = ['admins','parametres','logs','analytics'].some(can);

    const B = _ADMIN_BASE; // ex: '/Website/' ou '/'
    return `
      <div class="admin-sidebar-logo">
        <img src="${B}assets/images/logo/logo.png" alt="Logo OUH" width="36" height="36" style="object-fit:contain;border-radius:6px;">
        <div><div class="admin-sidebar-logo-text">OUH Admin</div><div class="admin-sidebar-logo-sub">Back-office</div></div>
      </div>
      <div class="admin-user-info">
        <div class="admin-user-avatar" id="sidebar-avatar">SA</div>
        <div class="admin-user-name" id="sidebar-name">Chargement…</div>
        <div class="admin-user-role" id="sidebar-role">—</div>
      </div>
      <nav class="admin-nav" aria-label="Navigation administration">
        <div class="admin-nav-section">
          <div class="admin-nav-section-title">Général</div>
          ${navLink('dashboard', B+'admin/dashboard.html', I.dashboard, 'Tableau de bord')}
        </div>
        ${contenu ? `
        <div class="admin-nav-section">
          <div class="admin-nav-section-title">Contenu</div>
          ${navLink('articles', B+'admin/blog/liste-articles.html', I.articles, 'Articles (Blog)')}
          ${navLink('galeries', B+'admin/galerie/liste-galeries.html', I.galeries, 'Galeries')}
          ${navLink('medecins', B+'admin/medecins/liste-medecins.html', I.medecins, 'Médecins')}
          ${navLink('conseil',  B+'admin/conseil/liste-conseil.html',  I.conseil,  "Conseil d'admin.")}
          ${navLink('medias',   B+'admin/medias/gestion-images.html',  I.medias,   'Images du site')}
          ${navLink('contact',  B+'admin/contact/messages.html',       I.contact,  'Messages contact')}
        </div>` : ''}
        ${superSection ? `
        <div class="admin-nav-section">
          <div class="admin-nav-section-title">SuperAdmin</div>
          ${navLink('admins',     B+'admin/superadmin/gestion-admins.html',  I.admins,     'Gestion Admins')}
          ${navLink('parametres', B+'admin/superadmin/parametres-site.html', I.parametres, 'Paramètres du site')}
          ${navLink('logs',       B+'admin/superadmin/logs.html',            I.logs,       "Journaux d'activité")}
          ${navLink('analytics', B+'admin/superadmin/clics.html',           I.analytics,  'Clics (Analytics)')}
        </div>` : ''}
      </nav>
      <div class="admin-sidebar-footer">
        <button class="admin-logout-btn" id="logout-btn">${I.logout} Se déconnecter</button>
      </div>`;
  },

  /* ── Initialisation de la page admin ── */
  async init(config = {}) {
    const page  = config.page  || 'dashboard';
    const roles = config.roles || ['superadmin','admin_general','admin_blog','admin_gallery'];

    /* 1. Vérification auth (connexion + rôle).
       requireAuth peut être synchrone (IndexedDB) ou asynchrone
       (Supabase) ; `await` gère les deux cas. S'il renvoie false,
       une redirection est déjà en cours : on stoppe. */
    if (window.Auth) {
      const ok = await window.Auth.requireAuth(roles);
      if (ok === false) return null;
    }

    /* 2. Utilisateur courant */
    const user = window.Auth?.getCurrentUser();

    /* 2b. Vérification de la permission granulaire pour cette page.
       Le superadmin a '*' donc passe toujours. Un admin dont l'accès
       a été désactivé via le panneau est redirigé vers le tableau de bord. */
    if (user && user.role !== 'superadmin' && !this.canAccessPage(page, user)) {
      window.location.href = _ADMIN_BASE + 'admin/dashboard.html';
      return user;
    }

    /* 3. Injection sidebar (filtrée selon les permissions) */
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.innerHTML = this.buildSidebarHTML(page, user);

    /* 4. Remplissage user info */
    if (user) {
      const initials = (user.displayName || user.username || 'AD')
        .split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('sidebar-avatar', initials);
      set('sidebar-name',   user.displayName || user.username);
      set('sidebar-role',   (user.role || '').replace(/_/g, ' '));
      set('topbar-avatar',  initials);
      set('topbar-name',    user.displayName || user.username);
    }

    /* 5. Logout */
    document.addEventListener('click', e => {
      if (e.target.closest('#logout-btn')) window.Auth?.logout();
    });

    /* 6. Déconnexion automatique après inactivité */
    this.initIdleTimeout();

    return user;
  },

  /* ── Déconnexion automatique après inactivité ──
     15 min sans activité → déconnexion. Avertissement à 14 min.
     Le minuteur est remis à zéro à chaque interaction. */
  initIdleTimeout(minutes = 15) {
    const LIMIT   = minutes * 60 * 1000;
    /* Avertir 60 s avant, mais jamais plus tôt que la moitié du délai
       (évite un délai négatif si la limite est très courte). */
    const WARN_AT = Math.min(60 * 1000, LIMIT / 2);
    let warnTimer, logoutTimer, warned = false;

    const doLogout = () => {
      try { sessionStorage.setItem('ouh_logout_reason', 'idle'); } catch (_) {}
      if (window.Auth?.logout) window.Auth.logout();
      else window.location.href = _ADMIN_BASE + 'admin/login.html';
    };

    const reset = () => {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      if (warned) { warned = false; const t = document.getElementById('idle-warn-toast'); if (t) t.remove(); }
      warnTimer   = setTimeout(showWarning, LIMIT - WARN_AT);
      logoutTimer = setTimeout(doLogout, LIMIT);
    };

    const showWarning = () => {
      warned = true;
      const t = document.createElement('div');
      t.id = 'idle-warn-toast';
      t.setAttribute('role', 'alert');
      t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#fef3c7;border:1px solid #d97706;color:#92400e;padding:.875rem 1.5rem;border-radius:10px;font-family:var(--font-ui),sans-serif;font-size:.875rem;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.15);text-align:center;';
      t.textContent = 'Vous allez être déconnecté dans 1 minute pour inactivité. Bougez la souris pour rester connecté.';
      document.body.appendChild(t);
    };

    /* Activités qui réarment le minuteur (throttle léger) */
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last < 1000) return;   // au plus une fois par seconde
      last = now;
      reset();
    };
    ['mousemove','mousedown','keydown','scroll','touchstart','click'].forEach(ev =>
      window.addEventListener(ev, onActivity, { passive: true })
    );

    reset();   // démarrage
  },

  /* ── Toast notification ── */
  toast(message, type = 'success') {
    const C = {
      success: ['#dcfce7','#16a34a','#166534'],
      error:   ['#fee2e2','#dc2626','#991b1b'],
      info:    ['#dbeafe','#2563eb','#1d4ed8'],
      warning: ['#fef3c7','#d97706','#92400e']
    };
    const [bg, border, color] = C[type] || C.info;
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;background:${bg};border:1px solid ${border};color:${color};border-radius:10px;padding:.875rem 1.25rem;font-family:var(--font-ui);font-size:.875rem;font-weight:500;max-width:340px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.12);transition:opacity .3s;`;
    t.setAttribute('role', 'alert');
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; }, 3000);
    setTimeout(() => t.remove(), 3350);
  },

  /* ── Badge de statut ── */
  statusBadge(status) {
    const M = { published:['Publié','badge-green'], draft:['Brouillon','badge-gray'], archived:['Archivé','badge-red'] };
    const [label, cls] = M[status] || [status, 'badge-gray'];
    return `<span class="badge ${cls}">${label}</span>`;
  },

  /* ── Label catégorie ── */
  catLabel(cat) {
    const M = { sante:'Santé', education:'Éducation', humanitaire:'Humanitaire', evenements:'Événements', missions:'Missions', terrain:'Terrain' };
    return M[cat] || cat || '—';
  },

  /* ── Formatage date ── */
  formatDate(iso, short = false) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', short
      ? { day:'2-digit', month:'2-digit', year:'numeric' }
      : { day:'numeric', month:'short', year:'numeric' });
  },

  /* ── Tronquer texte ── */
  truncate(text, max = 60) {
    if (!text || text.length <= max) return text || '';
    return text.slice(0, max).trim() + '…';
  },

  /* ── Confirmation ── */
  confirm(msg) { return window.confirm(msg); },

  /* ── Paramètre URL ── */
  getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  },

  /* ── Ligne vide pour tables ── */
  emptyRow(cols, msg) {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:3rem;color:var(--color-muted);font-size:.875rem;">${msg}</td></tr>`;
  }
};

window.AdminUI = AdminUI;
