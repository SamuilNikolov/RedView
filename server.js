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
// Proxies (must be BEFORE static files and body parsers)
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
// When Express matches /api/curiosity, it strips the prefix from req.url
// We need to restore it so the proxy forwards the full path to the target service
const roverProxyConfig = {
  target: 'http://127.0.0.1:4001',
  changeOrigin: true,
  logLevel: 'debug',
  onProxyRes: (proxyRes, req) => {
    console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY ERROR]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ 
        error: 'Rover media service unavailable on port 4001.',
        details: err.message 
      });
    }
  }
};

app.use('/api/curiosity', (req, res, next) => {
  // Restore full path: /latest -> /api/curiosity/latest
  const originalUrl = req.url;
  req.url = '/api/curiosity' + req.url;
  const proxy = createProxyMiddleware({
    ...roverProxyConfig,
    onProxyReq: (proxyReq) => {
      console.log(`[PROXY] ${req.method} ${originalUrl} -> http://127.0.0.1:4001${req.url}`);
    }
  });
  proxy(req, res, next);
});

app.use('/api/perseverance', (req, res, next) => {
  const originalUrl = req.url;
  req.url = '/api/perseverance' + req.url;
  const proxy = createProxyMiddleware({
    ...roverProxyConfig,
    onProxyReq: (proxyReq) => {
      console.log(`[PROXY] ${req.method} ${originalUrl} -> http://127.0.0.1:4001${req.url}`);
    }
  });
  proxy(req, res, next);
});

// Proxy for image files served by rover media service
// When Express matches /files, it strips the prefix from req.url
// We need to restore it so the proxy forwards the full path to the target service
app.use('/files', (req, res, next) => {
  // Restore full path: /curiosity/... -> /files/curiosity/...
  const originalUrl = req.url;
  req.url = '/files' + req.url;
  const proxy = createProxyMiddleware({
    target: 'http://127.0.0.1:4001',
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq) => {
      console.log(`[FILES PROXY] ${req.method} ${originalUrl} -> http://127.0.0.1:4001${req.url}`);
    },
    onProxyRes: (proxyRes) => {
      console.log(`[FILES PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error('[FILES PROXY ERROR]', err.message);
      console.error('[FILES PROXY ERROR] Request was:', req.method, originalUrl);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Rover media service unavailable on port 4001.' });
      }
    }
  });
  proxy(req, res, next);
});

// ---------------------------
// Static files (AFTER proxies)
// ---------------------------
app.use(express.static('public'));

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
