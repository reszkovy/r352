// CMS Auth — logowanie do panelu TeamBudget CMS.
// Token sesji = HMAC z hasla (nieodwracalny).
// Zmiana CMS_PASSWORD w env unieważnia wszystkie sesje.

import crypto from 'node:crypto';

const SALT = 'tb-cms-session-v1';

export function sessionToken() {
  return crypto.createHmac('sha256', process.env.CMS_PASSWORD).update(SALT).digest('hex');
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const correct = process.env.CMS_PASSWORD;

  if (!correct) return res.status(500).json({ error: 'CMS_PASSWORD not configured' });
  if (password === correct) {
    return res.status(200).json({ ok: true, token: Buffer.from(`cms:${sessionToken()}`).toString('base64') });
  }
  return res.status(401).json({ error: 'Invalid password' });
}
