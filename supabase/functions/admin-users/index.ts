// ============================================================
//  Edge Function : admin-users
//  Crée ou supprime des comptes de connexion (auth.users)
//  ET leur profil (table admins), en une seule opération,
//  appelable depuis le panel par un SUPERADMIN uniquement.
//
//  La clé SERVICE_ROLE reste ici, côté serveur — jamais exposée.
//  Déploiement : voir SETUP-FUNCTIONS.md
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE  = Deno.env.get('SERVICE_ROLE_KEY')!;
    const ANON          = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 1) Identifier l'appelant via son jeton (header Authorization)
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) return json({ error: 'Non authentifié.' }, 401);

    // Client "appelant" pour lire QUI fait la demande
    const caller = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: uErr } = await caller.auth.getUser();
    if (uErr || !user) return json({ error: 'Session invalide.' }, 401);

    // Client "admin" (pleins pouvoirs) pour les opérations sensibles
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 2) Vérifier que l'appelant est bien un SUPERADMIN actif
    const { data: prof } = await admin.from('admins')
      .select('role, active').eq('user_id', user.id).maybeSingle();
    if (!prof || prof.active === false || prof.role !== 'superadmin') {
      return json({ error: 'Réservé au superadmin.' }, 403);
    }

    const body = await req.json();
    const action = body.action;

    // ── CRÉER un administrateur (compte + profil) ──
    if (action === 'create') {
      const { email, password, displayName, username, role, permissions } = body;
      if (!email || !password || !username || !role) {
        return json({ error: 'Champs manquants.' }, 400);
      }

      // a) créer le compte de connexion (confirmé d'emblée)
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true
      });
      if (cErr) return json({ error: cErr.message }, 400);

      // b) créer le profil lié
      const { data: profile, error: pErr } = await admin.from('admins').insert({
        user_id: created.user.id,
        display_name: displayName, username, email, role,
        permissions: permissions ?? null,
        active: true
      }).select().single();

      if (pErr) {
        // rollback : supprimer le compte si le profil échoue
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: pErr.message }, 400);
      }

      await admin.from('logs').insert({
        user_id: user.id, action: 'admins.create',
        details: { username, role }
      });
      return json({ success: true, profile });
    }

    // ── SUPPRIMER un administrateur (profil + compte) ──
    if (action === 'delete') {
      const { adminId } = body;
      if (!adminId) return json({ error: 'adminId manquant.' }, 400);

      const { data: target } = await admin.from('admins')
        .select('user_id, role, username').eq('id', adminId).maybeSingle();
      if (!target) return json({ error: 'Administrateur introuvable.' }, 404);

      // garde-fou : ne pas se supprimer soi-même
      if (target.user_id === user.id) {
        return json({ error: 'Impossible de supprimer votre propre compte.' }, 400);
      }

      await admin.from('admins').delete().eq('id', adminId);
      if (target.user_id) {
        await admin.auth.admin.deleteUser(target.user_id).catch(() => {});
      }
      await admin.from('logs').insert({
        user_id: user.id, action: 'admins.delete',
        details: { username: target.username }
      });
      return json({ success: true });
    }

    // ── RÉINITIALISER le mot de passe d'un admin ──
    if (action === 'reset_password') {
      const { adminId, password } = body;
      if (!adminId || !password) return json({ error: 'Champs manquants.' }, 400);

      const { data: target } = await admin.from('admins')
        .select('user_id, username').eq('id', adminId).maybeSingle();
      if (!target?.user_id) return json({ error: 'Compte non lié.' }, 404);

      const { error: rErr } = await admin.auth.admin.updateUserById(
        target.user_id, { password }
      );
      if (rErr) return json({ error: rErr.message }, 400);

      await admin.from('logs').insert({
        user_id: user.id, action: 'admins.reset_password',
        details: { username: target.username }
      });
      return json({ success: true });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
