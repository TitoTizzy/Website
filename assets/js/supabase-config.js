/* ============================================================
   SUPABASE-CONFIG.JS — Identifiants de connexion Supabase
   ------------------------------------------------------------
   ⚠️  REMPLACEZ les deux valeurs ci-dessous par celles de VOTRE
       projet Supabase :
       Dashboard → Project Settings → API
         • Project URL          →  SUPABASE_URL
         • Project API keys → anon public  →  SUPABASE_ANON_KEY

   La clé « anon » est PUBLIQUE par conception : elle peut figurer
   dans le code du site. La sécurité est assurée par les politiques
   RLS (voir supabase/policies.sql), pas par le secret de la clé.
   NE METTEZ JAMAIS la clé « service_role » ici.
   ============================================================ */
window.SUPABASE_CONFIG = {
  url:     'https://uvgoafzapkjrvrzlavtz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Z29hZnphcGtqcnZyemxhdnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNzU3NDAsImV4cCI6MjA5NTg1MTc0MH0.iBTysah2dINgQ5TC_IGTgUG200veaHWkH_N0_sYU_MI',

  /* Nom du bucket de stockage pour les images téléversées
     (créé à l'étape Storage du guide SETUP.md). */
  bucket:  'medias'
};

/* Détecte si la config a bien été renseignée. */
window.SUPABASE_READY = !/VOTRE-PROJET|VOTRE_CLE/.test(
  window.SUPABASE_CONFIG.url + window.SUPABASE_CONFIG.anonKey
);
