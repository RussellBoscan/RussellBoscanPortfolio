/**
 * Main JavaScript Module (ECMAScript 2026 Standard)
 * Handles frictionless navigation and automatic scroll-spy highlighting
 * using high-performance IntersectionObserver and sliding indicator.
 */

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initScrollSpy();
    
    // Position indicator on page load
    const initialActive = document.querySelector('.nav-link.active');
    moveIndicator(initialActive);
});

// Re-align indicator if the user resizes their browser window
window.addEventListener('resize', () => {
    const currentActive = document.querySelector('.nav-link.active');
    moveIndicator(currentActive);
});

/**
 * Moves the indicator and dynamically adjusts for layout orientation
 */
const moveIndicator = (targetLink) => {
    const indicator = document.querySelector('.nav-indicator');
    const navContainer = document.querySelector('.nav-container');
    if (!targetLink || !indicator || !navContainer) return;

    // Detect if we are in a vertical layout (Right Navbar)
    const isVertical = window.getComputedStyle(navContainer).flexDirection === 'column';

    if (isVertical) {
        // Vertical mode: Animate vertical axis
        indicator.style.height = `${targetLink.offsetHeight}px`;
        indicator.style.top = `${targetLink.offsetTop}px`;
        indicator.style.width = '3px';
        indicator.style.left = '0';
    } else {
        // Horizontal mode: Animate horizontal axis
        indicator.style.width = `${targetLink.offsetWidth}px`;
        indicator.style.left = `${targetLink.offsetLeft}px`;
        indicator.style.height = '3px';
        
        // Handle Portrait Mobile (top) vs Desktop (bottom)
        const isPortraitMobile = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
        indicator.style.top = isPortraitMobile ? '0' : 'auto';
        indicator.style.bottom = isPortraitMobile ? 'auto' : '0';
    }
};

/**
 * Sets up the IntersectionObserver to track visible sections
 * and dynamically apply the 'active' styling to navbar buttons.
 */
const initScrollSpy = () => {
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Guard clause if elements are not present in the DOM
    if (!sections.length || !navLinks.length) return;

    // Configuration for observer: triggers when 40% of a section is visible
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.4
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const currentSectionId = entry.target.getAttribute('id');
                updateActiveNavLink(currentSectionId, navLinks);
            }
        });
    }, observerOptions);

    // Observe each section inside <main>
    sections.forEach((section) => {
        sectionObserver.observe(section);
    });
};

/**
 * Updates the active state on navigation links based on current viewport section
 * @param {string} sectionId - The ID of the currently visible section
 * @param {NodeListOf<Element>} navLinks - List of navigation anchor elements
 */
const updateActiveNavLink = (sectionId, navLinks) => {
    navLinks.forEach((link) => {
        const linkSection = link.getAttribute('data-section');
        
        if (linkSection === sectionId) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            
            // NEW: Slide the indicator to this newly active link!
            moveIndicator(link);
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
};
