const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const API_BASE = 'https://envapi.oizom.com';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy: Login
app.post('/api/login', async (req, res) => {
  try {
    const response = await fetch(API_BASE + '/users/login/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy: Overview
app.get('/api/overview/:userId', async (req, res) => {
  try {
    const url = API_BASE + '/users/' + req.params.userId + '/overview/v2?' + new URLSearchParams(req.query).toString();
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization || '' },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy: Devices data
app.get('/api/devices', async (req, res) => {
  try {
    const url = API_BASE + '/devices/data?' + new URLSearchParams(req.query).toString();
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization || '' },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════╗');
  console.log('  ║         AUTO NEXUS  v3.0              ║');
  console.log('  ║   Envizom Test Automation Console     ║');
  console.log('  ╠═══════════════════════════════════════╣');
  console.log('  ║                                       ║');
  console.log('  ║   Open: http://localhost:' + PORT + '          ║');
  console.log('  ║                                       ║');
  console.log('  ╚═══════════════════════════════════════╝');
  console.log('');
});
