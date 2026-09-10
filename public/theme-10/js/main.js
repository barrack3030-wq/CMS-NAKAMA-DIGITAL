/**
 * THEME 10 - ALCÔVE
 * Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initial Loader
    const loader = document.getElementById('loader');
    
    // Simulate loading time for effect
    setTimeout(() => {
        if(loader) {
            loader.classList.add('hidden');
            // Remove from DOM after fade out
            setTimeout(() => loader.remove(), 1000);
        }
    }, 1200);

    // 2. Navigation Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Fullscreen Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuItems = document.querySelectorAll('.menu-item');
    const toggleText = menuToggle.querySelector('span');

    if (menuToggle && menuOverlay) {
        menuToggle.addEventListener('click', () => {
            const isActive = menuOverlay.classList.contains('active');
            
            if (isActive) {
                menuOverlay.classList.remove('active');
                toggleText.textContent = 'Menu';
                document.body.style.overflow = '';
            } else {
                menuOverlay.classList.add('active');
                toggleText.textContent = 'Close';
                document.body.style.overflow = 'hidden';
            }
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuOverlay.classList.remove('active');
            toggleText.textContent = 'Menu';
            document.body.style.overflow = '';
        });
    });

    // 4. Accordion Logic
    const accHeaders = document.querySelectorAll('.acc-header');
    
    accHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.accordion-item').forEach(acc => {
                acc.classList.remove('active');
            });

            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // 5. Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // Trigger initial reveal (delayed due to loader)
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 1500);

    // 6. Horizontal Scroll (Drag) for Properties
    const slider = document.querySelector('.carousel-track');
    let isDown = false;
    let startX;
    let scrollLeft;

    if(slider) {
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        });
    }

});
