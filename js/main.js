// Main JavaScript file for Game Playground

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Game Playground initialized');

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Log current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);
});

// Helper function to navigate back to homepage
function goToHomepage() {
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const homeUrl = isInPagesFolder ? '../index.html' : 'index.html';
    window.location.href = homeUrl;
}

// Helper function to navigate to a specific page
function goToPage(pageNumber) {
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const pageUrl = isInPagesFolder ? `page${pageNumber}.html` : `pages/page${pageNumber}.html`;
    window.location.href = pageUrl;
}

// Add keyboard navigation (optional)
document.addEventListener('keydown', function(event) {
    // Press 'H' to go to homepage
    if (event.key === 'h' || event.key === 'H') {
        if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
            goToHomepage();
        }
    }
});
