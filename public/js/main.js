// Main page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Navigation functionality
    initializeNavigation();
    
    // Initialize home page interactions
    initializeHomePage();
});

function initializeNavigation() {
    // Add active class to current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

function initializeHomePage() {
    // Add hover effects and interactions for rover cards
    const roverCards = document.querySelectorAll('.rover-card');
    
    roverCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-4px)';
        });
    });
    
    // Add smooth scrolling for internal links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function navigateToRover(roverName) {
    window.location.href = `/${roverName}`;
}

// Utility functions
function showLoading(element) {
    if (element) {
        element.style.display = 'block';
    }
}

function hideLoading(element) {
    if (element) {
        element.style.display = 'none';
    }
}

function showError(element, message = 'An error occurred') {
    if (element) {
        element.style.display = 'block';
        const messageElement = element.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

function hideError(element) {
    if (element) {
        element.style.display = 'none';
    }
}

// Format camera name utility
function formatCameraName(cameraName) {
    const cameraNames = {
        'FRONT_HAZCAM_LEFT_A': 'Front Hazard Left',
        'FRONT_HAZCAM_RIGHT_A': 'Front Hazard Right',
        'REAR_HAZCAM_LEFT': 'Rear Hazard Left',
        'REAR_HAZCAM_RIGHT': 'Rear Hazard Right',
        'MASTCAM_LEFT': 'Mastcam Left',
        'MASTCAM_RIGHT': 'Mastcam Right',
        'MARDI': 'Descent Imager',
        'MAHLI': 'Hand Lens Imager',
        'SUPERCAM_RMI': 'SuperCam RMI',
        'NAVCAM_LEFT': 'Navigation Left',
        'NAVCAM_RIGHT': 'Navigation Right',
        'CHEMCAM': 'ChemCam',
        'MAST': 'Mast Camera',
        'FHAZ': 'Front Hazard Avoidance',
        'RHAZ': 'Rear Hazard Avoidance',
        'NAVCAM': 'Navigation Camera'
    };
    
    return cameraNames[cameraName] || cameraName;
}

// Format date utility
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Make functions globally available
window.formatCameraName = formatCameraName;
window.formatDate = formatDate;