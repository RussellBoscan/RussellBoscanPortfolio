document.addEventListener('DOMContentLoaded', () => {
    // Cache required DOM elements
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');
    const indicator = document.querySelector('.nav-indicator');
    const navContainer = document.querySelector('.nav-container');

    // Abort if essential navigation elements are missing
    if (!navLinks.length || !sections.length) return;

    // Reposition the sliding indicator relative to the active link
    const moveIndicator = (targetLink) => {
        if (!targetLink || !indicator || !navContainer) return;

        // Check layout orientation (vertical sidebar vs horizontal bar)
        const isVertical = getComputedStyle(navContainer).flexDirection === 'column';

        if (isVertical) {
            // Apply vertical sidebar indicator styles
            indicator.style.cssText = `
                height: ${targetLink.offsetHeight}px;
                top: ${targetLink.offsetTop}px;
                width: 3px;
                left: 0;
            `;
        } else {
            // Check for mobile portrait viewport
            const isMobile = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
            
            // Apply horizontal navbar indicator styles
            indicator.style.cssText = `
                width: ${targetLink.offsetWidth}px;
                left: ${targetLink.offsetLeft}px;
                height: 3px;
                top: ${isMobile ? '0' : 'auto'};
                bottom: ${isMobile ? 'auto' : '0'};
            `;
        }
    };

    // Toggle active state classes and ARIA attributes on nav links
    const setActive = (sectionId) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('data-section') === sectionId;
            link.classList.toggle('active', isActive);
            
            if (isActive) {
                link.setAttribute('aria-current', 'page');
                moveIndicator(link);
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    // Trigger active state when a section hits the viewport midpoint
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
            }
        });
    }, {
        rootMargin: '-50% 0px -50% 0px', // Horizontal trigger line at 50% screen height
        threshold: 0
    });

    // Start observing each section in <main>
    sections.forEach((section) => observer.observe(section));

    // Recalculate indicator position on viewport resize
    window.addEventListener('resize', () => {
        moveIndicator(document.querySelector('.nav-link.active'));
    });

    // Position indicator on initial load
    moveIndicator(document.querySelector('.nav-link.active'));
});
