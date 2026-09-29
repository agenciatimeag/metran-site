// Armazenamento dos artigos do blog.
// Em produção (Vercel) usa o Vercel Blob: cada gravação cria uma nova versão do
// arquivo posts.json (URL única, sem cache antigo) e apaga as versões anteriores.
// Em desenvolvimento local (sem BLOB_READ_WRITE_TOKEN) usa a pasta data/.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const LOCAL_DB = path.join(ROOT, 'data', 'posts.json');
const SEED_DB = path.join(ROOT, 'data', 'seed.json');
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const DB_PREFIX = 'blog/db/';

function readSeed() {
  try { return JSON.parse(fs.readFileSync(SEED_DB, 'utf8')); } catch { return { posts: [] }; }
}

async function latestBlobDb() {
  const { list } = require('@vercel/blob');
  const { blobs } = await list({ prefix: DB_PREFIX, limit: 1000 });
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  return blobs;
}

async function load() {
  if (!USE_BLOB) {
    if (fs.existsSync(LOCAL_DB)) return JSON.parse(fs.readFileSync(LOCAL_DB, 'utf8'));
    return readSeed();
  }
  const blobs = await latestBlobDb();
  if (!blobs.length) return readSeed(); // primeiro uso: começa com os artigos iniciais
  const r = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!r.ok) throw new Error('Falha ao ler os artigos (' + r.status + ')');
  return r.json();
}

async function save(db) {
  db.updatedAt = new Date().toISOString();
  const json = JSON.stringify(db, null, 2);
  if (!USE_BLOB) {
    fs.mkdirSync(path.dirname(LOCAL_DB), { recursive: true });
    fs.writeFileSync(LOCAL_DB, json);
    return;
  }
  const { put, del } = require('@vercel/blob');
  const old = await latestBlobDb();
  await put(DB_PREFIX + 'posts.json', json, {
    access: 'public', addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 60,
  });
  // mantém as 5 versões mais recentes como histórico de segurança
  const toDelete = old.slice(4).map(b => b.url);
  if (toDelete.length) await del(toDelete);
}

async function saveImage(buffer, contentType) {
  const ext = ({ 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' })[contentType] || 'bin';
  const name = crypto.randomBytes(6).toString('hex') + '.' + ext;
  if (!USE_BLOB) {
    const dir = path.join(ROOT, 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), buffer);
    return '/uploads/' + name;
  }
  const { put } = require('@vercel/blob');
  const b = await put('blog/img/' + name, buffer, { access: 'public', contentType, addRandomSuffix: true });
  return b.url;
}

function slugify(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'artigo';
}

module.exports = { load, save, saveImage, slugify, USE_BLOB };
