// POST /api/upload  {data: 'data:image/webp;base64,...'}  → {url}
// O painel já reduz a imagem no navegador (máx. 1600 px, WebP) antes de enviar.
const { body, send, isAdmin } = require('../lib/http');
const { saveImage } = require('../lib/store');

const TYPES = ['image/webp', 'image/jpeg', 'image/png'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });
  if (!isAdmin(req)) return send(res, 401, { error: 'Não autorizado' });
  try {
    const { data } = await body(req);
    const m = /^data:([\w/+.-]+);base64,(.+)$/.exec(data || '');
    if (!m || !TYPES.includes(m[1])) return send(res, 400, { error: 'Envie uma imagem JPG, PNG ou WebP.' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 3.5 * 1024 * 1024) return send(res, 400, { error: 'Imagem muito grande (máx. 3,5 MB).' });
    send(res, 200, { url: await saveImage(buf, m[1]) });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Falha no envio: ' + e.message });
  }
};
