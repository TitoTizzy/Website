/* ============================================================
   CLICK-TRACKER.JS — Suivi des clics visiteurs (OUH Haïti)
   ============================================================
   Enregistre chaque interaction significative dans la table
   Supabase `click_events` pour analyse dans le panel superadmin.

   PRÉREQUIS (une seule fois dans Supabase → SQL Editor) :
   ─────────────────────────────────────────────────────────
   CREATE TABLE click_events (
     id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
     page       TEXT,
     element    TEXT,
     label      TEXT,
     href       TEXT,
     section    TEXT,
     pos_x      INTEGER,
     pos_y      INTEGER,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "ct_insert" ON click_events FOR INSERT  WITH CHECK (true);
   CREATE POLICY "ct_select" ON click_events FOR SELECT  USING (auth.role() = 'authenticated');
   CREATE POLICY "ct_delete" ON click_events FOR DELETE  USING (auth.role() = 'authenticated');
   ============================================================ */
'use strict';

(function () {

  /* Ignorer les pages admin */
  if (window.location.pathname.includes('/admin/')) return;

  /* ── Décrire l'élément cliqué en CSS lisible ── */
  function descEl(el) {
    const tag = el.tagName.toLowerCase();
    const cls = Array.from(el.classList)
      .filter(c => !/^(active|open|visible|hidden|loaded|show|fade|slide|animate|is-|js-)/.test(c))
      .slice(0, 2);
    return cls.length ? tag + '.' + cls.join('.') : tag;
  }

  /* ── Texte ou label accessible de l'élément ── */
  function labelOf(el) {
    const raw = el.getAttribute('aria-label')
             || el.getAttribute('title')
             || (el.tagName === 'IMG' ? el.alt : null)
             || el.innerText
             || el.textContent;
    return (raw || '').replace(/\s+/g, ' ').trim().slice(0, 80) || null;
  }

  /* ── Section parente identifiable (id ou balise sémantique) ── */
  function sectionOf(el) {
    let n = el;
    while (n && n !== document.body) {
      if (n.id) return '#' + n.id;
      const t = n.tagName;
      if (['SECTION', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'ASIDE'].includes(t)) {
        const cls = n.className
          ? '.' + n.className.trim().split(/\s+/).filter(c => c && !/^(animate|js-)/.test(c))[0]
          : '';
        return t.toLowerCase() + (cls || '');
      }
      n = n.parentElement;
    }
    return null;
  }

  /* ── Envoi vers Supabase (fire-and-forget, silencieux) ── */
  function send(payload) {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !window.SUPABASE_READY) return;
    fetch(cfg.url + '/rest/v1/click_events', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':         cfg.anonKey,
        'Authorization': 'Bearer ' + cfg.anonKey,
        'Prefer':         'return=minimal'
      },
      body:      JSON.stringify(payload),
      keepalive: true
    }).catch(function () { /* silence — ne jamais perturber l'UX */ });
  }

  /* ── Throttle : au plus 1 envoi toutes les 400 ms ── */
  var _lastSent = 0;

  document.addEventListener('click', function (e) {
    var now = Date.now();
    if (now - _lastSent < 400) return;

    /* Remonter vers le premier ancêtre interactif */
    var target = e.target.closest('a[href], button, [role="button"], [data-action], input[type="submit"], input[type="button"]')
              || e.target;

    if (!target || target === document.body || target === document.documentElement) return;

    /* Ignorer les clics sur conteneurs génériques sans contenu réel */
    var t = target.tagName.toLowerCase();
    if (['div', 'section', 'main', 'header', 'footer', 'span', 'li', 'ul'].includes(t)
        && !target.getAttribute('data-action')
        && !target.getAttribute('role')) {
      if (!(target.textContent || '').trim()) return;
    }

    _lastSent = now;

    var page = window.location.pathname.split('/').pop() || 'index.html';
    var href = null;
    if (target.href) {
      try { href = new URL(target.href).pathname; } catch (ex) { href = target.getAttribute('href'); }
    }

    send({
      page:    page,
      element: descEl(target),
      label:   labelOf(target),
      href:    href,
      section: sectionOf(target),
      pos_x:   Math.round(e.clientX),
      pos_y:   Math.round(e.clientY)
    });

  }, { passive: true });

})();
