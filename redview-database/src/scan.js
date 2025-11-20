const fs = require('fs').promises;
const path = require('path');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

const norm = (p) => p.replace(/\\/g, '/');

function toURL(absFile, cfg) {
  const rel = norm(path.relative(cfg.mediaRoot, absFile));
  const urlPath = '/files/' + rel.split('/').map(encodeURIComponent).join('/');
  // Return relative URL so it goes through the main server's proxy
  // The main server (port 3000) proxies /files to this service (port 4001)
  return urlPath;
}

async function listDirs(abs) {
  const items = await fs.readdir(abs, { withFileTypes: true });
  return items.filter((d) => d.isDirectory()).map((d) => d.name);
}

async function listImages(abs) {
  const items = await fs.readdir(abs, { withFileTypes: true });
  return items
    .filter(
      (f) => f.isFile() && IMAGE_EXTS.has(path.extname(f.name).toLowerCase())
    )
    .map((f) => f.name);
}

async function latestSolDir(cameraAbs) {
  const sols = await listDirs(cameraAbs);
  const numeric = sols
    .map((name) => ({ name, val: parseInt(name, 10) }))
    .filter((x) => Number.isFinite(x.val))
    .sort((a, b) => b.val - a.val);

  for (const { name, val } of numeric) {
    const dir = path.join(cameraAbs, name);
    const files = await listImages(dir);
    if (files.length) return { name, sol: val, dir, files };
  }
  return null;
}

async function fileEarthDate(absFile) {
  try {
    const st = await fs.stat(absFile);
    // Prefer creation time if available; fall back to mtime
    const d = (st.birthtimeMs && st.birthtimeMs > 0) ? st.birthtime : st.mtime;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
}

function cameraMeta(cameraFolderName) {
  // Use folder name for both fields so your UI always has a title
  return { name: cameraFolderName, full_name: cameraFolderName };
}

async function photoOf(absFile, rover, cameraFolder, sol, cfg, id) {
  const earth_date = await fileEarthDate(absFile);
  return {
    id,
    sol,
    camera: cameraMeta(cameraFolder),
    rover: { name: rover },
    img_src: toURL(absFile, cfg),   // browser-usable URL served by this service
    local_path: norm(absFile),      // absolute OS path
    earth_date                      // YYYY-MM-DD or null
  };
}

async function ensureExists(absPath) {
  try {
    await fs.access(absPath);
  } catch {
    throw new Error(`Path not found: ${absPath}`);
  }
}

module.exports.scanLatestByRover = async function scanLatestByRover(cfg, rover) {
  const roverAbs = path.join(cfg.mediaRoot, rover);
  await ensureExists(roverAbs);

  // First, find the latest sol across all cameras
  const cameras = await listDirs(roverAbs);
  let overallLatestSol = 0;

  for (const cam of cameras) {
    const camAbs = path.join(roverAbs, cam);
    const latest = await latestSolDir(camAbs);
    if (latest && latest.sol > overallLatestSol) {
      overallLatestSol = latest.sol;
    }
  }

  // If no sol found, return empty array
  if (overallLatestSol === 0) {
    return [];
  }

  // Now get all images from that latest sol across all cameras
  const photos = [];
  let id = 1;

  for (const cam of cameras) {
    const dir = path.join(roverAbs, cam, String(overallLatestSol));
    try {
      await ensureExists(dir);
      const files = await listImages(dir);
      for (const f of files) {
        photos.push(await photoOf(path.join(dir, f), rover, cam, overallLatestSol, cfg, id++));
      }
    } catch {
      // Camera doesn't have this sol, skip it
      continue;
    }
  }

  return photos;
};

module.exports.scanBySolAndCamera = async function scanBySolAndCamera(
  cfg,
  rover,
  camera,
  sol
) {
  if (!camera) throw new Error('camera query param is required');
  if (sol == null) throw new Error('sol query param is required');

  const dir = path.join(cfg.mediaRoot, rover, camera, String(sol));
  await ensureExists(dir);
  const files = await listImages(dir);

  let id = 1;
  const promises = files.map((f) =>
    photoOf(path.join(dir, f), rover, camera, parseInt(sol, 10), cfg, id++)
  );
  return Promise.all(promises);
};

module.exports.scanAllByRover = async function scanAllByRover(cfg, rover, opts = {}) {
  const roverAbs = path.join(cfg.mediaRoot, rover);
  await ensureExists(roverAbs);

  const cameras = await listDirs(roverAbs);
  const photos = [];
  let id = 1;

  for (const cam of cameras) {
    const camAbs = path.join(roverAbs, cam);
    const sols = (await listDirs(camAbs))
      .map(name => ({ name, val: parseInt(name, 10) }))
      .filter(x => Number.isFinite(x.val))
      .sort((a, b) => b.val - a.val);

    for (const { name, val } of sols) {
      const dir = path.join(camAbs, name);
      const files = await listImages(dir);
      for (const f of files) {
        photos.push(await photoOf(path.join(dir, f), rover, cam, val, cfg, id++));
      }
    }
  }

  const total = photos.length;
  const { limit, offset = 0 } = opts;
  if (Number.isFinite(limit)) {
    return { photos: photos.slice(offset, offset + limit), total };
  }
  return { photos, total };
};

// Get all photos for a specific sol across all cameras
module.exports.scanBySol = async function scanBySol(cfg, rover, sol) {
  if (sol == null) throw new Error('sol param is required');
  
  const roverAbs = path.join(cfg.mediaRoot, rover);
  await ensureExists(roverAbs);

  const cameras = await listDirs(roverAbs);
  const photos = [];
  let id = 1;

  for (const cam of cameras) {
    const dir = path.join(roverAbs, cam, String(sol));
    try {
      await ensureExists(dir);
      const files = await listImages(dir);
      for (const f of files) {
        photos.push(await photoOf(path.join(dir, f), rover, cam, parseInt(sol, 10), cfg, id++));
      }
    } catch {
      // Camera doesn't have this sol, skip it
      continue;
    }
  }

  return photos;
};

// Get the latest sol number available for a rover
module.exports.getLatestSol = async function getLatestSol(cfg, rover) {
  const roverAbs = path.join(cfg.mediaRoot, rover);
  await ensureExists(roverAbs);

  const cameras = await listDirs(roverAbs);
  let latestSol = 0;

  for (const cam of cameras) {
    const camAbs = path.join(roverAbs, cam);
    const latest = await latestSolDir(camAbs);
    if (latest && latest.sol > latestSol) {
      latestSol = latest.sol;
    }
  }

  return latestSol > 0 ? latestSol : null;
};