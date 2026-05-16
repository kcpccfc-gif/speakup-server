const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({ status: 'ok', hasApiKey: hasKey });
});

app.post('/chat', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: { message: 'API key not configured' } });
  const body = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  const apiReq = https.request(options, apiRes => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch(e) { res.status(500).json({ error: { message: 'Parse error: ' + data } }); }
    });
  });
  apiReq.on('error', e => res.status(500).json({ error: { message: e.message } }));
  apiReq.write(body);
  apiReq.end();
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
