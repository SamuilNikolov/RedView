/**
 * RedView - Super Simple Mars Rover Explorer
 * 
 * REQUIREMENT: Basic server with 3 endpoints
 * TASK: Create minimal server with home page and two rover placeholder pages
 * METHOD: Use Express with simple routing
 */

const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/perseverance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'perseverance.html'));
});

app.get('/curiosity', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'curiosity.html'));
});

// API endpoint for Curiosity rover images
app.get('/api/curiosity/latest', async (req, res) => {
    try {
        const apiKey = process.env.NASA_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'NASA API key not configured' });
        }

        // Get the most recent images using the latest_photos endpoint
        const nasaUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${apiKey}`;
        
        const response = await fetch(nasaUrl);
        if (!response.ok) {
            throw new Error(`NASA API error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching Curiosity images:', error);
        res.status(500).json({ error: 'Failed to fetch images from NASA API' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`RedView server running at http://0.0.0.0:${PORT}`);
    console.log(`NASA API Key: ${process.env.NASA_API_KEY ? 'Configured' : 'Missing'}`);
});
