// Servidor local de testes: imita as rotas da Vercel (vercel.json). Não vai para produção.
const http = require('http'), fs = require('fs'), path = require('path');
const T = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.xml':'application/xml','.txt':'text/plain' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); let p = u.pathname;
  let m;
  if (p === '/blog') { req.url = '/api/blog' + u.search; p = '/api/blog'; }
  else if ((m = p.match(/^\/blog\/([^/]+)$/))) { req.url = '/api/blog?slug=' + m[1]; p = '/api/blog'; }
  else if (p === '/sitemap.xml') { req.url = '/api/blog?sitemap=1'; p = '/api/blog'; }
  else if (p === '/admin') p = '/admin/index.html';
  if (p.startsWith('/api/')) {
    delete require.cache[require.resolve('.' + p + '.js')];
    return require('.' + p + '.js')(req, res);
  }
  if (p === '/') p = '/index.html';
  const f = path.join(__dirname, p);
  if (!f.startsWith(__dirname) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', T[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(3000, () => console.log('http://localhost:3000'));
