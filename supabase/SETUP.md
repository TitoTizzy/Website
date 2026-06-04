# Configuration du backend Supabase — OUH Haïti

Ce guide t'explique, étape par étape, comment activer le backend.
Aucune connaissance technique avancée requise — suis les étapes dans l'ordre.

> **Important :** tant que tu n'as pas fait l'étape 5 (coller tes clés),
> le site continue de fonctionner sur le stockage local du navigateur
> (IndexedDB). Rien n'est cassé entre-temps. Le basculement est automatique
> dès que les clés sont en place.

---

## Étape 1 — Créer un projet Supabase (gratuit)

1. Va sur **https://supabase.com** → **Start your project** → connecte-toi (GitHub ou email).
2. **New project** :
   - **Name** : `ouh-haiti`
   - **Database Password** : génère-en un fort et **note-le** (tu n'en auras pas besoin pour le site, mais garde-le).
   - **Region** : choisis la plus proche (ex. *East US* ou *Europe West*).
3. Attends ~2 minutes que le projet se crée.

---

## Étape 2 — Créer les tables (schéma)

1. Dans le menu de gauche : **SQL Editor** → **+ New query**.
2. Ouvre le fichier `supabase/schema.sql` (dans ce dossier), copie **tout** son contenu, colle-le, puis clique **Run**.
3. Tu dois voir « Success. No rows returned ». ✅

---

## Étape 3 — Activer la sécurité (RLS)

1. Toujours dans **SQL Editor** → **+ New query**.
2. Copie tout le contenu de `supabase/policies.sql`, colle, **Run**. ✅

> Ces règles garantissent que le public peut **lire** le contenu publié,
> mais que seuls les administrateurs connectés peuvent **modifier**.

---

## Étape 4 — Charger les données initiales

1. **SQL Editor** → **+ New query**.
2. Copie tout le contenu de `supabase/seed.sql`, colle, **Run**. ✅
   (Crée les 18 médecins, les paramètres du site, un article de démo.)

---

## Étape 5 — Récupérer et coller tes clés

1. Menu de gauche : **Project Settings** (icône engrenage) → **API**.
2. Copie ces deux valeurs :
   - **Project URL** (ex. `https://abcdxyz.supabase.co`)
   - **Project API keys → `anon` `public`** (une longue chaîne)
3. Ouvre le fichier **`assets/js/supabase-config.js`** et remplace :
   ```js
   url:     'https://VOTRE-PROJET.supabase.co',   // ← ta Project URL
   anonKey: 'VOTRE_CLE_ANON_PUBLIC_ICI',          // ← ta clé anon public
   ```

> La clé `anon` est **publique** : c'est normal qu'elle soit dans le code.
> La sécurité vient des règles RLS de l'étape 3.
> ⚠️ Ne copie **jamais** la clé `service_role` dans le site.

---

## Étape 6 — Créer le bucket de stockage (photos)

1. Menu de gauche : **Storage** → **New bucket**.
2. Nom : **`medias`** — coche **Public bucket** → **Create**.
3. Dans **Storage → Policies**, sur le bucket `medias`, ajoute une policy
   d'écriture pour les utilisateurs authentifiés (bouton *New policy* →
   modèle *« Allow authenticated uploads »*), ou exécute ce SQL :
   ```sql
   create policy "medias_public_read" on storage.objects
     for select using ( bucket_id = 'medias' );
   create policy "medias_admin_write" on storage.objects
     for insert to authenticated with check ( bucket_id = 'medias' );
   create policy "medias_admin_update" on storage.objects
     for update to authenticated using ( bucket_id = 'medias' );
   ```

---

## Étape 7 — Créer le premier administrateur (SuperAdmin)

L'authentification est gérée par Supabase (sécurisée). Il faut deux choses :
un compte de connexion **et** son profil admin.

**A. Créer le compte de connexion :**
1. Menu **Authentication** → **Users** → **Add user** → **Create new user**.
2. Entre un **email** et un **mot de passe** (ce seront tes identifiants).
3. Coche **Auto Confirm User** (sinon le compte attend une validation email).
4. Crée — puis **copie l'`User UID`** affiché (un identifiant style `a1b2c3...`).

**B. Lier le profil SuperAdmin** : **SQL Editor** → nouvelle requête, en
remplaçant les valeurs par les tiennes :
```sql
insert into public.admins (user_id, display_name, username, email, role, active)
values (
  'COLLE_ICI_LE_USER_UID',          -- l'UID copié à l'étape A
  'Emmanuel Herly Petit',           -- ton nom affiché
  'superadmin',                     -- ton nom d'utilisateur
  'ton-email@exemple.com',          -- le MÊME email qu'à l'étape A
  'superadmin',
  true
);
```
**Run.** ✅

---

## Étape 8 — Tester

1. Ouvre le site, va sur **/admin/login.html**.
2. Connecte-toi avec ton **email** (ou ton **nom d'utilisateur**) + mot de passe.
3. Tu arrives sur le tableau de bord. Crée un article, remplace une photo :
   tout est maintenant stocké dans Supabase et **partagé entre tous les visiteurs**.

---

## Créer d'autres administrateurs

Pour chaque nouvel admin, répète l'étape 7 (compte Auth + ligne `admins`),
**ou** utilise le panneau **Gestion des admins** du back-office pour créer
le profil, puis crée le compte Auth correspondant avec le même email.
Les accès par module se règlent en cliquant sur le profil de l'admin.

---

## Dépannage

| Problème | Solution |
|---|---|
| « Identifiants incorrects » | Vérifie email/mot de passe ; le compte est-il *confirmé* (étape 7-A) ? |
| Connexion OK mais « aucun profil » | La ligne dans `admins` manque ou l'`user_id` ne correspond pas à l'UID. |
| Les modifs ne s'enregistrent pas | Les policies (étape 3) ne sont pas exécutées, ou le profil admin est `active = false`. |
| Les images ne s'uploadent pas | Le bucket `medias` n'existe pas ou n'est pas public (étape 6). |
| Le site utilise encore le stockage local | Les clés de l'étape 5 ne sont pas collées correctement. Ouvre la console (F12) : tu dois voir « [Supabase] Couche de données active ✔ ». |
