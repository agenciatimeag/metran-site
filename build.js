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

const cp = (a, b) => fs.cpSync(a, b, { recursive: true });

// Arquivos estáticos
const STATIC = path.join(OUT, 'static');
fs.mkdirSync(STATIC, { recursive: true });
for (const f of ['index.html', 'robots.txt', 'admin', 'assets']) cp(path.join(SRC, f), path.join(STATIC, f));

// Funções (uma pasta .func por rota da API)
const RUNTIME_DEPS = ['@vercel/blob', 'sanitize-html'];
for (const name of fs.readdirSync(path.join(SRC, 'api')).filter(f => f.endsWith('.js'))) {
  const fn = path.join(OUT, 'functions', 'api', name.replace(/\.js$/, '') + '.func');
  fs.mkdirSync(fn, { recursive: true });
  cp(path.join(SRC, 'api'), path.join(fn, 'api'));
  cp(path.join(SRC, 'lib'), path.join(fn, 'lib'));
  cp(path.join(SRC, 'data'), path.join(fn, 'data'));
  cp(path.join(ROOT, 'node_modules'), path.join(fn, 'node_modules'));
  fs.writeFileSync(path.join(fn, 'package.json'), JSON.stringify({ private: true, dependencies: {} }));
  fs.writeFileSync(path.join(fn, '.vc-config.json'), JSON.stringify({
    runtime: 'nodejs20.x', handler: 'api/' + name, launcherType: 'Nodejs', shouldAddHelpers: true,
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
    { handle: 'filesystem' },
  ],
}, null, 2));

fs.rmSync(SRC, { recursive: true, force: true });
console.log('Site montado em .vercel/output');
