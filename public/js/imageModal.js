// Image modal functionality
class ImageModal {
    constructor() {
        this.modal = document.getElementById('image-modal');
        this.modalImage = document.getElementById('modal-image');
        this.modalClose = document.getElementById('modal-close');
        this.downloadBtn = document.getElementById('download-btn');
        this.viewFullBtn = document.getElementById('view-full-btn');
        
        this.currentImageData = null;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Close modal events
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });
        
        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        
        // View full size button
        this.viewFullBtn.addEventListener('click', () => this.viewFullSize());
    }
    
    openModal(imageData) {
        this.currentImageData = imageData;
        
        // Set modal content
        this.setModalContent(imageData);
        
        // Show modal
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add show class for animation
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
    }
    
    closeModal() {
        this.modal.classList.remove('show');
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
    
    isModalOpen() {
        return this.modal.style.display === 'flex';
    }
    
    setModalContent(imageData) {
        // Set image
        const imageContainer = this.modalImage.parentElement;
        imageContainer.classList.add('loading');
        
        this.modalImage.onload = () => {
            imageContainer.classList.remove('loading');
        };
        
        this.modalImage.onerror = () => {
            imageContainer.classList.remove('loading');
            this.modalImage.alt = 'Failed to load image';
        };
        
        this.modalImage.src = imageData.img_src;
        this.modalImage.alt = `Mars image from ${imageData.camera.full_name}`;
        
        // Set metadata
        document.getElementById('modal-sol').textContent = imageData.sol;
        document.getElementById('modal-camera').textContent = formatCameraName(imageData.camera.name);
        document.getElementById('modal-date').textContent = formatDate(imageData.earth_date);
        document.getElementById('modal-status').textContent = imageData.rover.status || 'Active';
        
        // Set modal title
        document.getElementById('modal-title').textContent = 
            `${imageData.rover.name} - Sol ${imageData.sol}`;
    }
    
    downloadImage() {
        if (!this.currentImageData) return;
        
        const link = document.createElement('a');
        link.href = this.currentImageData.img_src;
        link.download = this.generateFileName();
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    viewFullSize() {
        if (!this.currentImageData) return;
        
        window.open(this.currentImageData.img_src, '_blank');
    }
    
    generateFileName() {
        if (!this.currentImageData) return 'mars-image.jpg';
        
        const rover = this.currentImageData.rover.name.toLowerCase();
        const sol = this.currentImageData.sol;
        const camera = this.currentImageData.camera.name.toLowerCase();
        const id = this.currentImageData.id;
        
        return `${rover}_sol${sol}_${camera}_${id}.jpg`;
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.imageModal = new ImageModal();
});

// Function to open modal from other scripts
function openImageModal(imageData) {
    if (window.imageModal) {
        window.imageModal.openModal(imageData);
    }
}