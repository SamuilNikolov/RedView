/**
 * NASA Mars Rover API Service (local microservice backed)
 * - Uses /api proxy (server.js) which forwards to rover-media-service on :4001
 */

class MarsRoverAPI {
  constructor() {
    // Use the Express proxy so the front-end stays same-origin
    this.baseURL = '/api';
    this.timeout = 5000; // 5 seconds
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
   * @param {string} camera - Camera name
   * @param {number|string} sol - Sol number
   * @returns {Promise<{photos: Array}>}
   */
  async getImagesByCameraAndSol(rover, camera, sol) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const params = new URLSearchParams({
        camera: camera,
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
