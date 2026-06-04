-- ============================================================
--  OUH HAITI — Galerie par ALBUMS
--  À exécuter dans Supabase → SQL Editor (un seul bloc, Run).
--  Réexécutable sans danger.
-- ============================================================

-- 1) Table des albums
create table if not exists public.albums (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  description text,
  cover_url   text,                 -- photo de couverture (URL Storage)
  annee       int,
  ordre       int  default 0,
  status      text not null default 'published',  -- published | draft
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists albums_ordre_idx on public.albums (ordre);

-- 2) Rattacher les photos à un album
alter table public.galeries add column if not exists album_id uuid references public.albums(id) on delete cascade;
create index if not exists galeries_album_idx on public.galeries (album_id);

-- 3) Vider la galerie existante (on repart de zéro avec les albums)
delete from public.galeries;

-- 4) Sécurité (RLS) pour les albums : lecture publique des publiés, écriture admin
alter table public.albums enable row level security;

drop policy if exists "albums_public_read" on public.albums;
create policy "albums_public_read" on public.albums
  for select using (status = 'published');

drop policy if exists "albums_admin_read" on public.albums;
create policy "albums_admin_read" on public.albums
  for select using (public.is_active_admin());

drop policy if exists "albums_admin_write" on public.albums;
create policy "albums_admin_write" on public.albums
  for all using (public.is_active_admin()) with check (public.is_active_admin());

-- 5) Trigger updated_at
drop trigger if exists trg_touch_albums on public.albums;
create trigger trg_touch_albums before update on public.albums
  for each row execute function public.touch_updated_at();
