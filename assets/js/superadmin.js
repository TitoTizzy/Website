/* ============================================================
   SUPERADMIN.JS — Module SuperAdmin OUH Haiti
   ============================================================ */

'use strict';

const SuperAdmin = {

  /* ── CRUD Admins ── */
  async createAdmin({ displayName, username, email, role, tempPassword }) {
    const passwordHash = await window.Auth.hashPassword(tempPassword);
    const admin = {
      id:                 crypto.randomUUID(),
      username,
      displayName,
      email,
      role,
      passwordHash,
      createdAt:          new Date().toISOString(),
      createdBy:          window.Auth.getCurrentUser()?.id || 'superadmin',
      lastLogin:          null,
      active:             true,
      mustChangePassword: true,
      failedAttempts:     0,
      lockedUntil:        null
    };

    await DataStore.create('admins', admin);
    await DataStore.logAction(window.Auth.getCurrentUser()?.id, 'admin.create', { username, role });
    return admin;
  },

  async updateAdmin(id, data) {
    const result = await DataStore.update('admins', id, data);
    await DataStore.logAction(window.Auth.getCurrentUser()?.id, 'admin.update', { id });
    return result;
  },

  async deleteAdmin(id) {
    // Protéger le superadmin principal
    const admin = await DataStore.getById('admins', id);
    if (admin?.username === 'superadmin') {
      throw new Error('Impossible de supprimer le compte superadmin principal.');
    }
    await DataStore.delete('admins', id);
    await DataStore.logAction(window.Auth.getCurrentUser()?.id, 'admin.delete', { id });
  },

  async resetAdminPassword(adminId, newPassword) {
    const hash = await window.Auth.hashPassword(newPassword);
    await DataStore.update('admins', adminId, {
      passwordHash:       hash,
      mustChangePassword: true,
      failedAttempts:     0,
      lockedUntil:        null
    });
    await DataStore.logAction(window.Auth.getCurrentUser()?.id, 'admin.reset_password', { adminId });
  },

  async toggleAdminStatus(adminId) {
    const admin = await DataStore.getById('admins', adminId);
    if (!admin) throw new Error('Admin introuvable.');
    if (admin.username === 'superadmin') {
      throw new Error('Impossible de désactiver le compte superadmin principal.');
    }

    const currentUser = window.Auth.getCurrentUser();
    if (admin.id === currentUser?.id) {
      throw new Error('Impossible de désactiver votre propre compte.');
    }

    await DataStore.update('admins', adminId, { active: !admin.active });
    await DataStore.logAction(currentUser?.id, 'admin.toggle_status', { adminId, newStatus: !admin.active });
    return !admin.active;
  },

  /* ── Settings ── */
  async saveSettings(settingsData) {
    const result = await DataStore.saveSettings(settingsData);
    await DataStore.logAction(window.Auth.getCurrentUser()?.id, 'settings.update', {});
    return result;
  },

  /* ── Logs ── */
  renderLogsTable(logs) {
    if (!logs.length) {
      return `<div class="empty-state"><div class="empty-state-icon">📋</div><h3 class="empty-state-title">Aucun journal</h3></div>`;
    }

    return `
      <div class="admin-table-wrap">
        <table class="admin-table" aria-label="Journaux d'activité">
          <thead>
            <tr>
              <th>Date/Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td style="white-space:nowrap;font-size:0.8125rem;">${new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                <td style="font-size:0.8125rem;font-weight:500;">${l.userId || '—'}</td>
                <td><code style="background:var(--color-light);padding:2px 6px;border-radius:4px;font-size:0.75rem;">${l.action}</code></td>
                <td style="font-size:0.8125rem;color:var(--color-muted);">${l.details || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  exportLogsCSV(logs) {
    window.Admin?.exportCSV(
      logs.map(l => ({
        date:        l.createdAt,
        utilisateur: l.userId || '',
        action:      l.action,
        details:     l.details || '',
        ip:          l.ip || 'N/A'
      })),
      `ouh-logs-${new Date().toISOString().slice(0, 10)}.csv`
    );
  },

  /* ── Render table admins ── */
  renderAdminsTable(admins) {
    const roleLabels = {
      superadmin:    'SuperAdmin',
      admin_general: 'Admin Général',
      admin_blog:    'Admin Blog',
      admin_gallery: 'Admin Galerie'
    };

    return `
      <div class="admin-table-wrap">
        <table class="admin-table" aria-label="Liste des administrateurs">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${admins.map(a => {
              const initials = a.displayName?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'AD';
              return `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                      <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient-hero);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;color:#fff;flex-shrink:0;">${initials}</div>
                      <div>
                        <div style="font-weight:600;font-size:0.875rem;">${a.displayName || a.username}</div>
                        <div style="font-size:0.75rem;color:var(--color-muted);">@${a.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-size:0.8125rem;">${a.email || '—'}</td>
                  <td><span class="badge badge-blue">${roleLabels[a.role] || a.role}</span></td>
                  <td><span class="status-badge ${a.active ? 'active' : 'inactive'}">${a.active ? 'Actif' : 'Inactif'}</span></td>
                  <td style="font-size:0.8125rem;color:var(--color-muted);">${a.lastLogin ? new Date(a.lastLogin).toLocaleString('fr-FR') : 'Jamais'}</td>
                  <td>
                    <div class="admin-table-actions">
                      <button class="admin-action-btn" title="Modifier le rôle" onclick="SuperAdmin.openEditModal('${a.id}')">✏️</button>
                      <button class="admin-action-btn" title="Réinitialiser le mot de passe" onclick="SuperAdmin.promptResetPassword('${a.id}', '${a.username}')">🔑</button>
                      <button class="admin-action-btn" title="${a.active ? 'Désactiver' : 'Activer'}" onclick="SuperAdmin.confirmToggle('${a.id}', ${a.active})">${a.active ? '⏸️' : '▶️'}</button>
                      ${a.username !== 'superadmin' ? `<button class="admin-action-btn danger" title="Supprimer" onclick="SuperAdmin.confirmDelete('${a.id}')">🗑️</button>` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  confirmDelete(id) {
    window.OUH?.confirmModal(
      'Supprimer ce compte',
      'Cette action est irréversible. Confirmer ?',
      async () => {
        try {
          await SuperAdmin.deleteAdmin(id);
          window.OUH?.showToast('Compte supprimé.', 'success');
          window.location.reload();
        } catch (err) {
          window.OUH?.showToast(err.message, 'error');
        }
      }
    );
  },

  confirmToggle(id, isActive) {
    window.OUH?.confirmModal(
      isActive ? 'Désactiver ce compte' : 'Activer ce compte',
      isActive
        ? 'Cet administrateur ne pourra plus se connecter.'
        : 'Cet administrateur pourra à nouveau se connecter.',
      async () => {
        try {
          await SuperAdmin.toggleAdminStatus(id);
          window.OUH?.showToast(isActive ? 'Compte désactivé.' : 'Compte activé.', 'success');
          window.location.reload();
        } catch (err) {
          window.OUH?.showToast(err.message, 'error');
        }
      }
    );
  },

  promptResetPassword(id, username) {
    const newPass = window.Admin?.generateTempPassword() || 'TempPass123!';
    window.OUH?.confirmModal(
      `Réinitialiser le mot de passe`,
      `Le nouveau mot de passe temporaire pour <strong>@${username}</strong> sera :<br><br><code style="font-family:monospace;font-size:1rem;background:#f3f4f6;padding:4px 8px;border-radius:4px;">${newPass}</code><br><br>L'utilisateur devra le changer à la prochaine connexion.`,
      async () => {
        try {
          await SuperAdmin.resetAdminPassword(id, newPass);
          window.OUH?.showToast('Mot de passe réinitialisé.', 'success');
        } catch (err) {
          window.OUH?.showToast(err.message, 'error');
        }
      }
    );
  },

  /* ── Modale Créer / Modifier admin ── */
  openCreateModal() {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    document.getElementById('admin-modal-title').textContent = 'Ajouter un administrateur';
    document.getElementById('admin-form').reset();
    document.getElementById('admin-modal-id').value = '';
    document.getElementById('modal-username-group').style.display = 'block';
    document.getElementById('modal-password-group').style.display = 'block';
    modal.classList.add('open');
    setTimeout(() => document.getElementById('admin-modal-name')?.focus(), 50);
  },

  async openEditModal(id) {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    try {
      await DataStore.init();
      const admin = await DataStore.getById('admins', id);
      if (!admin) return window.OUH?.showToast('Administrateur introuvable.', 'error');
      document.getElementById('admin-modal-title').textContent = 'Modifier l\'administrateur';
      document.getElementById('admin-modal-id').value = admin.id;
      document.getElementById('admin-modal-name').value = admin.displayName || '';
      document.getElementById('admin-modal-email').value = admin.email || '';
      document.getElementById('admin-modal-role').value = admin.role || 'admin_blog';
      document.getElementById('modal-username-group').style.display = 'none';
      document.getElementById('modal-password-group').style.display = 'none';
      modal.classList.add('open');
      setTimeout(() => document.getElementById('admin-modal-name')?.focus(), 50);
    } catch (err) {
      window.OUH?.showToast(err.message, 'error');
    }
  },

  closeModal() {
    document.getElementById('admin-modal')?.classList.remove('open');
  },

  async handleAdminFormSubmit(e) {
    e.preventDefault();
    const id          = document.getElementById('admin-modal-id').value.trim();
    const displayName = document.getElementById('admin-modal-name').value.trim();
    const username    = document.getElementById('admin-modal-username')?.value.trim() || '';
    const email       = document.getElementById('admin-modal-email').value.trim();
    const role        = document.getElementById('admin-modal-role').value;
    const tempPass    = document.getElementById('admin-modal-password')?.value.trim()
                        || window.Admin?.generateTempPassword()
                        || 'TempPass123!';

    if (!displayName) return window.OUH?.showToast('Le nom complet est requis.', 'error');

    const btn = e.target.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }

    try {
      if (id) {
        await SuperAdmin.updateAdmin(id, { displayName, email, role });
        window.OUH?.showToast('Administrateur mis à jour.', 'success');
      } else {
        if (!username) throw new Error('Le nom d\'utilisateur est requis.');
        await SuperAdmin.createAdmin({ displayName, username, email, role, tempPassword: tempPass });
        window.OUH?.showToast('Administrateur créé avec succès.', 'success');
      }
      SuperAdmin.closeModal();
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      window.OUH?.showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Enregistrer'; }
    }
  }
};

window.SuperAdmin = SuperAdmin;
