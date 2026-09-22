// Moves the indicator and adjusts for layout orientation
const moveIndicator = (targetLink) => {
    const indicator = document.querySelector('.nav-indicator');
    const navContainer = document.querySelector('.nav-container');
    if (!targetLink || !indicator || !navContainer) return;

    // Detect if viewport is in a vertical layout (navbar to the right)
    const isVertical = window.getComputedStyle(navContainer).flexDirection === 'column';

    if (isVertical) {
        indicator.style.height = `${targetLink.offsetHeight}px`;
        indicator.style.top = `${targetLink.offsetTop}px`;
        indicator.style.width = '3px';
        indicator.style.left = '0';
    } else {
        indicator.style.width = `${targetLink.offsetWidth}px`;
        indicator.style.left = `${targetLink.offsetLeft}px`;
        indicator.style.height = '3px';

        // Portrait mobile (top) vs desktop (bottom)
        const isPortraitMobile = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
        indicator.style.top = isPortraitMobile ? '0' : 'auto';
        indicator.style.bottom = isPortraitMobile ? 'auto' : '0';
    }
};

const initScrollSpy = () => {
    const sections = [...document.querySelectorAll('main section[id]')];
    const links = [...document.querySelectorAll('.nav-link')];
    if (!sections.length || !links.length) return;

    // A section becomes active once its top edge passes this line,
    // measured as a fraction of the viewport height from the top.
    // Higher = switches sooner while scrolling down, lower = later.
    const TRIGGER = 0.4;

    let activeId = null;
    let frameQueued = false;

    const getCurrentSectionId = () => {
        // If the section is too short, then check if more scroll, if not, then last section active
        const atBottom =
            window.scrollY > 0 &&
            window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        if (atBottom) return sections[sections.length - 1].id;

        const line = window.innerHeight * TRIGGER;
        let current = sections[0];
        for (const section of sections) {
            if (section.getBoundingClientRect().top <= line) current = section;
        }
        return current.id;
    };

    const update = (force = false) => {
        const id = getCurrentSectionId();
        if (id === activeId && !force) return; // nothing changed, skip DOM work
        activeId = id;

        let activeLink = null;
        links.forEach((link) => {
            const isActive = link.dataset.section === id;
            link.classList.toggle('active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
                activeLink = link;
            } else {
                link.removeAttribute('aria-current');
            }
        });
        moveIndicator(activeLink);
    };

    // Throttle scroll handling to one check per animation frame
    window.addEventListener('scroll', () => {
        if (frameQueued) return;
        frameQueued = true;
        requestAnimationFrame(() => {
            frameQueued = false;
            update();
        });
    }, { passive: true });

    window.addEventListener('resize', () => update(true));
    window.addEventListener('load', () => update(true));

    update(true);
};

document.addEventListener('DOMContentLoaded', initScrollSpy);