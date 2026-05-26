// lang.js — shared language switcher for A-Team site
(function () {
    function setLang(lang) {
        if (lang === 'en') {
            document.body.classList.add('lang-en');
        } else {
            document.body.classList.remove('lang-en');
        }

        // Update toggle knob aria + flag opacities
        document.querySelectorAll('.lang-flag[data-for="es"]').forEach(el => {
            el.classList.toggle('active', lang === 'es');
        });
        document.querySelectorAll('.lang-flag[data-for="en"]').forEach(el => {
            el.classList.toggle('active', lang === 'en');
        });

        // Swap hero banner images (only on home page)
        const heroDesktop = document.querySelector('.hero-image source[media="(min-width: 769px)"]');
        const heroMobile  = document.querySelector('.hero-image source[media="(max-width: 768px)"]');
        const heroImg     = document.getElementById('hero-logo');
        if (heroDesktop && heroMobile && heroImg) {
            heroDesktop.srcset = lang === 'es' ? 'assets/img/hero-banner-es.jpeg'        : 'assets/img/hero-banner-en.jpeg';
            heroMobile.srcset  = lang === 'es' ? 'assets/img/hero-banner-mobile-es.jpeg' : 'assets/img/hero-banner-mobile-en.jpeg';
            heroImg.src        = lang === 'es' ? 'assets/img/hero-banner-es.jpeg'        : 'assets/img/hero-banner-en.jpeg';
        }

        localStorage.setItem('lang', lang);
    }

    // Expose globally so onclick="" still works
    window.setLang = setLang;

    // Init on load
    document.addEventListener('DOMContentLoaded', function () {
        var saved = localStorage.getItem('lang') || 'es';
        setLang(saved);
    });
})();
