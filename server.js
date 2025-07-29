const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const HOSTEX_API_KEY = process.env.HOSTEX_API_KEY || 'GO5Kxx5vb6SZPXrW7BAhJsomhx5gpgUxd2Trsmgh9FdxJETKyDy2A9YUNDbluzzm';
const HOSTEX_API_URL = 'https://api.hostex.io/v3/reservations';

app.use(cors());
app.use(express.static('.'));

app.get('/api/bookings', async (req, res) => {
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

app.get('/', (req, res) => {
  res.send('Hostex Proxy is running. Use /api/bookings');
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 