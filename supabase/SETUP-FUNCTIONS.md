# Activer la création/suppression d'admins depuis le panel

Cette fonction serveur (« Edge Function ») permet de créer et supprimer
des comptes administrateurs **directement depuis ton panel**, sans repasser
par Supabase. Elle détient la clé secrète côté serveur (jamais exposée au public)
et vérifie que seul un **superadmin** peut l'utiliser.

Il y a **deux façons** de l'installer. La plus simple ne demande aucun logiciel.

---

## Option A — Sans rien installer (copier-coller dans le navigateur) ✅ recommandé

1. Dans Supabase, menu de gauche → **Edge Functions** (icône éclair `⚡` ou « Functions »).
2. Clique **« Create a function »** (ou « Deploy a new function » → « Via Editor »).
3. **Name** : tape exactement **`admin-users`**
4. Une zone de code s'ouvre. **Efface tout** ce qu'il y a dedans.
5. Ouvre le fichier `supabase/functions/admin-users/index.ts` (sur ton ordi),
   copie **tout** son contenu, et colle-le dans l'éditeur Supabase.
6. Clique **« Deploy »**. Attends ~30 secondes. ✅

> Si Supabase ne propose pas d'éditeur dans le navigateur (selon les versions),
> utilise l'Option B ci-dessous.

---

## Option B — Avec la CLI Supabase (si tu préfères le terminal)

```bash
npm install -g supabase
supabase login
supabase link --project-ref uvgoafzapkjrvrzlavtz
supabase functions deploy admin-users
```

---

## Étape commune — Donner la clé secrète à la fonction

La fonction a besoin de la clé `service_role` (la clé « tous pouvoirs »).
On la lui donne de façon **sécurisée**, en variable d'environnement —
elle reste côté serveur, jamais dans le site.

1. Récupère ta clé : **Project Settings → API → `service_role` `secret`** → copie-la.
2. Donne-la à la fonction :

   **Via le dashboard :** Edge Functions → `admin-users` → onglet **Settings** /
   **Secrets** → ajoute :
   - Nom : `SERVICE_ROLE_KEY` — Valeur : *(colle la clé service_role)*

   *(Les variables `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont fournies
   automatiquement par Supabase — pas besoin de les ajouter.)*

   **Ou via la CLI :**
   ```bash
   supabase secrets set SERVICE_ROLE_KEY=colle_ici_ta_cle_service_role
   ```

3. Re-déploie si demandé (le secret est pris en compte au prochain appel).

---

## Tester

1. Va dans ton panel → **Gestion Admins → + Nouvel admin**.
2. Remplis nom, username, email, mot de passe, rôle → **Créer l'administrateur**.
3. Le compte apparaît dans la liste **et** la personne peut se connecter aussitôt.
4. Le bouton 🗑 supprime le compte **et** le profil d'un coup.

> ⚠️ Tant que la fonction n'est pas déployée + le secret ajouté, le bouton
> « Créer l'administrateur » affichera une erreur réseau. C'est normal : c'est
> l'étape qui active cette possibilité.
