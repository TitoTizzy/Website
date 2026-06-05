-- ============================================================
--  OUH HAITI — Messages du formulaire de contact
--  À exécuter dans Supabase → SQL Editor → Run
-- ============================================================

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  prenom     text not null,
  nom        text not null,
  email      text not null,
  sujet      text,
  message    text not null,
  lu         boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index pour trier par date (plus récent d'abord)
create index if not exists contact_messages_date_idx
  on public.contact_messages (created_at desc);

-- Activer RLS
alter table public.contact_messages enable row level security;

-- N'importe qui peut envoyer un message (formulaire public)
drop policy if exists "contact_insert_public" on public.contact_messages;
create policy "contact_insert_public" on public.contact_messages
  for insert with check (true);

-- Seuls les admins connectés peuvent lire, modifier, supprimer
drop policy if exists "contact_admin_select" on public.contact_messages;
create policy "contact_admin_select" on public.contact_messages
  for select using (public.is_active_admin());

drop policy if exists "contact_admin_update" on public.contact_messages;
create policy "contact_admin_update" on public.contact_messages
  for update using (public.is_active_admin()) with check (public.is_active_admin());

drop policy if exists "contact_admin_delete" on public.contact_messages;
create policy "contact_admin_delete" on public.contact_messages
  for delete using (public.is_active_admin());
