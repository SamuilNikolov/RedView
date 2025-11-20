const express = require('express');
const {
  scanLatestByRover,
  scanBySolAndCamera,
  scanAllByRover,
  scanBySol,
  getLatestSol
} = require('./scan');

module.exports = function routes(cfg) {
  const r = express.Router();

  // NASA-like: /api/curiosity/latest → { latest_photos: [...] }
  r.get('/:rover/latest', async (req, res) => {
    try {
      const photos = await scanLatestByRover(cfg, req.params.rover);
      res.json({ latest_photos: photos });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // /api/curiosity/photos?camera=Mastcam&sol=2 → { photos: [...] }
  r.get('/:rover/photos', async (req, res) => {
    try {
      const { camera, sol } = req.query;
      const photos = await scanBySolAndCamera(cfg, req.params.rover, camera, sol);
      res.json({ photos });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Optional: list everything for a rover, newest sol first per camera
  // /api/curiosity/all?limit=500&offset=0 → { photos: [...], total: N }
  r.get('/:rover/all', async (req, res) => {
    try {
      const limit  = req.query.limit  ? parseInt(req.query.limit, 10)  : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      const result = await scanAllByRover(cfg, req.params.rover, { limit, offset });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Get all photos for a specific sol across all cameras
  // /api/curiosity/sol/2 → { photos: [...] }
  r.get('/:rover/sol/:sol', async (req, res) => {
    try {
      const photos = await scanBySol(cfg, req.params.rover, req.params.sol);
      res.json({ photos });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Get the latest sol number for a rover
  // /api/curiosity/latest-sol → { latest_sol: 2 }
  r.get('/:rover/latest-sol', async (req, res) => {
    try {
      const latestSol = await getLatestSol(cfg, req.params.rover);
      res.json({ latest_sol: latestSol });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return r;
};
