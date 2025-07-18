const functions = require('firebase-functions');
const fetch = require('node-fetch');

const HOSTEX_API_KEY = functions.config().hostex.key || 'GO5Kxx5vb6SZPXrW7BAhJsomhx5gpgUxd2Trsmgh9FdxJETKyDy2A9YUNDbluzzm';
const HOSTEX_API_URL = 'https://api.hostex.io/v3/reservations';

// Helper to build query string
function buildQuery(params) {
  return (
    '?' +
    Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
  );
}

exports.bookings = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Hostex-Access-Token');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  try {
    // Log the API key being used (for debugging only, remove after testing)
    console.log('Using Hostex API Key:', HOSTEX_API_KEY);
    // Calculate date range: from (current date - 30 days) to (current date + 150 days)
    const now = new Date();
    const startDateObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDateObj = new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000);
    const startDate = startDateObj.toISOString().slice(0, 10);
    const endDate = endDateObj.toISOString().slice(0, 10);
    console.log('Querying bookings from', startDate, 'to', endDate);
    let allBookings = [];
    let offset = 0;
    const limit = 100;
    let keepGoing = true;
    while (keepGoing) {
      const query = buildQuery({
        start_check_in_date: startDate,
        end_check_in_date: endDate,
        limit,
        offset
      });
      const apiUrl = HOSTEX_API_URL + query;
      console.log('Fetching Hostex API URL:', apiUrl); // Log the exact API URL
      const response = await fetch(apiUrl, {
        headers: {
          'Hostex-Access-Token': HOSTEX_API_KEY,
          'accept': 'application/json'
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch from Hostex' });
      }
      const data = await response.json();
      // Log the full API response for debugging
      console.log('Hostex API raw response:', data);
      const reservations = (data.data && data.data.reservations) ? data.data.reservations : [];
      console.log('Reservations returned this page:', reservations.length); // Log number of bookings per page
      allBookings = allBookings.concat(reservations);
      if (reservations.length < limit) {
        keepGoing = false;
      } else {
        offset += limit;
      }
    }
    res.json({ reservations: allBookings });
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}); 