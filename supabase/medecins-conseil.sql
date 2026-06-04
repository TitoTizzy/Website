-- ============================================================
--  OUH HAITI — Médecins (photo + bio) & Conseil d'administration
--  À exécuter dans Supabase → SQL Editor (un seul bloc, Run).
--  Réexécutable sans danger.
-- ============================================================

-- 1) Médecins : ajouter photo + bio
alter table public.medecins add column if not exists photo_url text;
alter table public.medecins add column if not exists bio       text;

-- 1b) Recolorer les médecins encore en rouge (ancienne palette) → teal/bleu
--     (palette du logo : bleu/or/noir, sans rouge)
update public.medecins
   set couleur_debut = '#0e7490', couleur_fin = '#22d3ee'
 where lower(couleur_debut) in ('#c1121f', '#8b0d16');

-- 2) Table du Conseil d'administration
create table if not exists public.conseil (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  role        text,                 -- ex: Présidente, Trésorière…
  role_tag    text default 'membre',-- pour la couleur du badge
  initiales   text,
  photo_url   text,
  bio         text,
  ordre       int  default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists conseil_ordre_idx on public.conseil (ordre);

alter table public.conseil enable row level security;

drop policy if exists "conseil_public_read" on public.conseil;
create policy "conseil_public_read" on public.conseil
  for select using (active = true);

drop policy if exists "conseil_admin_read" on public.conseil;
create policy "conseil_admin_read" on public.conseil
  for select using (public.is_active_admin());

drop policy if exists "conseil_admin_write" on public.conseil;
create policy "conseil_admin_write" on public.conseil
  for all using (public.is_active_admin()) with check (public.is_active_admin());

drop trigger if exists trg_touch_conseil on public.conseil;
create trigger trg_touch_conseil before update on public.conseil
  for each row execute function public.touch_updated_at();

-- 3) Membres du conseil d'origine (texte exact de la page actuelle)
--    Seed UNIQUEMENT si la table est vide → ré-exécution sans doublons.
do $$
begin
  if not exists (select 1 from public.conseil) then
    insert into public.conseil (nom, role, role_tag, initiales, ordre, active, bio) values
      ('Emmanuel Herly PETIT', 'Président', 'president', 'EH', 1, true,
       'Expert en gestion de projets et diplômé de l''École Nationale d''Administration Publique (ENAP) au Québec ainsi que de HEC Montréal. Il a également travaillé au bloc opératoire de l''Hôpital Jean-Talon en tant qu''expert en technique de positionnement en orthopédie.'),
      ('Yvelise PAUL', 'Vice-Présidente', 'vice', 'YP', 2, true,
       'Infirmière spécialisée en santé mentale, avec une expérience diversifiée. Elle a occupé le poste d''infirmière chef adjointe à l''unité de traitements intensifs et a travaillé comme infirmière soignante dans les unités de réadaptation, d''urgence, de soins intensifs et de psycho-gériatrie.'),
      ('Karl Henri LECONTE', 'Coordonateur Général', 'coordo', 'KL', 3, true,
       'Diplômé en 1992 d''un bachelor en Sciences en Finance de St. John''s University à New York. Détenteur d''une maîtrise en Éducation des Adultes de l''University of Phoenix, renforçant ainsi son expertise en gestion et en formation.'),
      ('Dr. André ARCELIN', 'Secrétaire Général', 'secretaire', 'AA', 4, true,
       'Médecin généraliste retraité Haïtiano-Canadien, diplômé de médecine à Séville en 1964. Pratiquant de médecine familiale à Montréal de 1972 à 2016 et a dirigé le Centre Le Cardinal. Ancien vice-président du Conseil Canadien du multiculturalisme.'),
      ('Marie Lucia JOSEPH', 'Trésorière', 'tresoriere', 'MJ', 5, true,
       'Infirmière bachelière avec une spécialisation en santé mentale, elle a acquis une solide expérience en tant qu''infirmière de liaison et a également occupé le poste d''infirmière chef adjointe dans des unités de pédiatrie, démontrant des compétences en gestion et en soins complexes.'),
      ('Joël Ascher LEVY', 'Coordonateur Éducation', 'education', 'JL', 6, true,
       'Journaliste indépendant, analyste politique, et a signé de nombreux articles sur : la politique, l''économie et les faits de société, en animant trois blogs. Auteur de deux ouvrages sur la République Démocratique du Congo. Intervenant socio-humanitaire.'),
      ('Me Jean Paul CEANT', 'Conseiller Juridique', 'juridique', 'JC', 7, true,
       'Membre fondateur de l''Organisation de développement de Tabarre (ODETA) et président du Centre de Recherche et de Développement Communautaire de Tabarre (CREDECT) depuis 2001.'),
      ('Dr. Rony DESTINE', 'Coordonateur Santé', 'sante', 'RD', 8, true,
       'Médecin généraliste, diplômé de la Faculté de Médecine et de Pharmacie de l''Université d''État d''Haïti en 2000. Il a plus de vingt ans d''expérience dans la gestion des projets de santé.');
  end if;
end $$;
