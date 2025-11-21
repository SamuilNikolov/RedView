/**
 * NASA Mars Rover API Service (local microservice backed)
 * - Uses /api proxy (server.js) which forwards to rover-media-service on :4001
 */

class MarsRoverAPI {
  constructor() {
    // Use the Express proxy so the front-end stays same-origin
    this.baseURL = '/api';
    this.timeout = 5000; // 5 seconds
    this.config = null; // Will be loaded on first use
  }

  /**
   * Load API configuration (camera mappings, API mode)
   * @returns {Promise<Object>}
   */
  async loadConfig() {
    if (this.config) return this.config;
    
    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error('Failed to load API config');
      }
      this.config = await response.json();
      return this.config;
    } catch (error) {
      console.error('Failed to load API config, assuming local DB mode:', error);
      // Default to local DB mode if config fails
      this.config = { useRailsAPI: false };
      return this.config;
    }
  }

  /**
   * Map camera name from local DB format to Rails API format
   * @param {string} rover - Rover name
   * @param {string} camera - Camera name (local DB format)
   * @returns {string} Camera name in appropriate format
   */
  async mapCameraName(rover, camera) {
    const config = await this.loadConfig();
    
    if (!config.useRailsAPI) {
      // Local DB mode - return as-is
      return camera;
    }
    
    // Rails API mode - map to abbreviation
    const mapping = config.cameraMappings[rover.toLowerCase()];
    if (mapping && mapping[camera]) {
      return mapping[camera];
    }
    
    // If no mapping found, assume it's already in Rails API format
    return camera;
  }

  /**
   * Get available cameras for a rover based on current API mode
   * @param {string} rover - Rover name (curiosity or perseverance)
   * @returns {Promise<Array>} Array of {value, label} objects
   */
  async getAvailableCameras(rover) {
    const config = await this.loadConfig();
    const roverKey = rover.toLowerCase();
    
    if (config.useRailsAPI) {
      return config.railsAPICameras[roverKey] || [];
    } else {
      return config.localDBCameras[roverKey] || [];
    }
  }

  async getLatestImages(rover) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/${encodeURIComponent(rover)}/latest`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json(); // { latest_photos: [...] }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw new Error(`Failed to fetch images: ${error.message}`);
    }
  }

  /**
   * Fetch most recent Curiosity rover images
   * @returns {Promise<{latest_photos: Array}>}
   */
  async getLatestCuriosityImages() {
    return this.getLatestImages('curiosity');
  }

  /**
   * Fetch most recent Perseverance rover images
   * @returns {Promise<{latest_photos: Array}>}
   */
  async getLatestPerseveranceImages() {
    return this.getLatestImages('perseverance');
  }

  /**
   * Fetch images filtered by camera and sol
   * @param {string} rover - Rover name (curiosity or perseverance)
   * @param {string} camera - Camera name (will be mapped if needed)
   * @param {number|string} sol - Sol number
   * @returns {Promise<{photos: Array}>}
   */
  async getImagesByCameraAndSol(rover, camera, sol) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Map camera name to appropriate format for current API mode
      const mappedCamera = await this.mapCameraName(rover, camera);
      
      const params = new URLSearchParams({
        camera: mappedCamera,
        sol: String(sol)
      });
      const response = await fetch(`${this.baseURL}/${encodeURIComponent(rover)}/photos?${params}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json(); // { photos: [...] }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Fetch all images for a specific sol across all cameras
   * @param {string} rover - Rover name (curiosity or perseverance)
   * @param {number|string} sol - Sol number
   * @returns {Promise<{photos: Array}>}
   */
  async getImagesBySol(rover, sol) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/${encodeURIComponent(rover)}/sol/${encodeURIComponent(sol)}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json(); // { photos: [...] }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Get the latest sol number for a rover
   * @param {string} rover - Rover name (curiosity or perseverance)
   * @returns {Promise<{latest_sol: number|null}>}
   */
  async getLatestSol(rover) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/${encodeURIComponent(rover)}/latest-sol`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json(); // { latest_sol: number|null }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }
}

// Export for use in other files
window.MarsRoverAPI = MarsRoverAPI;
