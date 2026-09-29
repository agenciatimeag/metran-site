// POST /api/login  {password}  → cookie de sessão
// GET  /api/login               → {admin: true|false}
// DELETE /api/login             → sair
const { body, send, isAdmin, loginCookie, checkPassword, COOKIE } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method === 'GET') return send(res, 200, { admin: isAdmin(req), configured: !!process.env.ADMIN_PASSWORD });
  if (req.method === 'DELETE') return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` });
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido' });
  if (!process.env.ADMIN_PASSWORD) return send(res, 500, { error: 'A senha do painel ainda não foi configurada (ADMIN_PASSWORD).' });
  const { password } = await body(req);
  await new Promise(r => setTimeout(r, 400)); // dificulta tentativas em sequência
  if (!checkPassword(password)) return send(res, 401, { error: 'Senha incorreta.' });
  send(res, 200, { ok: true }, { 'Set-Cookie': loginCookie(req) });
};
