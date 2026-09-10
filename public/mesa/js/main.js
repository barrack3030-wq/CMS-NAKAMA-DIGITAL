// Theme 12 - MESA JS

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Navbar padding transition
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });

    // 2. Artistic Reveal Animations
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-clip');

    const revealOptions = {
        threshold: 0.15,
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

    // 3. Simple Parallax Effect on Hero Image
    const parallaxImg = document.querySelector('.parallax-img');
    if (parallaxImg && window.innerWidth > 1024) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            // Move image slightly slower than scroll speed
            parallaxImg.style.transform = `scale(1.1) translateY(${scrolled * 0.15}px)`;
        });
    }

    // 4. Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 5. Trigger initial hero animations instantly
    setTimeout(() => {
        document.querySelectorAll('.hero .reveal-up, .hero .reveal-clip').forEach(el => {
            el.classList.add('active');
        });
    }, 100);
});
