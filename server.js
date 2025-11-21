/**
 * RedView - Super Simple Mars Rover Explorer
 * Main Express server
 */

const express = require('express');
const path = require('path');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// If using Rails API on port 3000, Express must run on a different port
const USE_RAILS_API = process.env.USE_RAILS_API === 'true';
const PORT = process.env.PORT || (USE_RAILS_API ? 3002 : 3000);

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
// Supports two backends:
// 1. Local database service (port 4001) - original format: /api/{rover}/photos
// 2. Rails Mars Photo API (port 3000) - format: /api/v1/rovers/{Rover}/photos
// Set USE_RAILS_API=true to use the Rails API, otherwise uses local database service
// Set RAILS_API_PORT to specify Rails API port (default: 3000)
const ROVER_API_PORT = USE_RAILS_API ? (process.env.RAILS_API_PORT || 3000) : 4001;
const ROVER_API_TARGET = `http://127.0.0.1:${ROVER_API_PORT}`;

const roverProxyConfig = {
  target: ROVER_API_TARGET,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyRes: (proxyRes, req) => {
    console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY ERROR]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ 
        error: `Rover API service unavailable on port ${ROVER_API_PORT}.`,
        details: err.message 
      });
    }
  }
};

// Helper to capitalize rover name for Rails API
function capitalizeRover(rover) {
  return rover.charAt(0).toUpperCase() + rover.slice(1).toLowerCase();
}

// Helper to transform URL path for Rails API
function transformPathForRailsAPI(rover, path) {
  // Extract path and query string separately
  const [pathPart, queryString] = path.split('?');
  const query = queryString ? `?${queryString}` : '';
  
  // Map /latest to /latest_photos for Rails API
  if (pathPart === '/latest') {
    return `/latest_photos${query}`;
  }
  
  // Map /sol/:sol to /photos?sol=:sol for Rails API
  const solMatch = pathPart.match(/^\/sol\/(\d+)$/);
  if (solMatch) {
    // Build query string: start with sol, then append any existing query params
    const existingParams = query ? query.substring(1) : ''; // Remove leading ?
    const newQuery = existingParams 
      ? `?sol=${solMatch[1]}&${existingParams}` 
      : `?sol=${solMatch[1]}`;
    return `/photos${newQuery}`;
  }
  
  // Map /latest-sol - Rails API doesn't have this, but we'll let it pass through
  // (it will likely return 404, which is fine)
  if (pathPart === '/latest-sol') {
    return `/latest-sol${query}`;
  }
  
  // Other paths pass through as-is with query string preserved
  return path;
}

app.use('/api/curiosity', (req, res, next) => {
  const originalUrl = req.url;
  let targetUrl;
  
  if (USE_RAILS_API) {
    // Rails API format: /api/v1/rovers/Curiosity/photos?camera=X&sol=Y
    const transformedPath = transformPathForRailsAPI('Curiosity', req.url);
    targetUrl = `/api/v1/rovers/Curiosity${transformedPath}`;
  } else {
    // Local database format: /api/curiosity/photos?camera=X&sol=Y
    targetUrl = `/api/curiosity${req.url}`;
  }
  
  req.url = targetUrl;
  const proxy = createProxyMiddleware({
    ...roverProxyConfig,
    onProxyReq: (proxyReq) => {
      console.log(`[PROXY] ${req.method} ${originalUrl} -> ${ROVER_API_TARGET}${req.url}`);
    }
  });
  proxy(req, res, next);
});

app.use('/api/perseverance', (req, res, next) => {
  const originalUrl = req.url;
  let targetUrl;
  
  if (USE_RAILS_API) {
    // Rails API format: /api/v1/rovers/Perseverance/photos?camera=X&sol=Y
    const transformedPath = transformPathForRailsAPI('Perseverance', req.url);
    targetUrl = `/api/v1/rovers/Perseverance${transformedPath}`;
  } else {
    // Local database format: /api/perseverance/photos?camera=X&sol=Y
    targetUrl = `/api/perseverance${req.url}`;
  }
  
  req.url = targetUrl;
  const proxy = createProxyMiddleware({
    ...roverProxyConfig,
    onProxyReq: (proxyReq) => {
      console.log(`[PROXY] ${req.method} ${originalUrl} -> ${ROVER_API_TARGET}${req.url}`);
    }
  });
  proxy(req, res, next);
});

