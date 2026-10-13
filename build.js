// Monta o site para a Vercel a partir de site.zip (Build Output API v3).
// Assim o repositório só precisa de arquivos soltos, sem pastas.
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const ROOT = __dirname;
const SRC = path.join(ROOT, '.src');
const OUT = path.join(ROOT, '.vercel', 'output');

fs.rmSync(SRC, { recursive: true, force: true });
fs.rmSync(OUT, { recursive: true, force: true });
new AdmZip(path.join(ROOT, 'site.zip')).extractAllTo(SRC, true);

// Arquivos de texto editáveis direto no GitHub (pasta web/, opcional) substituem os do site.zip
const WEB = path.join(ROOT, 'web');
if (fs.existsSync(WEB)) fs.cpSync(WEB, SRC, { recursive: true });

// Alterações de texto da página inicial (web/index.patch.json), aplicadas sobre o index.html do site.zip.
// O patch só é aplicado se o site.zip for exatamente a versão para a qual ele foi gerado.
const PATCH = path.join(SRC, 'index.patch.json');
if (fs.existsSync(PATCH)) {
  const { base, hunks } = JSON.parse(fs.readFileSync(PATCH, 'utf8'));
  const idx = path.join(SRC, 'index.html');
  const html = fs.readFileSync(idx, 'utf8');
  const sha = require('crypto').createHash('sha1').update(html).digest('hex');
  if (sha === base) {
    const lines = html.split('\n');
    for (const [i1, i2, rep] of [...hunks].reverse()) lines.splice(i1, i2 - i1, ...rep);
    fs.writeFileSync(idx, lines.join('\n'));
    console.log('Patch da página inicial aplicado (' + hunks.length + ' trechos)');
  } else {
    console.log('Patch ignorado: o site.zip mudou desde que o patch foi gerado');
  }
}

const cp = (a, b) => fs.cpSync(a, b, { recursive: true });

// Arquivos estáticos
const STATIC = path.join(OUT, 'static');
fs.mkdirSync(STATIC, { recursive: true });
for (const f of ['index.html', 'robots.txt', 'llms.txt', 'admin', 'assets']) if (fs.existsSync(path.join(SRC, f))) cp(path.join(SRC, f), path.join(STATIC, f));

// Desempenho: as imagens embutidas no index.html viram arquivos separados em /img,
// com cache de 1 ano. A página fica ~15x menor e carrega muito mais rápido.
{
  const crypto = require('crypto');
  const EXT = { 'image/webp': 'webp', 'image/png': 'png', 'image/svg+xml': 'svg', 'image/jpeg': 'jpg' };
  const idx = path.join(STATIC, 'index.html');
  fs.mkdirSync(path.join(STATIC, 'img'), { recursive: true });
  const html = fs.readFileSync(idx, 'utf8').replace(/data:(image\/(?:webp|png|jpeg|svg\+xml));base64,([A-Za-z0-9+/=]+)/g, (uri, mime, b64) => {
    const name = crypto.createHash('sha1').update(uri).digest('hex').slice(0, 12) + '.' + EXT[mime];
    const file = path.join(STATIC, 'img', name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    return '/img/' + name;
  });
  fs.writeFileSync(idx, html);
}

// Telefones oficiais (unidades.json) aplicados na página inicial
const UNI = path.join(ROOT, 'unidades.json');
if (fs.existsSync(UNI)) {
  const cfg = JSON.parse(fs.readFileSync(UNI, 'utf8'));
  const idx = path.join(STATIC, 'index.html');
  let html = fs.readFileSync(idx, 'utf8');
  for (const [nome, c] of Object.entries(cfg.unidades || {})) {
    const re = new RegExp("(\\{n:'" + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "',[^\\n]*?)p:'\\d+', pf:'[^']*'");
    html = html.replace(re, (m, a) => a.replace(/ tel:'[^']*',/, '') + "p:'" + c.whatsapp + "', pf:'" + c.telefone + "'");
  }
  fs.writeFileSync(idx, html);
}

// Funções (uma pasta .func por rota da API)
for (const name of fs.readdirSync(path.join(SRC, 'api')).filter(f => f.endsWith('.js'))) {
  const fn = path.join(OUT, 'functions', 'api', name.replace(/\.js$/, '') + '.func');
  fs.mkdirSync(fn, { recursive: true });
  cp(path.join(SRC, 'api'), path.join(fn, 'api'));
  cp(path.join(SRC, 'lib'), path.join(fn, 'lib'));
  cp(path.join(SRC, 'data'), path.join(fn, 'data'));
  cp(path.join(ROOT, 'node_modules'), path.join(fn, 'node_modules'));
  fs.writeFileSync(path.join(fn, 'package.json'), JSON.stringify({ private: true, dependencies: {} }));
  fs.writeFileSync(path.join(fn, '.vc-config.json'), JSON.stringify({
    runtime: 'nodejs22.x', handler: 'api/' + name, launcherType: 'Nodejs', shouldAddHelpers: true,
  }, null, 2));
}

// Rotas
fs.writeFileSync(path.join(OUT, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '^/admin/?$', dest: '/admin/index.html', headers: { 'X-Robots-Tag': 'noindex' } },
    { src: '^/blog/?$', dest: '/api/blog' },
    { src: '^/blog/([^/]+)/?$', dest: '/api/blog?slug=$1' },
    { src: '^/sitemap\\.xml$', dest: '/api/blog?sitemap=1' },
    { src: '^/assets/(.*)$', headers: { 'Cache-Control': 'public, max-age=604800' }, continue: true },
    { src: '^/img/(.*)$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
    { handle: 'filesystem' },
  ],
}, null, 2));

fs.rmSync(SRC, { recursive: true, force: true });
console.log('Site montado em .vercel/output');
