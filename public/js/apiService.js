/**
 * NASA Mars Rover API Service
 * 
 * REQUIREMENT: Fetch most recent Curiosity rover images
 * TASK: Create reusable API service with error handling
 * METHOD: Use fetch with timeout and proper error handling
 */

class MarsRoverAPI {
    constructor() {
        this.baseURL = '/api';
        this.timeout = 5000; // 5 seconds
    }

    /**
     * Fetch most recent Curiosity rover images
     * @returns {Promise<Object>} API response with images
     */
    async getLatestCuriosityImages() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseURL}/curiosity/latest`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw new Error(`Failed to fetch images: ${error.message}`);
        }
    }
}

// Export for use in other files
window.MarsRoverAPI = MarsRoverAPI;
