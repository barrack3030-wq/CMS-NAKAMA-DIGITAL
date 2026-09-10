/**
 * THEME 05 - WANDER
 * Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Navigation Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Fullscreen Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const menuOverlay = document.querySelector('.menu-overlay');
    const navItems = document.querySelectorAll('.menu-overlay .nav-item');

    if (menuToggle && menuOverlay) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            
            if(menuOverlay.classList.contains('active')) {
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            } else {
                document.body.style.overflow = '';
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(menuOverlay.classList.contains('active')) {
                menuToggle.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // 3. Simple Hero Parallax Effect
    const parallaxBg = document.querySelector('.parallax-bg');
    
    window.addEventListener('scroll', () => {
        if (parallaxBg) {
            let scrollPosition = window.pageYOffset;
            // Only apply parallax if near top to save performance
            if (scrollPosition < window.innerHeight) {
                parallaxBg.style.transform = `translateY(${scrollPosition * 0.4}px)`;
            }
        }
    });

    // 4. Scroll Reveal Animation (Intersection Observer)
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

    // Initial check on load
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 150);

    // 5. Horizontal Scrolling interaction for Destinations
    const destTrack = document.querySelector('.dest-track');
    let isDown = false;
    let startX;
    let scrollLeft;

    if (destTrack) {
        destTrack.addEventListener('mousedown', (e) => {
            isDown = true;
            destTrack.style.cursor = 'grabbing';
            startX = e.pageX - destTrack.offsetLeft;
            scrollLeft = destTrack.scrollLeft;
        });
        
        destTrack.addEventListener('mouseleave', () => {
            isDown = false;
            destTrack.style.cursor = 'auto';
        });
        
        destTrack.addEventListener('mouseup', () => {
            isDown = false;
            destTrack.style.cursor = 'auto';
        });
        
        destTrack.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - destTrack.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            destTrack.scrollLeft = scrollLeft - walk;
        });
    }
});
