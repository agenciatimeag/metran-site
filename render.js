// Monta o HTML das páginas do blog (lista e artigo), no mesmo visual do site.
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtDate = d => { const [y, m, dd] = (d || '').split('-').map(Number); return y ? `${dd} de ${MONTHS[m - 1]} de ${y}` : ''; };
const readTime = html => Math.max(1, Math.round(String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const WA = '5527995178929';

function layout({ title, description, url, image, body, jsonld, origin }) {
  const full = u => (u && u.startsWith('/') ? origin + u : u);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(origin + url)}">
<meta property="og:type" content="${jsonld ? 'article' : 'website'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(origin + url)}">
${image ? `<meta property="og:image" content="${esc(full(image))}">` : ''}
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/mark.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/blog.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<header class="top">
  <nav class="nav wrap">
    <a href="/" class="brand" aria-label="Clínica Metran"><img src="/assets/mark.svg" alt=""><span class="wm"></span></a>
    <div class="links">
      <a href="/#servicos">Serviços</a><a href="/#sobre">A clínica</a><a href="/#central-aso">Central de ASO</a><a href="/#unidades">Unidades</a><a href="/blog" class="on">Blog</a>
    </div>
    <a href="/#contato" class="btn btn-dark">Solicitar orçamento<span class="arr">${ARROW}</span></a>
    <button class="burger" aria-label="Menu" onclick="document.body.classList.toggle('menu-open')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h16M4 16h16"/></svg></button>
  </nav>
  <div class="mmenu"><a href="/#servicos">Serviços</a><a href="/#sobre">A clínica</a><a href="/#central-aso">Central de ASO</a><a href="/#unidades">Unidades</a><a href="/blog">Blog</a><a href="/#contato">Solicitar orçamento</a></div>
</header>
${body}
<footer class="foot">
  <div class="wrap foot-in">
    <a href="/" class="brand" aria-label="Clínica Metran"><img src="/assets/mark.svg" alt=""><span class="wm"></span></a>
    <p>Medicina e segurança do trabalho no Espírito Santo.</p>
    <div class="foot-links"><a href="/#servicos">Serviços</a><a href="/#unidades">Unidades</a><a href="/blog">Blog</a><a href="mailto:contato@metran.med.br">contato@metran.med.br</a><a href="https://www.instagram.com/metran.med/" target="_blank" rel="noopener">Instagram</a></div>
  </div>
  <div class="wrap foot-bot">© ${new Date().getFullYear()} Clínica Metran. Todos os direitos reservados.</div>
</footer>
<a class="wa" href="https://wa.me/${WA}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.8.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg></a>
</body>
</html>`;
}

function card(p, big = false) {
  return `<a class="card${big ? ' card-big' : ''}" href="/blog/${esc(p.slug)}">
    <div class="card-img">${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.coverAlt || p.title)}" loading="lazy">` : ''}</div>
    <div class="card-body">
      <div class="meta"><span class="cat">${esc(p.category)}</span><span>${fmtDate(p.date)}</span></div>
      <h${big ? 2 : 3}>${esc(p.title)}</h${big ? 2 : 3}>
      ${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}
      <span class="more">Ler artigo <span class="arr">${ARROW}</span></span>
    </div>
  </a>`;
}

function cta() {
  return `<section class="cta-band"><div class="wrap cta-in">
    <div><span class="label light">Orçamento sem compromisso</span><h2>Sua empresa em dia com a saúde e a segurança do trabalho.</h2></div>
    <div class="cta-actions">
      <a class="btn btn-teal" href="/#contato">Solicitar orçamento<span class="arr">${ARROW}</span></a>
      <a class="btn-plain light" href="https://wa.me/${WA}?text=${encodeURIComponent('Olá! Vim pelo blog da Metran e gostaria de mais informações.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </div>
  </div></section>`;
}

function listPage({ posts, categories, cat, origin }) {
  const shown = cat ? posts.filter(p => p.category === cat) : posts;
  const [first, ...rest] = shown;
  const chips = ['Todos', ...categories.filter(c => posts.some(p => p.category === c))]
    .map(c => { const on = (c === 'Todos' && !cat) || c === cat; return `<a class="chip${on ? ' on' : ''}" href="/blog${c === 'Todos' ? '' : '?categoria=' + encodeURIComponent(c)}">${esc(c)}</a>`; }).join('');
  const body = `<main>
  <section class="blog-head wrap">
    <span class="label">Blog Metran</span>
    <h1>Saúde e segurança do trabalho, explicadas sem complicação.</h1>
    <p class="lead">Normas, prazos e boas práticas para o RH e os gestores manterem a empresa em dia e a equipe protegida.</p>
    <nav class="chips" aria-label="Categorias">${chips}</nav>
  </section>
  <section class="wrap posts">
    ${first ? card(first, true) : `<p class="empty">Nenhum artigo publicado${cat ? ' nesta categoria' : ''} ainda.</p>`}
    ${rest.length ? `<div class="grid">${rest.map(p => card(p)).join('')}</div>` : ''}
  </section>
  ${cta()}
</main>`;
  return layout({
    title: (cat ? cat + ' · ' : '') + 'Blog da Clínica Metran · Medicina e Segurança do Trabalho',
    description: 'Artigos da Clínica Metran sobre medicina e segurança do trabalho: PCMSO, PGR, exames ocupacionais, eSocial, ergonomia e mais.',
    url: '/blog' + (cat ? '?categoria=' + encodeURIComponent(cat) : ''),
    image: first?.cover, body, origin,
  });
}

function postPage({ post, related, origin }) {
  const url = '/blog/' + post.slug;
  const shareText = encodeURIComponent(post.title + ' ' + origin + url);
  const body = `<main>
  <article>
    <header class="post-head wrap">
      <nav class="crumbs"><a href="/blog">Blog</a><span>/</span><a href="/blog?categoria=${encodeURIComponent(post.category)}">${esc(post.category)}</a></nav>
      <h1>${esc(post.title)}</h1>
      ${post.excerpt ? `<p class="lead">${esc(post.excerpt)}</p>` : ''}
      <div class="post-meta"><span>${esc(post.author || 'Equipe Metran')}</span><span>${fmtDate(post.date)}</span><span>${readTime(post.content)} min de leitura</span></div>
    </header>
    ${post.cover ? `<figure class="post-cover wrap"><img src="${esc(post.cover)}" alt="${esc(post.coverAlt || post.title)}"></figure>` : ''}
    <div class="post-body">
      <div class="prose">${post.content}</div>
      <div class="share">
        <span>Compartilhar</span>
        <a href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(origin + url)}" target="_blank" rel="noopener">LinkedIn</a>
        <button onclick="navigator.clipboard.writeText(location.href);this.textContent='Link copiado'">Copiar link</button>
      </div>
      <aside class="post-cta">
        <div><b>Precisa de ajuda com isso na sua empresa?</b><span>A equipe da Metran cuida de toda a parte técnica e legal para você.</span></div>
        <a class="btn btn-dark" href="/#contato">Falar com a Metran<span class="arr">${ARROW}</span></a>
      </aside>
    </div>
  </article>
  ${related.length ? `<section class="wrap related"><span class="label">Continue lendo</span><div class="grid">${related.map(p => card(p)).join('')}</div></section>` : ''}
  ${cta()}
</main>`;
  return layout({
    title: post.title + ' · Blog Metran', description: post.excerpt || post.title, url, image: post.cover, body, origin,
    jsonld: {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt,
      datePublished: post.date, dateModified: (post.updatedAt || post.date || '').slice(0, 10),
      author: { '@type': 'Organization', name: post.author || 'Clínica Metran' },
      publisher: { '@type': 'Organization', name: 'Clínica Metran', logo: { '@type': 'ImageObject', url: origin + '/assets/mark.svg' } },
      image: post.cover ? (post.cover.startsWith('/') ? origin + post.cover : post.cover) : undefined,
      mainEntityOfPage: origin + url,
    },
  });
}

function notFound(origin) {
  return layout({ title: 'Artigo não encontrado · Blog Metran', description: '', url: '/blog', origin,
    body: `<main><section class="blog-head wrap"><span class="label">Blog Metran</span><h1>Artigo não encontrado.</h1><p class="lead">Ele pode ter sido removido ou o endereço está incorreto.</p><a class="btn btn-dark" href="/blog">Ver todos os artigos<span class="arr">${ARROW}</span></a></section></main>` });
}

module.exports = { listPage, postPage, notFound };
