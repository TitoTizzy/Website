-- ============================================================
--  OUH HAITI — Données initiales (seed)
--  À exécuter APRÈS schema.sql et policies.sql.
--  Réexécutable sans danger (on conflict do nothing).
-- ============================================================

-- ── Paramètres du site ──
insert into public.settings (id, sitename, tagline, email, phone, address, lang, articles_per_page, paypal)
values ('site-settings',
        'Organisation de l''Union Haïtienne',
        'ONG depuis 1995',
        'ouhhaiti@gmail.com',
        '509-3792-4663',
        '390, Av. John Brown (Bourdon), Port-au-Prince, HT 6114',
        'fr', 6, 'ouhhaiti@gmail.com')
on conflict (id) do nothing;

-- ── Médecins (18 collaborateurs, ordre d'origine du site) ──
insert into public.medecins (nom, specialite, initiales, couleur_debut, couleur_fin, ordre, active) values
  ('Dr NGUYEN',     'Chirurgien Orthopédiste',   'NG', '#4169E1', '#60A5FA', 1,  true),
  ('Dr BILODEAU',   'Anesthésiste',              'BI', '#16a34a', '#4ade80', 2,  true),
  ('Dr IRANI',      'Chirurgien Généraliste',    'IR', '#00007A', '#0A0FA8', 3,  true),
  ('Dr DEMONTIGNY', 'Cardio Chirurgien',         'DM', '#C1121F', '#8b0d16', 4,  true),
  ('Dr BENOIT',     'Professeur Orthopédiste',   'BE', '#4169E1', '#60A5FA', 5,  true),
  ('Dr DENIS',      'Chirurgien Bariatrique',    'DN', '#6366f1', '#818cf8', 6,  true),
  ('Dr DUBE',       'Anesthésiste',              'DU', '#16a34a', '#4ade80', 7,  true),
  ('Dr LAFLAMME',   'Professeur Orthopédiste',   'LF', '#4169E1', '#60A5FA', 8,  true),
  ('Dr ALEXIS',     'Orthopédiste',              'AL', '#4169E1', '#60A5FA', 9,  true),
  ('Dr DANGEMANS',  'Anesthésiste',              'DA', '#16a34a', '#4ade80', 10, true),
  ('Dr FERNANDEZ',  'Orthopédiste et Chercheur', 'FE', '#0f766e', '#2dd4bf', 11, true),
  ('Dr LEDUC',      'Orthopédiste',              'LE', '#4169E1', '#60A5FA', 12, true),
  ('Dr RANGER',     'Orthopédiste Professeur',   'RA', '#4169E1', '#60A5FA', 13, true),
  ('Dr RICHARD',    'Chirurgien Plasticien',     'RI', '#db2777', '#f472b6', 14, true),
  ('Dr SHAIGETZ',   'Chirurgien Urologue',       'SH', '#7c3aed', '#a78bfa', 15, true),
  ('Dr SIDANI',     'Oto-Rhino-Laryngologue',    'SI', '#d97706', '#fbbf24', 16, true),
  ('Dr THERRIER',   'Orthopédiste',              'TH', '#4169E1', '#60A5FA', 17, true),
  ('Dr THOME',      'Orthopédiste',              'TO', '#4169E1', '#60A5FA', 18, true)
on conflict do nothing;

-- ── Articles de démonstration (optionnel — supprime ce bloc si non voulu) ──
insert into public.articles (title, slug, excerpt, category, status, author, published_at, content) values
  ('Mission médicale à Carrefour-Poy : plus de 500 patients consultés',
   'mission-medicale-carrefour-poy-500-patients',
   'L''équipe médicale de l''OUH a mené une mission intensive de trois jours dans la région de Carrefour-Poy.',
   'sante', 'published', 'Équipe OUH', now(),
   '<p>Du 12 au 14 mars 2025, l''équipe médicale de l''OUH a déployé ses forces dans la région de Carrefour-Poy.</p>')
on conflict (slug) do nothing;

-- ============================================================
--  IMPORTANT — Création du premier SUPERADMIN
--  Ne peut PAS se faire ici (le mot de passe est géré par Supabase Auth).
--  Voir SETUP.md, étape « Créer le premier administrateur ».
-- ============================================================
