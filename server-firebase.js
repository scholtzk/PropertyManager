const functions = require('firebase-functions');
const fetch = require('node-fetch');

const HOSTEX_API_KEY = functions.config().hostex.key || 'GO5Kxx5vb6SZPXrW7BAhJsomhx5gpgUxd2Trsmgh9FdxJETKyDy2A9YUNDbluzzm';
const HOSTEX_API_URL = 'https://api.hostex.io/v3/reservations';

exports.bookings = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Hostex-Access-Token');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  try {
    const response = await fetch(HOSTEX_API_URL, {
      headers: {
        'Hostex-Access-Token': HOSTEX_API_KEY,
        'accept': 'application/json'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Hostex' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}); 