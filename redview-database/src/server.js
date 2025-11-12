const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const routes = require('./routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// MEDIA_ROOT defaults to ../media (repo-local) if not set
const MEDIA_ROOT =
  process.env.MEDIA_ROOT && process.env.MEDIA_ROOT.trim().length
    ? process.env.MEDIA_ROOT
    : path.resolve(__dirname, '../media');

const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(morgan('dev'));

// Serve raw files so <img src="..."> works
app.use('/files', express.static(MEDIA_ROOT, { fallthrough: false }));

// API
app.use('/api', routes({ mediaRoot: MEDIA_ROOT, publicBaseURL: PUBLIC_BASE_URL }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Rover media service on ${PUBLIC_BASE_URL}`);
  console.log(`Serving media from: ${MEDIA_ROOT}`);
});

