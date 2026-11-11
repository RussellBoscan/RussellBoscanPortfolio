/* -------------------------------------------------------------------------- */
/* Navigation: active section tracking and responsive indicator placement      */
/* -------------------------------------------------------------------------- */

// Place the active-section indicator over the selected link. Its axis changes
// when the responsive layout moves the navigation to a vertical rail.
const moveIndicator = (targetLink) => {
    const indicator = document.querySelector('.nav-indicator');
    const navContainer = document.querySelector('.nav-container');
    if (!targetLink || !indicator || !navContainer) return;

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

        // Portrait mobile places the horizontal navigation along the bottom;
        // the desktop navigation stays at the top with an underline below it.
        const isPortraitMobile = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
        indicator.style.top = isPortraitMobile ? '0' : 'auto';
        indicator.style.bottom = isPortraitMobile ? 'auto' : '0';
    }
};

// Keep the navigation's active link and indicator in sync with the visible
// page section while preserving the existing scroll-spy threshold behavior.
const initScrollSpy = () => {
    const sections = [...document.querySelectorAll('main section[id]')];
    const links = [...document.querySelectorAll('.nav-link')];
    if (!sections.length || !links.length) return;

    const TRIGGER = 0.4;
    let activeId = null;
    let frameQueued = false;

    // Track actual touch input rather than relying only on device media queries:
    // hybrid laptops report mouse/hover support even when used by touch.
    links.forEach((link) => {
        link.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'touch') {
                link.classList.add('touch-activated');
            } else if (event.pointerType === 'mouse') {
                links.forEach((navLink) => navLink.classList.remove('touch-activated'));
            }
        });

        // Clear browser focus after touch navigation while preserving focus for
        // keyboard activation and regular mouse interaction.
        link.addEventListener('click', (event) => {
            const isTouchActivation = link.classList.contains('touch-activated') ||
                window.matchMedia('(hover: none), (pointer: coarse)').matches;
            if (event.detail > 0 && isTouchActivation) {
                window.setTimeout(() => link.blur(), 0);
            }
        });
    });

    const getCurrentSectionId = () => {
        const atBottom = window.scrollY > 0 &&
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
        if (id === activeId && !force) return;
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

    // Limit scroll work to one section check per animation frame.
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

/* -------------------------------------------------------------------------- */
/* Experience: generated job detail dialog and responsive navigation handling */
/* -------------------------------------------------------------------------- */

// Build the floating dialog once. Each trigger supplies the content from its
// own timeline entry, so no navigation or separate HTML page is involved.
const createJobDetailDialog = () => {
    const overlay = document.createElement('div');
    overlay.className = 'job-detail-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <section class="job-detail-panel" role="dialog" aria-modal="true" aria-labelledby="job-detail-title" tabindex="-1">
            <button class="job-detail-back" type="button" aria-label="Close job details">
                <span class="material-symbols-outlined" aria-hidden="true">arrow_left</span>
            </button>
            <h2 class="job-detail-title" id="job-detail-title"></h2>
            <p class="job-detail-meta"></p>
            <div class="job-detail-body"></div>
        </section>`;
    document.body.append(overlay);

    const panel = overlay.querySelector('.job-detail-panel');
    const backButton = overlay.querySelector('.job-detail-back');
    const title = overlay.querySelector('.job-detail-title');
    const meta = overlay.querySelector('.job-detail-meta');
    const body = overlay.querySelector('.job-detail-body');
    const navbar = document.querySelector('.navbar');
    let activeTrigger = null;
    let previousBodyOverflow = '';
    let previousBodyPaddingRight = '';

    // Hide top and bottom navigation layouts. The right-side landscape rail
    // stays visible so it remains available while reading the job details.
    const hideNavbar = () => {
        if (!navbar) return;
        navbar.style.removeProperty('--detail-nav-exit-x');
        navbar.style.removeProperty('--detail-nav-exit-y');
        const rect = navbar.getBoundingClientRect();
        const navContainer = navbar.querySelector('.nav-container');
        const isVerticalRail = navContainer &&
            window.getComputedStyle(navContainer).flexDirection === 'column';
        if (isVerticalRail) return;

        navbar.style.setProperty('--detail-nav-exit-x', '0');
        navbar.style.setProperty('--detail-nav-exit-y', rect.top > window.innerHeight / 2 ? '110%' : '-110%');
    };

    const showNavbar = () => {
        if (!navbar) return;
        navbar.style.removeProperty('--detail-nav-exit-x');
        navbar.style.removeProperty('--detail-nav-exit-y');
    };

    const close = () => {
        if (!overlay.classList.contains('is-open')) return;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('job-detail-active');
        document.body.style.overflow = previousBodyOverflow;
        document.body.style.paddingRight = previousBodyPaddingRight;
        showNavbar();
        if (activeTrigger) activeTrigger.focus();
        activeTrigger = null;
    };

    const open = (trigger) => {
        const entry = trigger.closest('.timeline-content');
        if (!entry) return;

        const heading = trigger.closest('.job-title');
        const summary = entry.querySelector('.job-description');
        const detailCopy = entry.querySelector('.job-detail-copy');
        const companyDate = entry.querySelector('.company-date');
        if (!heading || !summary || !detailCopy || !companyDate) return;

        activeTrigger = trigger;
        // The visible label is the button's text node; omit the icon's ligature text.
        title.textContent = trigger.firstChild.textContent.trim();
        meta.textContent = companyDate.textContent.trim();
        body.replaceChildren();
        const summaryCopy = summary.cloneNode(true);
        summaryCopy.className = 'job-detail-summary';
        body.append(summaryCopy, detailCopy.cloneNode(true));
        body.querySelector('.job-detail-copy').hidden = false;

        previousBodyOverflow = document.body.style.overflow;
        previousBodyPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
            const currentPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
            document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
        }
        document.body.style.overflow = 'hidden';
        document.body.classList.add('job-detail-active');
        overlay.setAttribute('aria-hidden', 'false');
        overlay.classList.add('is-open');
        hideNavbar();
        backButton.focus();
    };

    document.querySelectorAll('.job-title-trigger').forEach((trigger) => {
        trigger.addEventListener('click', () => open(trigger));
    });

    backButton.addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) close();
    });

    // Escape closes the dialog; Tab remains within it while it is open.
    document.addEventListener('keydown', (event) => {
        if (!overlay.classList.contains('is-open')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = [...panel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
};

/* -------------------------------------------------------------------------- */
/* Contact: copy the email address and announce the result                     */
/* -------------------------------------------------------------------------- */

const initEmailCopy = () => {
    const emailButton = document.querySelector('.email-field');
    const emailAddress = document.querySelector('.email-address');
    const copyFeedback = document.querySelector('.copy-feedback');
    if (!emailButton || !emailAddress || !copyFeedback) return;

    let feedbackTimeout;
    emailButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(emailAddress.textContent.trim());
            copyFeedback.querySelector('.copy-feedback-text').textContent = 'Copied';
        } catch {
            copyFeedback.querySelector('.copy-feedback-text').textContent = 'Unable to copy';
        }

        copyFeedback.classList.remove('show');
        void copyFeedback.offsetWidth;
        copyFeedback.classList.add('show');
        clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => copyFeedback.classList.remove('show'), 1800);
    });
};

// Initialize all independent page behaviors after the document has been parsed.
document.addEventListener('DOMContentLoaded', () => {
    initScrollSpy();
    createJobDetailDialog();
    initEmailCopy();
});
