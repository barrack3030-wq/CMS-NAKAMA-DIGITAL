/**
 * THEME 07 - PROSPERA
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
    const navItems = document.querySelectorAll('.nav-item, .btn');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            if(navLinks.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(navLinks.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
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

    // Trigger initial reveal for elements in viewport
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 150);

    // 4. Loan Simulator Logic (Visual / UI Demo)
    const amountSlider = document.getElementById('amount-slider');
    const tenorSlider = document.getElementById('tenor-slider');
    const amountVal = document.getElementById('amount-val');
    const tenorVal = document.getElementById('tenor-val');
    const resultVal = document.getElementById('result-val');

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate simulated loan
    const calculateLoan = () => {
        if (!amountSlider || !tenorSlider || !resultVal) return;

        // slider is 1 to 100 (representing millions)
        const principal = parseInt(amountSlider.value) * 1000000;
        const months = parseInt(tenorSlider.value);
        
        // Asumsi bunga flat 1.1% per bulan
        const interestRate = 0.011;
        
        const totalInterest = principal * interestRate * months;
        const totalPayment = principal + totalInterest;
        const monthlyPayment = totalPayment / months;

        // Update UI
        amountVal.textContent = formatCurrency(principal);
        tenorVal.textContent = `${months} Bulan`;
        resultVal.textContent = formatCurrency(monthlyPayment);
        
        // Update slider track background (Visual effect)
        updateSliderBg(amountSlider);
        updateSliderBg(tenorSlider);
    };

    const updateSliderBg = (slider) => {
        const val = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, var(--c-primary) ${val}%, var(--c-light-gray) ${val}%)`;
    };

    if (amountSlider && tenorSlider) {
        amountSlider.addEventListener('input', calculateLoan);
        tenorSlider.addEventListener('input', calculateLoan);
        // Initial calculation
        calculateLoan();
    }

});
