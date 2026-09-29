// GET    /api/posts            lista (público: só publicados; painel: todos)
// GET    /api/posts?id=...     um artigo (painel)
// POST   /api/posts            cria ou atualiza (painel)
// DELETE /api/posts?id=...     exclui (painel)
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const { load, save, slugify } = require('../lib/store');
const { query, body, send, isAdmin } = require('../lib/http');

const CATEGORIES = ['Legislação', 'Saúde ocupacional', 'Segurança do trabalho', 'eSocial', 'Ergonomia', 'Novidades Metran'];

const clean = html => sanitizeHtml(html || '', {
  allowedTags: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'blockquote', 'img', 'br', 'figure', 'figcaption', 'hr'],
  allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: { b: 'strong', i: 'em', a: sanitizeHtml.simpleTransform('a', { rel: 'noopener', target: '_blank' }) },
});
const text = s => String(s || '').replace(/[<>]/g, '').trim();

function publicFields(p) {
  const { content, ...rest } = p;
  return rest;
}

module.exports = async (req, res) => {
  try {
    const admin = isAdmin(req);
    const q = query(req);

    if (req.method === 'GET') {
      const db = await load();
      if (q.id) {
        if (!admin) return send(res, 401, { error: 'Não autorizado' });
        const p = db.posts.find(x => x.id === q.id);
        return p ? send(res, 200, p) : send(res, 404, { error: 'Artigo não encontrado' });
      }
      let posts = [...db.posts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (!admin) posts = posts.filter(p => p.status === 'published').map(publicFields);
      if (q.limit) posts = posts.slice(0, Number(q.limit));
      return send(res, 200, { posts, categories: CATEGORIES }, admin ? { 'Cache-Control': 'no-store' } : { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' });
    }

    if (!admin) return send(res, 401, { error: 'Faça login no painel para continuar.' });

    if (req.method === 'POST') {
      const b = await body(req);
      if (!text(b.title)) return send(res, 400, { error: 'O artigo precisa de um título.' });
      const db = await load();
      const now = new Date().toISOString();
      let post = b.id ? db.posts.find(p => p.id === b.id) : null;
      if (!post) { post = { id: crypto.randomBytes(8).toString('hex'), createdAt: now }; db.posts.push(post); }

      let slug = slugify(b.slug || b.title);
      let n = 2; const base = slug;
      while (db.posts.some(p => p.slug === slug && p.id !== post.id)) slug = base + '-' + n++;

      Object.assign(post, {
        slug,
        title: text(b.title),
        excerpt: text(b.excerpt).slice(0, 300),
        category: CATEGORIES.includes(b.category) ? b.category : CATEGORIES[0],
        cover: /^(https:\/\/|\/)/.test(b.cover || '') ? b.cover : '',
        coverAlt: text(b.coverAlt),
        author: text(b.author) || 'Equipe Metran',
        content: clean(b.content),
        status: b.status === 'published' ? 'published' : 'draft',
        date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : now.slice(0, 10),
        updatedAt: now,
      });
      await save(db);
      return send(res, 200, post);
    }

    if (req.method === 'DELETE') {
      const db = await load();
      const before = db.posts.length;
      db.posts = db.posts.filter(p => p.id !== q.id);
      if (db.posts.length === before) return send(res, 404, { error: 'Artigo não encontrado' });
      await save(db);
      return send(res, 200, { ok: true });
    }

    send(res, 405, { error: 'Método não permitido' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Erro no servidor: ' + e.message });
  }
};
