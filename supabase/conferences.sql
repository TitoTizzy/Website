-- =============================================================
-- Conférences — Bibliothèque Edgard Petit
-- À exécuter dans Supabase SQL Editor
-- =============================================================

-- Table
CREATE TABLE IF NOT EXISTS public.conferences (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  ordre           smallint DEFAULT 0,
  titre           text    NOT NULL,
  date_conference date    NOT NULL,
  conferencier    text,
  description     text,
  flyer_url       text,    -- URL du flyer (Supabase Storage ou chemin assets/)
  clip_url        text,    -- URL de l'extrait vidéo 5 min (optionnel)
  drive_url       text,    -- Lien Google Drive vers la conférence complète
  created_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conferences_select_public" ON public.conferences;
DROP POLICY IF EXISTS "conferences_admin_all"     ON public.conferences;

CREATE POLICY "conferences_select_public"
  ON public.conferences FOR SELECT USING (true);

CREATE POLICY "conferences_admin_all"
  ON public.conferences FOR ALL
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- Données initiales
INSERT INTO public.conferences (ordre, titre, date_conference, conferencier, flyer_url, drive_url) VALUES
(1, 'Séminaire sur le Patrimoine Personnel',
    '2024-09-29', 'Maître Jean Paul Céant',
    null,
    'https://drive.google.com/drive/folders/1oKHKIS3pTt3apbRnWiVmWn2xJNrT2u6e?hl=fr'),

(2, 'Conférence sur Succession et Partage',
    '2024-10-20', 'Maître Jean Paul Céant',
    null,
    'https://drive.google.com/drive/folders/1oKHKIS3pTt3apbRnWiVmWn2xJNrT2u6e?hl=fr'),

(3, 'Séminaire sur le Partage de Bien',
    '2025-01-26', 'Maître Jean Paul Céant',
    null,
    'https://drive.google.com/drive/folders/1oKHKIS3pTt3apbRnWiVmWn2xJNrT2u6e?hl=fr'),

(4, 'L''Acquisition et l''incorporation de biens dans votre patrimoine',
    '2025-08-31', 'Maître Jean Paul Céant',
    'assets/images/conferences/flyer-acquisition-aout-2025.jpg',
    'https://drive.google.com/drive/folders/1oKHKIS3pTt3apbRnWiVmWn2xJNrT2u6e?hl=fr'),

(5, 'Les acteurs de la diplomatie internationale',
    '2025-10-18', 'Ambassadeur Bocchit Edmond',
    null,
    'https://drive.google.com/drive/folders/1oKHKIS3pTt3apbRnWiVmWn2xJNrT2u6e?hl=fr'),

(6, 'Conférence sur l''orthopédie et la traumatologie',
    '2025-11-02', 'Dr Fernandez, Spécialiste Orthopédiste',
    null,
    'https://drive.google.com/drive/folders/1oKHKIS3pTt3apbRnWiVmWn2xJNrT2u6e?hl=fr')

ON CONFLICT DO NOTHING;
