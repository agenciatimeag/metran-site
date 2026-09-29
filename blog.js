// /blog            → lista de artigos
// /blog/:slug      → artigo
// /sitemap.xml     → mapa do site para o Google
const { load } = require('../lib/store');
const { query, send, isAdmin } = require('../lib/http');
const { listPage, postPage, notFound } = require('../lib/render');

const origin = req => (process.env.SITE_URL || `${(req.headers['x-forwarded-proto'] || 'http').split(',')[0]}://${req.headers['x-forwarded-host'] || req.headers.host}`).replace(/\/$/, '');
const CATS = ['Legislação', 'Saúde ocupacional', 'Segurança do trabalho', 'eSocial', 'Ergonomia', 'Novidades Metran'];

module.exports = async (req, res) => {
  try {
    const q = query(req);
    const db = await load();
    const o = origin(req);
    const admin = isAdmin(req);
    const published = db.posts.filter(p => p.status === 'published').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const html = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' };

    if (q.sitemap) {
      const urls = ['/', '/blog', ...published.map(p => '/blog/' + p.slug)];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${o}${u}</loc></url>`).join('\n')}\n</urlset>`;
      return send(res, 200, xml, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 's-maxage=3600' });
    }

    if (q.slug) {
      // quem está logado no painel também consegue ver rascunhos (pré-visualização)
      const post = (admin ? db.posts : published).find(p => p.slug === q.slug);
      if (!post) return send(res, 404, notFound(o), { 'Content-Type': 'text/html; charset=utf-8' });
      const related = [...published.filter(p => p.id !== post.id && p.category === post.category), ...published.filter(p => p.id !== post.id && p.category !== post.category)].slice(0, 3);
      return send(res, 200, postPage({ post, related, origin: o }), admin ? { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } : html);
    }

    const cat = CATS.includes(q.categoria) ? q.categoria : '';
    send(res, 200, listPage({ posts: published, categories: CATS, cat, origin: o }), html);
  } catch (e) {
    console.error(e);
    send(res, 500, 'Erro ao carregar o blog.', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
};
