/* ============================================================
   SUPABASE-AUTH.JS — Authentification via Supabase Auth
   ------------------------------------------------------------
   Réimplémente l'API de Auth (auth.js) avec l'authentification
   native de Supabase (email + mot de passe, hash bcrypt côté
   serveur, sessions JWT sécurisées).

   Conserve les MÊMES méthodes que auth.js pour compatibilité :
     login, logout, requireAuth, getCurrentUser,
     hasPermission, effectivePermissions

   Chargé après supabase-data.js. Actif seulement si Supabase
   est configuré ; sinon auth.js (IndexedDB) reste en place.
   ============================================================ */
'use strict';

(function () {
  if (!window.SUPABASE_READY || !window.sb) return;
  const sb = window.sb;

  /* Profil admin courant, mis en cache en mémoire + sessionStorage */
  let currentProfile = null;
  try {
    const cached = sessionStorage.getItem('ouh_profile');
    if (cached) currentProfile = JSON.parse(cached);
  } catch (_) {}

  const Auth = {

    ROLE_DEFAULTS: {
      superadmin:    ['*'],
      admin_general: ['blog.*', 'gallery.*', 'medecins.*', 'site_images.*'],
      admin_blog:    ['blog.*'],
      admin_gallery: ['gallery.*']
    },

    /* ── Connexion : accepte un email OU un nom d'utilisateur ── */
    async login(identifier, password) {
      try {
        let email = (identifier || '').trim();

        /* Si ce n'est pas un email, on résout le username → email
           via la table admins (lecture publique restreinte par RLS). */
        if (!email.includes('@')) {
          const { data: prof } = await sb.from('admins')
            .select('email, active').eq('username', email).maybeSingle();
          if (!prof) return { success: false, error: "Nom d'utilisateur introuvable." };
          if (prof.active === false) return { success: false, error: 'Ce compte est désactivé.' };
          email = prof.email;
        }

        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          return { success: false, error: 'Identifiants incorrects.' };
        }

        /* Charger le profil admin lié */
        const { data: profile } = await sb.from('admins')
          .select('*').eq('user_id', data.user.id).maybeSingle();

        if (!profile) {
          await sb.auth.signOut();
          return { success: false, error: "Aucun profil administrateur lié à ce compte." };
        }
        if (profile.active === false) {
          await sb.auth.signOut();
          return { success: false, error: 'Ce compte est désactivé.' };
        }

        currentProfile = normalizeProfile(profile);
        sessionStorage.setItem('ouh_profile', JSON.stringify(currentProfile));

        /* Mettre à jour la dernière connexion + journaliser */
        sb.from('admins').update({ last_login: new Date().toISOString() })
          .eq('id', profile.id).then(() => {});
        if (window.DataStore?.logAction) {
          window.DataStore.logAction(currentProfile.id, 'auth.login', { username: currentProfile.username });
        }

        return { success: true, user: currentProfile, mustChangePassword: false };
      } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: 'Erreur technique. Réessayez.' };
      }
    },

    /* ── Déconnexion ── */
    async logout() {
      try { await sb.auth.signOut(); } catch (_) {}
      currentProfile = null;
      sessionStorage.removeItem('ouh_profile');
      window.location.href = '/admin/login.html';
    },

    /* ── Garde d'accès : à appeler en haut de chaque page admin ──
       Asynchrone : vérifie la session Supabase réelle. */
    async requireAuth(allowedRoles = []) {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { window.location.href = '/admin/login.html'; return false; }

      if (!currentProfile || currentProfile.userId !== session.user.id) {
        const { data: profile } = await sb.from('admins')
          .select('*').eq('user_id', session.user.id).maybeSingle();
        if (!profile || profile.active === false) {
          await this.logout();
          return false;
        }
        currentProfile = normalizeProfile(profile);
        sessionStorage.setItem('ouh_profile', JSON.stringify(currentProfile));
      }

      if (allowedRoles.length && !allowedRoles.includes(currentProfile.role)) {
        window.location.href = '/admin/dashboard.html';
        return false;
      }
      return true;
    },

    getCurrentUser() { return currentProfile; },

    effectivePermissions(user) {
      user = user || currentProfile;
      if (!user) return [];
      if (user.role === 'superadmin') return ['*'];
      if (Array.isArray(user.permissions)) return user.permissions;
      return this.ROLE_DEFAULTS[user.role] || [];
    },

    hasPermission(action, user) {
      user = user || currentProfile;
      if (!user) return false;
      const perms = this.effectivePermissions(user);
      if (perms.includes('*')) return true;
      return perms.some(p => p === action || (p.endsWith('.*') && action.startsWith(p.slice(0, -2))));
    }
  };

  function normalizeProfile(p) {
    return {
      id:          p.id,
      userId:      p.user_id,
      username:    p.username,
      displayName: p.display_name,
      email:       p.email,
      role:        p.role,
      permissions: p.permissions || null,
      active:      p.active
    };
  }

  window.Auth = Auth;
  console.info('[Supabase] Authentification active ✔');
})();
