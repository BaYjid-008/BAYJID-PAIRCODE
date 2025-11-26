/**
 * BaYjid PairCode System
 * Author: BaYjid
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const STORE = new Map();
const CODE_TTL_MS = (process.env.CODE_TTL_MINUTES ? parseInt(process.env.CODE_TTL_MINUTES) : 5) * 60 * 1000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

setInterval(() => {
  const now = Date.now();
  for (const [code, meta] of STORE) {
    if (meta.expiresAt <= now) STORE.delete(code);
  }
}, 60 * 1000);

app.post('/api/generate', async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'number is required' });

    const cleaned = String(number).replace(/\s+/g, '');
    const code = nanoid(8);

    const now = Date.now();
    const expiresAt = now + CODE_TTL_MS;

    STORE.set(code, { number: cleaned, createdAt: now, expiresAt, paired: false });

    const pairUrl = `${process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`}/pair/${code}`;
    const qrDataUrl = await QRCode.toDataURL(pairUrl);

    return res.json({ code, expiresAt, qrDataUrl, pairUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/status/:code', (req, res) => {
  const code = req.params.code;
  const meta = STORE.get(code);
  if (!meta) return res.status(404).json({ ok: false, error: 'invalid_or_expired' });
  return res.json({ ok: true, code, paired: meta.paired, expiresAt: meta.expiresAt, number: meta.number });
});

app.post('/api/mark-paired', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  const meta = STORE.get(code);
  if (!meta) return res.status(404).json({ error: 'invalid_or_expired' });
  meta.paired = true;
  STORE.set(code, meta);
  return res.json({ ok: true });
});

app.get('/pair/:code', (req, res) => {
  const meta = STORE.get(req.params.code);
  if (!meta) return res.status(404).send('Invalid or expired pair code.');

  return res.send(`
    <h2>BaYjid PairCode</h2>
    <p>Code: ${req.params.code}</p>
    <p>Number: ${meta.number}</p>
    <p>Paired: ${meta.paired}</p>
  `);
});

app.listen(PORT, () => {
  console.log(`BaYjid PairCode Server running on port ${PORT}`);
});
