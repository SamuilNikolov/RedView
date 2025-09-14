const axios = require('axios');

const NASA_API_KEY = process.env.NASA_API_KEY;
const NASA_BASE_URL = 'https://api.nasa.gov/mars-photos/api/v1/rovers';

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchRoverPhotos(roverName, options = {}) {
    try {
        const { sol, camera, page = 1 } = options;
        
        let url = `${NASA_BASE_URL}/${roverName}/photos?api_key=${NASA_API_KEY}&page=${page}`;
        
        if (sol) {
            url += `&sol=${sol}`;
        } else {
            // If no sol specified, use latest sol
            const manifestResponse = await axios.get(`${NASA_BASE_URL}/${roverName}?api_key=${NASA_API_KEY}`);
            const latestSol = manifestResponse.data.rover.max_sol;
            url += `&sol=${latestSol}`;
        }
        
        if (camera) {
            url += `&camera=${camera}`;
        }
        
        await delay(100); // Rate limiting
        const response = await axios.get(url);
        
        return {
            photos: response.data.photos,
            total: response.data.photos.length,
            page: parseInt(page)
        };
    } catch (error) {
        console.error(`Error fetching photos for ${roverName}:`, error.message);
        throw error;
    }
}

async function fetchLatestPhotos(roverName, options = {}) {
    try {
        let url = `${NASA_BASE_URL}/${roverName}/latest_photos?api_key=${NASA_API_KEY}`;
        
        await delay(100);
        const response = await axios.get(url);
        
        let photos = response.data.latest_photos;
        
        // Filter by camera if specified
        if (options.camera) {
            photos = photos.filter(photo => photo.camera.name === options.camera);
        }
        
        return {
            photos: photos.slice(0, 20), // Limit to 20 most recent
            total: photos.length
        };
    } catch (error) {
        console.error(`Error fetching latest photos for ${roverName}:`, error.message);
        throw error;
    }
}

async function getRoverManifest(roverName) {
    try {
        const url = `${NASA_BASE_URL}/${roverName}?api_key=${NASA_API_KEY}`;
        
        await delay(100);
        const response = await axios.get(url);
        
        return response.data.rover;
    } catch (error) {
        console.error(`Error fetching manifest for ${roverName}:`, error.message);
        throw error;
    }
}

module.exports = {
    fetchRoverPhotos,
    fetchLatestPhotos,
    getRoverManifest
};