// Proxy for image files served by local rover media service
// NOTE: When using Rails API (USE_RAILS_API=true), images come from external NASA URLs
// and don't need this proxy. This proxy is only for the local database service.
if (!USE_RAILS_API) {
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
}

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
// API Configuration Endpoint
// ---------------------------
// Expose API mode and camera mappings to frontend
app.get('/api/config', (req, res) => {
  res.json({
    useRailsAPI: USE_RAILS_API,
    cameraMappings: {
      perseverance: {
        // Local DB name -> Rails API abbreviation
        // Note: Some local DB cameras don't have direct mappings
        'Engineering cam': 'ENG', // May not exist in Rails API
        'Entry Descent and Landing (EDL) cam': 'EDL_RUCAM', // Default to Rover Up-Look
        'Mastcam': 'MCZ_LEFT', // Default to Left Mastcam
        'MEDA Skycam': 'SKYCAM',
        'Navcam': 'NAVCAM_LEFT', // Default to Left Navcam
        'PIXL Microcam': 'PIXL' // May not exist in Rails API
      },
      curiosity: {
        // Local DB name -> Rails API abbreviation  
        'Hazard Avoidance (Haz) cam': 'FHAZ', // Default to Front Hazcam
        'Mars Descent Imager (MARDI) Cam': 'MARDI',
        'Mars Hand Lens Imager (MAHLI) cam': 'MAHLI',
        'Mastcam': 'MAST', // Curiosity uses MAST
        'Navcam': 'NAVCAM',
        'Remote Micro Imager (RMI) cam': 'CHEMCAM' // RMI is part of CHEMCAM
      }
    },
    railsAPICameras: {
      perseverance: [
        { value: 'EDL_RUCAM', label: 'Rover Up-Look Camera (EDL_RUCAM)' },
        { value: 'EDL_RDCAM', label: 'Rover Down-Look Camera (EDL_RDCAM)' },
        { value: 'EDL_DDCAM', label: 'Descent Stage Down-Look Camera (EDL_DDCAM)' },
        { value: 'EDL_PUCAM1', label: 'Parachute Up-Look Camera A (EDL_PUCAM1)' },
        { value: 'EDL_PUCAM2', label: 'Parachute Up-Look Camera B (EDL_PUCAM2)' },
        { value: 'NAVCAM_LEFT', label: 'Navigation Camera - Left (NAVCAM_LEFT)' },
        { value: 'NAVCAM_RIGHT', label: 'Navigation Camera - Right (NAVCAM_RIGHT)' },
        { value: 'MCZ_RIGHT', label: 'Mast Camera Zoom - Right (MCZ_RIGHT)' },
        { value: 'MCZ_LEFT', label: 'Mast Camera Zoom - Left (MCZ_LEFT)' },
        { value: 'FRONT_HAZCAM_LEFT_A', label: 'Front Hazard Avoidance Camera - Left (FRONT_HAZCAM_LEFT_A)' },
        { value: 'FRONT_HAZCAM_RIGHT_A', label: 'Front Hazard Avoidance Camera - Right (FRONT_HAZCAM_RIGHT_A)' },
        { value: 'REAR_HAZCAM_LEFT', label: 'Rear Hazard Avoidance Camera - Left (REAR_HAZCAM_LEFT)' },
        { value: 'REAR_HAZCAM_RIGHT', label: 'Rear Hazard Avoidance Camera - Right (REAR_HAZCAM_RIGHT)' },
        { value: 'SKYCAM', label: 'MEDA Skycam (SKYCAM)' },
        { value: 'SHERLOC_WATSON', label: 'SHERLOC WATSON Camera (SHERLOC_WATSON)' },
        { value: 'SUPERCAM_RMI', label: 'SuperCam Remote Micro Imager (SUPERCAM_RMI)' },
        { value: 'LCAM', label: 'Lander Vision System Camera (LCAM)' }
      ],
      curiosity: [
        { value: 'FHAZ', label: 'Front Hazard Avoidance Camera (FHAZ)' },
        { value: 'RHAZ', label: 'Rear Hazard Avoidance Camera (RHAZ)' },
        { value: 'MAST', label: 'Mast Camera (MAST)' },
        { value: 'CHEMCAM', label: 'Chemistry and Camera Complex (CHEMCAM)' },
        { value: 'MAHLI', label: 'Mars Hand Lens Imager (MAHLI)' },
        { value: 'MARDI', label: 'Mars Descent Imager (MARDI)' },
        { value: 'NAVCAM', label: 'Navigation Camera (NAVCAM)' },
        { value: 'PANCAM', label: 'Panoramic Camera (PANCAM)' },
        { value: 'MINITES', label: 'Miniature Thermal Emission Spectrometer (MINITES)' }
      ]
    },
    localDBCameras: {
      perseverance: [
        { value: 'Engineering cam', label: 'Engineering cam' },
        { value: 'Entry Descent and Landing (EDL) cam', label: 'Entry Descent and Landing (EDL) cam' },
        { value: 'Mastcam', label: 'Mastcam' },
        { value: 'MEDA Skycam', label: 'MEDA Skycam' },
        { value: 'Navcam', label: 'Navcam' },
        { value: 'PIXL Microcam', label: 'PIXL Microcam' }
      ],
      curiosity: [
        { value: 'Hazard Avoidance (Haz) cam', label: 'Hazard Avoidance (Haz) cam' },
        { value: 'Mars Descent Imager (MARDI) Cam', label: 'Mars Descent Imager (MARDI) Cam' },
        { value: 'Mars Hand Lens Imager (MAHLI) cam', label: 'Mars Hand Lens Imager (MAHLI) cam' },
        { value: 'Mastcam', label: 'Mastcam' },
        { value: 'Navcam', label: 'Navcam' },
        { value: 'Remote Micro Imager (RMI) cam', label: 'Remote Micro Imager (RMI) cam' }
      ]
    }
  });
});

// ---------------------------
// Start
// ---------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RedView server running at http://0.0.0.0:${PORT}`);
  if (USE_RAILS_API) {
    console.log(`Using Rails Mars Photo API at http://127.0.0.1:${ROVER_API_PORT}`);
  } else {
    console.log(`Proxying rover APIs to http://127.0.0.1:${ROVER_API_PORT}`);
  }
  console.log(`Proxying depth uploads to http://127.0.0.1:5001/upload`);
});
