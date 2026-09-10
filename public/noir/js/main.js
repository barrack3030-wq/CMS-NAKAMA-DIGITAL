// Theme 09 - NOIR JS

document.addEventListener('DOMContentLoaded', () => {
    // 1. Minimal Mobile/Fullscreen Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            navbar.classList.toggle('menu-open');
        });
    }

    // 2. Navbar Transition on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });

    // 3. Cinematic Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal, .reveal-scale');

    const revealOptions = {
        threshold: 0.15, // Trigger slightly later for dramatic effect
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
    
    // 4. Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                e.preventDefault();
                // Close menu if open
                navbar?.classList.remove('menu-open');
                
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 5. Initial Hero Scale Reveal
    setTimeout(() => {
        const heroBg = document.querySelector('.hero-bg');
        if(heroBg) heroBg.classList.add('active');
    }, 200);
});
