-- ============================================================
--  OUH HAITI — Politiques de sécurité (Row Level Security)
--  À exécuter APRÈS schema.sql, dans le SQL Editor de Supabase.
--
--  Principe :
--   • Le PUBLIC (visiteurs, clé anon) peut LIRE le contenu publié.
--   • Seuls les ADMINS actifs (connectés) peuvent écrire.
--   • La gestion des admins est réservée aux SUPERADMINS.
-- ============================================================

-- Activer RLS sur toutes les tables
alter table public.articles    enable row level security;
alter table public.galeries    enable row level security;
alter table public.medecins    enable row level security;
alter table public.site_images enable row level security;
alter table public.settings    enable row level security;
alter table public.admins      enable row level security;
alter table public.logs        enable row level security;

-- ────────────────────────────────────────────────
--  ARTICLES
-- ────────────────────────────────────────────────
-- Lecture publique : uniquement les articles publiés
drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read" on public.articles
  for select using (status = 'published');

-- Lecture complète (brouillons inclus) pour les admins
drop policy if exists "articles_admin_read" on public.articles;
create policy "articles_admin_read" on public.articles
  for select using (public.is_active_admin());

-- Écriture (insert/update/delete) réservée aux admins
drop policy if exists "articles_admin_write" on public.articles;
create policy "articles_admin_write" on public.articles
  for all using (public.is_active_admin()) with check (public.is_active_admin());

-- ────────────────────────────────────────────────
--  GALERIES
-- ────────────────────────────────────────────────
drop policy if exists "galeries_public_read" on public.galeries;
create policy "galeries_public_read" on public.galeries
  for select using (status = 'published');

drop policy if exists "galeries_admin_read" on public.galeries;
create policy "galeries_admin_read" on public.galeries
  for select using (public.is_active_admin());

drop policy if exists "galeries_admin_write" on public.galeries;
create policy "galeries_admin_write" on public.galeries
  for all using (public.is_active_admin()) with check (public.is_active_admin());

-- ────────────────────────────────────────────────
--  MEDECINS
-- ────────────────────────────────────────────────
drop policy if exists "medecins_public_read" on public.medecins;
create policy "medecins_public_read" on public.medecins
  for select using (active = true);

drop policy if exists "medecins_admin_read" on public.medecins;
create policy "medecins_admin_read" on public.medecins
  for select using (public.is_active_admin());

drop policy if exists "medecins_admin_write" on public.medecins;
create policy "medecins_admin_write" on public.medecins
  for all using (public.is_active_admin()) with check (public.is_active_admin());

-- ────────────────────────────────────────────────
--  SITE_IMAGES  (lecture publique totale, écriture admin)
-- ────────────────────────────────────────────────
drop policy if exists "site_images_public_read" on public.site_images;
create policy "site_images_public_read" on public.site_images
  for select using (true);

drop policy if exists "site_images_admin_write" on public.site_images;
create policy "site_images_admin_write" on public.site_images
  for all using (public.is_active_admin()) with check (public.is_active_admin());

-- ────────────────────────────────────────────────
--  SETTINGS  (lecture publique, écriture admin)
-- ────────────────────────────────────────────────
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings
  for all using (public.is_active_admin()) with check (public.is_active_admin());

-- ────────────────────────────────────────────────
--  ADMINS
--   • Un admin peut lire son propre profil + tous les admins peuvent
--     être lus par un admin actif (pour la liste).
--   • Seuls les superadmins créent/modifient/suppriment des admins.
-- ────────────────────────────────────────────────
drop policy if exists "admins_self_or_admin_read" on public.admins;
create policy "admins_self_or_admin_read" on public.admins
  for select using (user_id = auth.uid() or public.is_active_admin());

drop policy if exists "admins_superadmin_write" on public.admins;
create policy "admins_superadmin_write" on public.admins
  for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Un admin peut mettre à jour son propre last_login
drop policy if exists "admins_self_update" on public.admins;
create policy "admins_self_update" on public.admins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ────────────────────────────────────────────────
--  LOGS  (un admin actif peut écrire ; lecture réservée superadmin)
-- ────────────────────────────────────────────────
drop policy if exists "logs_admin_insert" on public.logs;
create policy "logs_admin_insert" on public.logs
  for insert with check (public.is_active_admin());

drop policy if exists "logs_superadmin_read" on public.logs;
create policy "logs_superadmin_read" on public.logs
  for select using (public.is_superadmin());

drop policy if exists "logs_superadmin_delete" on public.logs;
create policy "logs_superadmin_delete" on public.logs
  for delete using (public.is_superadmin());
