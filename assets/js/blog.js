/* ============================================================
   BLOG.JS — Module blog OUH Haiti
   ============================================================ */

'use strict';

const Blog = {

  /* ── Chargement des articles ── */
  async loadArticles() {
    await DataStore.init();
    return DataStore.getAll('articles');
  },

  /* ── Sauvegarde un article (créer ou modifier) ── */
  async saveArticle(articleData) {
    const isNew = !articleData.id;
    const data = {
      ...articleData,
      slug: articleData.slug || window.OUH?.generateSlug(articleData.title) || articleData.title.toLowerCase().replace(/\s+/g, '-'),
      updatedAt: new Date().toISOString()
    };

    if (articleData.status === 'published' && !articleData.publishedAt) {
      data.publishedAt = new Date().toISOString();
    }

    const user = window.Auth?.getCurrentUser();
    if (user && !data.author) {
      data.author = user.displayName || user.username;
      data.authorId = user.id;
    }

    let result;
    if (isNew) {
      result = await DataStore.create('articles', data);
      await DataStore.logAction(user?.id, 'blog.create', { title: data.title });
    } else {
      result = await DataStore.update('articles', data.id, data);
      await DataStore.logAction(user?.id, 'blog.update', { id: data.id, title: data.title });
    }

    return result;
  },

  /* ── Supprime un article ── */
  async deleteArticle(id) {
    await DataStore.delete('articles', id);
    const user = window.Auth?.getCurrentUser();
    await DataStore.logAction(user?.id, 'blog.delete', { id });
    return true;
  },

  /* ── Publie un article ── */
  async publishArticle(id) {
    return DataStore.update('articles', id, {
      status: 'published',
      publishedAt: new Date().toISOString()
    });
  },

  /* ── Archive un article ── */
  async archiveArticle(id) {
    return DataStore.update('articles', id, { status: 'archived' });
  },

  /* ── Slugify ── */
  generateSlug(title) {
    return window.OUH?.generateSlug(title) || title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  },

  /* ── Filtre les articles ── */
  filterArticles(articles, filters = {}) {
    return articles.filter(a => {
      if (filters.status && a.status !== filters.status) return false;
      if (filters.category && a.category !== filters.category) return false;
      return true;
    });
  },

  /* ── Recherche dans les articles ── */
  searchArticles(articles, query) {
    if (!query?.trim()) return articles;
    const q = query.toLowerCase();
    return articles.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.excerpt?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q)
    );
  },

  /* ── Pagination ── */
  paginateArticles(articles, page = 1, perPage = 6) {
    const total = articles.length;
    const pages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    return {
      items: articles.slice(start, start + perPage),
      total,
      pages,
      page,
      perPage
    };
  },

  /* ── Render card article (page publique) ── */
  renderArticleCard(article) {
    const date = window.OUH?.formatDate(article.publishedAt || article.createdAt) || '';
    const excerpt = window.OUH?.truncateText(article.excerpt || '', 180) || '';
    const categoryLabels = {
      'sante': 'Santé',
      'education': 'Éducation',
      'humanitaire': 'Humanitaire',
      'evenements': 'Événements',
      'communique': 'Communiqué'
    };

    return `
      <article class="article-card">
        <div class="article-card-img">
          ${article.coverImage
            ? `<img src="${article.coverImage}" alt="${article.title}" loading="lazy" />`
            : `<div class="article-card-img-placeholder">📰</div>`
          }
        </div>
        <div class="article-card-body">
          <div class="article-card-category">
            <span class="badge badge-blue">${categoryLabels[article.category] || article.category || 'Article'}</span>
          </div>
          <h3 class="article-card-title">
            <a href="actualites.html?id=${article.id}">${article.title}</a>
          </h3>
          <p class="article-card-excerpt">${excerpt}</p>
          <div class="article-card-footer">
            <div class="article-card-meta">
              <div class="article-card-author">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${article.author || 'OUH'}
              </div>
              <span>•</span>
              <span>${date}</span>
            </div>
            <a href="actualites.html?id=${article.id}" class="btn btn-ghost btn-sm">Lire →</a>
          </div>
        </div>
      </article>
    `;
  },

  /* ── Render page article individuelle ── */
  renderArticlePage(article) {
    const date = window.OUH?.formatDate(article.publishedAt || article.createdAt) || '';
    return `
      <article style="max-width:780px;margin:0 auto;">
        ${article.coverImage ? `<img src="${article.coverImage}" alt="${article.title}" style="width:100%;border-radius:16px;margin-bottom:2rem;" loading="lazy" />` : ''}
        <div class="article-card-category" style="margin-bottom:1rem;">
          <span class="badge badge-blue">${article.category || 'Article'}</span>
        </div>
        <h1 style="font-family:var(--font-display);font-size:var(--text-4xl);font-weight:700;line-height:1.2;margin-bottom:1rem;">${article.title}</h1>
        <div style="display:flex;align-items:center;gap:1rem;color:var(--color-muted);font-family:var(--font-ui);font-size:0.875rem;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid var(--color-border);">
          <span>Par ${article.author || 'OUH'}</span>
          <span>•</span>
          <span>${date}</span>
        </div>
        <div class="article-content" style="font-family:var(--font-body);font-size:1.0625rem;line-height:1.8;color:var(--color-dark);">
          ${article.content || ''}
        </div>
        ${article.tags?.length ? `
          <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--color-border);display:flex;flex-wrap:wrap;gap:0.5rem;">
            ${article.tags.map(t => `<span class="badge badge-gray">${t}</span>`).join('')}
          </div>
        ` : ''}
      </article>
    `;
  },

  /* ── Render tableau admin ── */
  renderArticlesList(articles, onEdit, onDelete) {
    if (!articles.length) {
      return `<div class="empty-state"><div class="empty-state-icon">📝</div><h3 class="empty-state-title">Aucun article</h3><p class="empty-state-text">Créez votre premier article avec le bouton ci-dessus.</p></div>`;
    }

    return `
      <div class="admin-table-wrap">
        <table class="admin-table" aria-label="Liste des articles">
          <thead>
            <tr>
              <th>Image</th>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Auteur</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${articles.map(a => `
              <tr>
                <td>
                  ${a.coverImage
                    ? `<img src="${a.coverImage}" alt="" style="width:48px;height:36px;object-fit:cover;border-radius:6px;" />`
                    : `<div style="width:48px;height:36px;background:var(--gradient-card);border-radius:6px;border:1px solid var(--color-border);"></div>`
                  }
                </td>
                <td style="font-weight:600;max-width:200px;">${window.OUH?.truncateText(a.title, 60) || a.title}</td>
                <td><span class="badge badge-blue">${a.category || '—'}</span></td>
                <td>${a.author || '—'}</td>
                <td><span class="status-badge ${a.status}">${a.status}</span></td>
                <td style="font-size:0.8125rem;white-space:nowrap;">${window.OUH?.formatDate(a.updatedAt || a.createdAt) || ''}</td>
                <td>
                  <div class="admin-table-actions">
                    <button class="admin-action-btn" title="Modifier" onclick="${onEdit ? `(${onEdit})('${a.id}')` : `window.location.href='modifier-article.html?id=${a.id}'`}">✏️</button>
                    <a href="../actualites.html?id=${a.id}" class="admin-action-btn" title="Prévisualiser" target="_blank">👁️</a>
                    <button class="admin-action-btn danger" title="Supprimer" onclick="Blog.confirmDelete('${a.id}')">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  /* ── Confirm delete ── */
  confirmDelete(id) {
    window.OUH?.confirmModal(
      'Supprimer l\'article',
      'Cette action est irréversible. Confirmer la suppression ?',
      async () => {
        await Blog.deleteArticle(id);
        window.OUH?.showToast('Article supprimé.', 'success');
        window.location.reload();
      }
    );
  }
};

window.Blog = Blog;
