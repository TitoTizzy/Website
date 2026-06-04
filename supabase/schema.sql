-- ============================================================
--  OUH HAITI — Schéma de base de données Supabase (PostgreSQL)
--  À exécuter dans : Supabase Dashboard → SQL Editor → New query
--  Ordre : ce fichier en entier, puis policies.sql, puis seed.sql
-- ============================================================

-- Extension pour générer des UUID
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────
--  TABLE : articles (blog / actualités)
-- ────────────────────────────────────────────────
create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  content      text,
  category     text,                          -- sante | education | humanitaire | evenements
  status       text not null default 'draft', -- draft | published | archived
  image        text,                          -- URL (Storage) ou chemin
  alt          text,
  author       text,
  author_id    uuid,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists articles_status_idx   on public.articles (status);
create index if not exists articles_category_idx on public.articles (category);

-- ────────────────────────────────────────────────
--  TABLE : galeries (photos de la galerie)
-- ────────────────────────────────────────────────
create table if not exists public.galeries (
  id         uuid primary key default gen_random_uuid(),
  src        text not null,        -- URL Storage ou nom de fichier
  alt        text,
  caption    text,
  category   text,                 -- evenements | missions | terrain
  annee      int,
  status     text not null default 'published',  -- published | draft
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists galeries_status_idx on public.galeries (status);

-- ────────────────────────────────────────────────
--  TABLE : medecins
-- ────────────────────────────────────────────────
create table if not exists public.medecins (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  specialite    text,
  initiales     text,
  couleur_debut text default '#4169E1',
  couleur_fin   text default '#60A5FA',
  ordre         int  default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists medecins_ordre_idx on public.medecins (ordre);

-- ────────────────────────────────────────────────
--  TABLE : site_images (remplacement photos/descriptions du vitrine)
--  id = la clé data-img-key (ex: "edu-1", "apropos-bg")
-- ────────────────────────────────────────────────
create table if not exists public.site_images (
  id         text primary key,     -- correspond à data-img-key
  url        text,                 -- URL Storage de l'image téléversée
  alt        text,                 -- description / texte affiché
  file_name  text,
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────
--  TABLE : settings (paramètres du site, ligne unique)
-- ────────────────────────────────────────────────
create table if not exists public.settings (
  id                 text primary key default 'site-settings',
  sitename           text,
  tagline            text,
  description        text,
  email              text,
  phone              text,
  address            text,
  mapurl             text,
  facebook           text,
  instagram          text,
  tiktok             text,
  lang               text default 'fr',
  articles_per_page  int  default 6,
  paypal             text,
  updated_at         timestamptz not null default now()
);

-- ────────────────────────────────────────────────
--  TABLE : admins (profils administrateurs)
--  Lié à auth.users de Supabase via user_id.
--  L'authentification (mot de passe) est gérée par Supabase Auth,
--  PAS ici. Cette table ne stocke que le profil + les permissions.
-- ────────────────────────────────────────────────
create table if not exists public.admins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users(id) on delete cascade,
  display_name  text,
  username      text unique,
  email         text unique,
  role          text not null default 'admin_blog', -- superadmin | admin_general | admin_blog | admin_gallery
  permissions   jsonb,                -- tableau ex: ["blog.*","gallery.*"] ; null = défauts du rôle
  active        boolean not null default true,
  last_login    timestamptz,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────
--  TABLE : logs (journal d'activité)
-- ────────────────────────────────────────────────
create table if not exists public.logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  action     text not null,
  details    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists logs_created_idx on public.logs (created_at desc);
create index if not exists logs_action_idx  on public.logs (action);

-- ────────────────────────────────────────────────
--  FONCTION : savoir si l'utilisateur courant est un admin actif
--  (utilisée par les policies RLS)
-- ────────────────────────────────────────────────
create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid() and active = true
  );
$$;

-- ────────────────────────────────────────────────
--  FONCTION : savoir si l'utilisateur courant est superadmin
-- ────────────────────────────────────────────────
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid() and active = true and role = 'superadmin'
  );
$$;

-- ────────────────────────────────────────────────
--  TRIGGER : mise à jour automatique de updated_at
-- ────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['articles','galeries','medecins','site_images','settings','admins']
  loop
    execute format(
      'drop trigger if exists trg_touch_%1$s on public.%1$s;
       create trigger trg_touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at();', t);
  end loop;
end$$;
