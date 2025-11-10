/**
 * RedView - Super Simple Mars Rover Explorer
 * Main Express server
 */

const express = require('express');
const path = require('path');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// Static files
// ---------------------------
app.use(express.static('public'));

// ---------------------------
// Proxies (must be BEFORE body parsers)
// ---------------------------

// Flask depth service proxy
const flaskProxy = createProxyMiddleware({
  target: 'http://127.0.0.1:5001',
  changeOrigin: true,
  pathRewrite: { '^/api/ai-depth': '/upload' },
  onError: (err, req, res) => {
    console.error('Proxy error (Flask):', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Depth service unavailable. Make sure the Flask service is running on port 5001.'
      });
    }
  },
  onProxyReq: (proxyReq, req) => {
    console.log(`Proxying ${req.method} ${req.url} -> Flask /upload`);
  },
  logLevel: 'info'
});
app.post('/api/ai-depth', flaskProxy);
app.options('/api/ai-depth', flaskProxy);

// Rover media service proxy (Curiosity + Perseverance)
app.use(
  ['/api/curiosity', '/api/perseverance'],
  createProxyMiddleware({
    target: 'http://127.0.0.1:4001', // rover-media-service
    changeOrigin: true,
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Proxy error (Rover media):', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Rover media service unavailable on port 4001.' });
      }
    }
  })
);

// ---------------------------
// Body parsers (AFTER proxies)
// ---------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// Routes (pages)
// ---------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/perseverance', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'perseverance.html'));
});

app.get('/curiosity', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'curiosity.html'));
});

app.get('/ai-depth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ai-depth.html'));
});

// ---------------------------
// Start
// ---------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RedView server running at http://0.0.0.0:${PORT}`);
  console.log(`Proxying rover APIs to http://127.0.0.1:4001`);
  console.log(`Proxying depth uploads to http://127.0.0.1:5001/upload`);
});
