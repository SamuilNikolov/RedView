const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// NASA API utility
const { fetchRoverPhotos, fetchLatestPhotos } = require('./utils/nasaApi');

// API Routes
app.get('/api/rover/:rover/photos', async (req, res) => {
    try {
        const { rover } = req.params;
        const { sol, camera, page = 1 } = req.query;
        
        const photos = await fetchRoverPhotos(rover, { sol, camera, page });
        res.json(photos);
    } catch (error) {
        console.error('Error fetching rover photos:', error);
        res.status(500).json({ error: 'Failed to fetch rover photos' });
    }
});

app.get('/api/rover/:rover/latest', async (req, res) => {
    try {
        const { rover } = req.params;
        const { camera } = req.query;
        const photos = await fetchLatestPhotos(rover, { camera });
        res.json(photos);
    } catch (error) {
        console.error('Error fetching latest photos:', error);
        res.status(500).json({ error: 'Failed to fetch latest photos' });
    }
});

// Serve static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/perseverance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'perseverance.html'));
});

app.get('/curiosity', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'curiosity.html'));
});

app.listen(PORT, () => {
    console.log(`RedView server running on port ${PORT}`);
});