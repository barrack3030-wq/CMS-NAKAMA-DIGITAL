/**
 * THEME 04 - ARUNIKA
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

    // 2. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-item, .btn-primary');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            // Toggle icon color based on menu state
            const spans = menuToggle.querySelectorAll('span');
            if(navLinks.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
                spans.forEach(s => s.style.backgroundColor = 'var(--c-green)');
            } else {
                document.body.style.overflow = '';
                if(window.scrollY <= 50) {
                    spans.forEach(s => s.style.backgroundColor = 'var(--c-white)');
                }
            }
        });
    }

    // Handle scroll color restoration for mobile menu icon
    window.addEventListener('scroll', () => {
        if(menuToggle && !navLinks.classList.contains('active')) {
            const spans = menuToggle.querySelectorAll('span');
            if (window.scrollY > 50) {
                spans.forEach(s => s.style.backgroundColor = 'var(--c-green)');
            } else {
                spans.forEach(s => s.style.backgroundColor = 'var(--c-white)');
            }
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(navLinks.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
                
                const spans = menuToggle.querySelectorAll('span');
                if(window.scrollY <= 50) {
                    spans.forEach(s => s.style.backgroundColor = 'var(--c-white)');
                }
            }
        });
    });

    // 3. Scroll Reveal Animation
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

    // Initial check
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 100);

    // 4. Donation Amount Buttons
    const amountBtns = document.querySelectorAll('.amount-btn');
    amountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            amountBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

});
