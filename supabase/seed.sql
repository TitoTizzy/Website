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

-- ── Article réel (texte exact de ouhhaiti.org, publié le 08 décembre 2024) ──
insert into public.articles (title, slug, excerpt, category, status, author, published_at, content) values
  ('L''OUH au service des déshérités',
   'louh-au-service-des-desherites',
   'De l''art d''aider Haïti — Quand l''humanitaire est une véritable vocation sacerdotale. L''Organisation de l''Union haïtienne (OUH) est légalement et juridiquement un organisme à but non lucratif dûment enregistré selon les lois haïtiennes et québécoises.',
   'humanitaire',
   'published',
   'Joël Asher Lévy-Cohen',
   '2024-12-08T00:00:00Z',
   '<h2>De l''art d''aider Haïti</h2>
<h3>Quand l''humanitaire est une véritable vocation sacerdotale</h3>
<blockquote>« Il ne faut jamais attendre une minute pour commencer à changer le monde. » — Anne Frank</blockquote>
<p>L''Organisation de l''Union haïtienne (OUH) est légalement et juridiquement un organisme à but non lucratif dûment enregistré selon les lois haïtiennes et québécoises. Celle-ci est, en réalité, fondée en 1995 par M. Emmanuel Herly Petit, un Haïtien de la diaspora installé au Québec et au Canada depuis trois décennies. Évoluant dans le secteur hospitalier de son pays d''accueil que sont le Québec et le Canada, il a eu l''idée de répondre à certains besoins essentiels qui se posent crûment dans son pays d''origine, Haïti, en termes d''intégration des populations défavorisées ou déshéritées, lesquelles peinent à accéder aux soins de santé primaires.</p>
<p>Il y a lieu de mentionner que cette idée d''Emmanuel Herly Petit de participer activement et, surtout, positivement à l''insertion de ses Concitoyens les plus démunis date réellement de l''époque où il œuvrait d''antan en Haïti en tant que moniteur au sein de la Croix-Rouge.</p>
<p>Dans la pratique courante, l''OUH est à vrai dire un organisme d''utilité publique. Elle se veut un « partenaire » stratégique de l''État haïtien dans l''accomplissement de ses missions de souveraineté. À cet effet, l''OUH a conclu, au mois d''octobre 1997, un accord de partenariat avec l''État haïtien en vue de la redynamisation de divers centres de santé jugés dysfonctionnels. Dans le cadre de ladite convention, l''OUH a obtenu du Ministère de la Santé publique la gestion du Centre de santé de Carrefour-Poy.</p>
<p>Depuis mars 2003, l''OUH bénéficie de la qualité spécifique d''ONG reconnue administrativement par les autorités haïtiennes. Elle a su mobiliser l''expertise des professionnels de la santé du Canada et du Québec pour les mettre au service du Centre de santé de Carrefour-Poy et autres institutions médicales d''Haïti.</p>
<p>Parmi les professionnels de la santé canadiens qui ont participé au projet « Haïti Santé et Développement » piloté par l''OUH : le Dr Selim Rashed (pédiatre, hôpital Montréal pour enfants), la Dre Yvette Bony (hématologue, hôpital Maisonneuve-Rosemont), le Dr Serge Raphaël (psychiatre, hôpitaux Jean-Talon et Marie-Enfant), le Dr Carlos Vanisschott (gynécologue) et le Dr André Arcelin (généraliste).</p>
<p>En Haïti, l''OUH est partenaire de Médecins sans Frontières (MSF), le CECI, OXFAM-Québec, l''hôpital de Cité Soleil, l''hôpital Général de Port-au-Prince et l''hôpital Chancerel.</p>
<p>Entre autres activités, l''OUH distribue l''eau potable dans la région de Carrefour-Poy et participe aux campagnes de sensibilisation sur la tuberculose, le VIH/Sida, la malaria et le tétanos.</p>
<p>Lors du séisme du <strong>12 janvier 2010</strong>, l''OUH a distribué des fils de suture, des médicaments et des pansements, et a procédé à des chirurgies mineures.</p>')
on conflict (slug) do nothing;

-- ============================================================
--  IMPORTANT — Création du premier SUPERADMIN
--  Ne peut PAS se faire ici (le mot de passe est géré par Supabase Auth).
--  Voir SETUP.md, étape « Créer le premier administrateur ».
-- ============================================================
