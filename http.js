// Utilitários HTTP que funcionam tanto na Vercel quanto no servidor local de testes.
const crypto = require('crypto');

function query(req) {
  if (req.query) return req.query;
  const u = new URL(req.url, 'http://x');
  return Object.fromEntries(u.searchParams);
}

async function body(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function send(res, status, data, headers = {}) {
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (typeof data === 'object' && !Buffer.isBuffer(data)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } else {
    res.end(data);
  }
}

// ---------- Autenticação do painel ----------
// A senha fica na variável de ambiente ADMIN_PASSWORD (configurada na Vercel).
// O login gera um cookie assinado, válido por 7 dias.
const COOKIE = 'metran_admin';
const secret = () => (process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'dev-only-secret');

function sign(exp) {
  return exp + '.' + crypto.createHmac('sha256', secret()).update(String(exp)).digest('hex');
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}

function isAdmin(req) {
  const t = cookies(req)[COOKIE];
  if (!t) return false;
  const [exp] = t.split('.');
  if (Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return t.length === good.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(good));
}

function loginCookie(req) {
  const exp = Date.now() + 7 * 24 * 3600 * 1000;
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(sign(exp))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 3600}${secure}`;
}

function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = crypto.createHash('sha256').update(String(pw)).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = { query, body, send, isAdmin, loginCookie, checkPassword, COOKIE };
