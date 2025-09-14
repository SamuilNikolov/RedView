// Curiosity rover page functionality
class CuriosityController {
    constructor() {
        this.currentPage = 1;
        this.currentQuery = null;
        this.isLoading = false;
        this.viewMode = 'grid';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadLatestImages();
    }
    
    initializeElements() {
        this.solInput = document.getElementById('sol-input');
        this.cameraSelect = document.getElementById('camera-select');
        this.searchBtn = document.getElementById('search-btn');
        this.latestBtn = document.getElementById('latest-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.gridViewBtn = document.getElementById('grid-view');
        this.listViewBtn = document.getElementById('list-view');
        this.loadMoreBtn = document.getElementById('load-more-btn');
        this.loadMoreContainer = document.getElementById('load-more-container');
        
        this.loadingElement = document.getElementById('loading');
        this.errorElement = document.getElementById('error');
        this.imagesContainer = document.getElementById('images-container');
        this.resultsTitle = document.getElementById('results-title');
        this.resultsCount = document.getElementById('results-count');
    }
    
    initializeEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchImages());
        this.latestBtn.addEventListener('click', () => this.loadLatestImages());
        this.clearBtn.addEventListener('click', () => this.clearResults());
        
        this.gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));
        this.listViewBtn.addEventListener('click', () => this.setViewMode('list'));
        
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreImages());
        
        // Enter key support for search
        this.solInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchImages();
            }
        });
    }
    
    async searchImages() {
        if (this.isLoading) return;
        
        const sol = this.solInput.value.trim();
        const camera = this.cameraSelect.value;
        
        if (!sol) {
            alert('Please enter a sol number');
            return;
        }
        
        this.currentQuery = { sol, camera };
        this.currentPage = 1;
        
        await this.fetchImages(true);
    }
    
    async loadLatestImages() {
        if (this.isLoading) return;
        
        this.currentQuery = null;
        this.currentPage = 1;
        
        await this.fetchLatestImages(true);
    }
    
    async loadMoreImages() {
        if (this.isLoading || !this.currentQuery) return;
        
        this.currentPage++;
        await this.fetchImages(false);
    }
    
    async fetchImages(clearResults = true) {
        this.setLoading(true);
        
        if (clearResults) {
            this.clearImageContainer();
        }
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage.toString()
            });
            
            if (this.currentQuery.sol) params.append('sol', this.currentQuery.sol);
            if (this.currentQuery.camera) params.append('camera', this.currentQuery.camera);
            
            const response = await fetch(`/api/rover/curiosity/photos?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (clearResults) {
                this.updateResultsHeader('Search Results', data.photos.length);
            }
            
            this.renderImages(data.photos, !clearResults);
            this.updateLoadMoreButton(data.photos.length > 0);
            
        } catch (error) {
            console.error('Error fetching images:', error);
            this.showError('Failed to load images. Please try again.');
        }
        
        this.setLoading(false);
    }
    
    async fetchLatestImages(clearResults = true) {
        this.setLoading(true);
        
        if (clearResults) {
            this.clearImageContainer();
        }
        
        try {
            const camera = this.cameraSelect.value;
            const params = new URLSearchParams();
            if (camera) {
                params.append('camera', camera);
            }

            const response = await fetch(`/api/ rover/curiosity/latest?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            this.updateResultsHeader('Latest Images', data.photos.length);
            this.renderImages(data.photos, !clearResults);
            this.updateLoadMoreButton(false); // Latest doesn't have pagination
            
        } catch (error) {
            console.error('Error fetching latest images:', error);
            this.showError('Failed to load latest images. Please try again.');
        }
        
        this.setLoading(false);
    }
    
    renderImages(images, append = false) {
        if (!append) {
            this.clearImageContainer(); // Clears images and any 'no more results' message
        }
        
        if (images.length === 0) {
            if (!append) {
                // This was a new search that returned nothing.
                this.imagesContainer.innerHTML = '<div class="no-results">No images found for the selected criteria.</div>';
            } else {
                // This was a "Load More" click that returned nothing.
                const parent = this.loadMoreContainer.parentElement;
                if (parent && !parent.querySelector('.no-more-results')) {
                    const noMoreMessage = document.createElement('div');
                    noMoreMessage.className = 'no-more-results';
                    noMoreMessage.textContent = 'No more images to load.';
                    parent.insertBefore(noMoreMessage, this.loadMoreContainer);
                }
            }
            return;
        }
        
        images.forEach(image => {
            const imageCard = this.createImageCard(image);
            this.imagesContainer.appendChild(imageCard);
        });
    }
    
    createImageCard(imageData) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.addEventListener('click', () => openImageModal(imageData));
        
        card.innerHTML = `
            <div class="image-container">
                <img src="${imageData.img_src}" alt="Mars image from ${imageData.camera.full_name}" loading="lazy">
                <div class="image-overlay">${formatCameraName(imageData.camera.name)}</div>
            </div>
            <div class="image-info">
                <div class="image-meta-grid">
                    <div class="meta-row">
                        <span class="label">Sol:</span>
                        <span class="value">${imageData.sol}</span>
                    </div>
                    <div class="meta-row">
                        <span class="label">Date:</span>
                        <span class="value">${formatDate(imageData.earth_date)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="label">Camera:</span>
                        <span class="value">${formatCameraName(imageData.camera.name)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="label">ID:</span>
                        <span class="value">${imageData.id}</span>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update button states
        this.gridViewBtn.classList.toggle('active', mode === 'grid');
        this.listViewBtn.classList.toggle('active', mode === 'list');
        
        // Update container class
        this.imagesContainer.className = `images-container ${mode}-view`;
    }
    
    clearResults() {
        this.solInput.value = '';
        this.cameraSelect.value = '';
        this.currentQuery = null;
        this.currentPage = 1;
        this.clearImageContainer();
        this.updateResultsHeader('Select search criteria', 0);
        this.updateLoadMoreButton(false);
    }
    
    clearImageContainer() {
        this.imagesContainer.innerHTML = '';
        
        // Remove any "no more results" message
        const parent = this.loadMoreContainer.parentElement;
        const noMoreMessage = parent.querySelector('.no-more-results');
        if (noMoreMessage) {
            noMoreMessage.remove();
        }
    }
    
    updateResultsHeader(title, count) {
        this.resultsTitle.textContent = title;
        this.resultsCount.textContent = count > 0 ? `${count} images found` : '';
    }
    
    updateLoadMoreButton(show) {
        this.loadMoreContainer.style.display = show ? 'block' : 'none';
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        this.loadingElement.style.display = loading ? 'block' : 'none';
        this.errorElement.style.display = 'none';
        
        // Disable buttons during loading
        this.searchBtn.disabled = loading;
        this.latestBtn.disabled = loading;
        this.loadMoreBtn.disabled = loading;
    }
    
    showError(message) {
        this.errorElement.style.display = 'block';
        const errorText = this.errorElement.querySelector('p');
        if (errorText) {
            errorText.textContent = message;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new CuriosityController();
});