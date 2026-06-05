/* ============================================================
   AUTH.JS — Système d'authentification OUH Haiti
   Web Crypto API — Phase 3 (implémentation complète)
   ============================================================ */

'use strict';

/* Encapsulé dans une IIFE : n'expose QUE via window.Auth, sans liaison
   lexicale globale « Auth » qui masquerait la surcharge Supabase. */
(function () {

const Auth = {

  /* ── Hash SHA-256 ── */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /* ── Vérifie le mot de passe ── */
  async verifyPassword(password, hash) {
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  },

  /* ── Génère un token simple base64 ── */
  generateToken(userId, role) {
    const header = btoa(JSON.stringify({ alg: 'OUH', typ: 'TOKEN' }));
    const payload = btoa(JSON.stringify({
      userId,
      role,
      exp: Date.now() + (8 * 60 * 60 * 1000), // 8 heures
      iat: Date.now()
    }));
    const signature = btoa(`${userId}:${role}:${Date.now()}`);
    return `${header}.${payload}.${signature}`;
  },

  /* ── Vérifie et décode le token ── */
  verifyToken(token) {
    if (!token) return { valid: false, payload: null };
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false, payload: null };
      const payload = JSON.parse(atob(parts[1]));
      if (Date.now() > payload.exp) {
        return { valid: false, payload: null, reason: 'expired' };
      }
      return { valid: true, payload };
    } catch {
      return { valid: false, payload: null };
    }
  },

  /* ── Connexion ── */
  async login(username, password) {
    try {
      if (!window.DataStore) throw new Error('DataStore not available');
      await DataStore.init();
      await DataStore.importFromJSON('admins', '/data/admins.json');

      const admin = await DataStore.findAdminByUsername(username);

      if (!admin) {
        return { success: false, error: 'Nom d\'utilisateur introuvable.' };
      }

      if (!admin.active) {
        return { success: false, error: 'Ce compte est désactivé.' };
      }

      // Vérifier le lockout
      if (admin.lockedUntil && Date.now() < new Date(admin.lockedUntil).getTime()) {
        const remaining = Math.ceil((new Date(admin.lockedUntil).getTime() - Date.now()) / 60000);
        return { success: false, error: `Compte verrouillé. Réessayez dans ${remaining} minute(s).`, locked: true, remaining };
      }

      // Si passwordHash vide => première connexion, accepter n'importe quel mot de passe
      let passwordValid = false;
      if (!admin.passwordHash) {
        passwordValid = true; // Première connexion
      } else {
        passwordValid = await this.verifyPassword(password, admin.passwordHash);
      }

      if (!passwordValid) {
        const newAttempts = (admin.failedAttempts || 0) + 1;
        const updateData = { failedAttempts: newAttempts };

        if (newAttempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          updateData.failedAttempts = 0;
        }

        await DataStore.update('admins', admin.id, updateData);
        const remaining = 5 - newAttempts;
        return {
          success: false,
          error: remaining > 0
            ? `Mot de passe incorrect. ${remaining} tentative(s) restante(s).`
            : 'Compte verrouillé pour 30 minutes.'
        };
      }

      // Succès — générer token
      const token = this.generateToken(admin.id, admin.role);
      sessionStorage.setItem('ouh_token', token);
      sessionStorage.setItem('ouh_user', JSON.stringify({
        id:          admin.id,
        username:    admin.username,
        displayName: admin.displayName,
        email:       admin.email,
        role:        admin.role,
        mustChangePassword: admin.mustChangePassword || false
      }));

      // Mettre à jour la dernière connexion
      await DataStore.update('admins', admin.id, {
        lastLogin: new Date().toISOString(),
        failedAttempts: 0,
        lockedUntil: null
      });

      // Logguer la connexion
      await DataStore.logAction(admin.id, 'auth.login', { username: admin.username });

      return {
        success: true,
        user: admin,
        mustChangePassword: admin.mustChangePassword || false
      };

    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erreur technique. Réessayez.' };
    }
  },

  /* ── Déconnexion ── */
  logout() {
    sessionStorage.removeItem('ouh_token');
    sessionStorage.removeItem('ouh_user');
    window.location.href = (typeof _ADMIN_BASE !== 'undefined' ? _ADMIN_BASE : '/') + 'admin/login.html';
  },

  /* ── Vérifie l'auth (à appeler en haut de chaque page admin) ── */
  requireAuth(allowedRoles = []) {
    const token = sessionStorage.getItem('ouh_token');
    const { valid, payload } = this.verifyToken(token);

    if (!valid) {
      window.location.href = (typeof _ADMIN_BASE !== 'undefined' ? _ADMIN_BASE : '/') + 'admin/login.html';
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      window.location.href = (typeof _ADMIN_BASE !== 'undefined' ? _ADMIN_BASE : '/') + 'admin/dashboard.html';
      return false;
    }

    return true;
  },

  /* ── Utilisateur actuel ── */
  getCurrentUser() {
    try {
      const userStr = sessionStorage.getItem('ouh_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /* ── Permissions par défaut selon le rôle ──
     Sert de repli quand un admin n'a pas de permissions
     personnalisées définies par le superadmin. */
  ROLE_DEFAULTS: {
    superadmin:    ['*'],
    admin_general: ['blog.*', 'gallery.*', 'medecins.*', 'site_images.*'],
    admin_blog:    ['blog.*'],
    admin_gallery: ['gallery.*']
  },

  /* ── Permissions effectives d'un utilisateur ──
     Si l'objet admin possède un tableau `permissions`, il a la
     priorité (contrôle granulaire). Sinon, repli sur le rôle. */
  effectivePermissions(user) {
    if (!user) return [];
    if (user.role === 'superadmin') return ['*'];
    if (Array.isArray(user.permissions)) return user.permissions;
    return this.ROLE_DEFAULTS[user.role] || [];
  },

  /* ── Vérifier une permission ── */
  hasPermission(action, user) {
    user = user || this.getCurrentUser();
    if (!user) return false;

    const perms = this.effectivePermissions(user);
    if (perms.includes('*')) return true;

    return perms.some(perm => {
      if (perm === action) return true;
      if (perm.endsWith('.*')) return action.startsWith(perm.slice(0, -2));
      return false;
    });
  }
};

window.Auth = Auth;

})();
