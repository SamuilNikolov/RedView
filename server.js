/**
 * RedView - Super Simple Mars Rover Explorer
 * 
 * REQUIREMENT: Basic server with 3 endpoints
 * TASK: Create minimal server with home page and two rover placeholder pages
 * METHOD: Use Express with simple routing
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.static('public'));

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

app.listen(PORT, () => {
    console.log(`RedView server running on port ${PORT}`);
});