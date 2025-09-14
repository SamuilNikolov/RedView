const express = require('express');
const app = express();
const port = 3000;

// Sample endpoint 1: Home page with placeholder
app.get('/', (req, res) => {
    res.send('<h1>Welcome to RedView - Mars Exploration App</h1><p>Placeholder content: Explore Mars data here.</p>');
});

// Sample endpoint 2: About page with placeholder
app.get('/about', (req, res) => {
    res.send('<h1>About RedView</h1><p>Placeholder: This app visualizes NASA Mars data using Cesium and APIs.</p>');
});

// Sample endpoint 3: Data page with placeholder JSON
app.get('/data', (req, res) => {
    res.json({ message: 'Placeholder Mars data', rover: 'Curiosity', location: 'Gale Crater' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});