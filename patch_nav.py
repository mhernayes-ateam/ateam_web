import re
import os

files = ['anibal.html', 'pricing.html', 'demo.html', 'terms.html']

style_add = """
        /* Language Switcher */
        .lang-switch {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-left: 1rem;
            background: rgba(0,0,0,0.05);
            padding: 4px 8px;
            border-radius: 20px;
        }
        .lang-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            opacity: 0.5;
            transition: opacity 0.2s;
            padding: 2px;
        }
        .lang-btn.active {
            opacity: 1;
            transform: scale(1.1);
        }
        
        [data-lang="en"] {
            display: none;
        }
        body.lang-en [data-lang="es"] {
            display: none;
        }
        body.lang-en [data-lang="en"] {
            display: inline-block;
        }
        /* Specific display fixes for block elements */
        body.lang-en p[data-lang="en"], 
        body.lang-en h1[data-lang="en"], 
        body.lang-en h2[data-lang="en"], 
        body.lang-en h3[data-lang="en"], 
        body.lang-en h4[data-lang="en"], 
        body.lang-en div[data-lang="en"],
        body.lang-en li[data-lang="en"] {
            display: block;
        }
"""

js_add = """
        // Language Switcher
        function setLang(lang) {
            if (lang === 'en') {
                document.body.classList.add('lang-en');
            } else {
                document.body.classList.remove('lang-en');
            }
            document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll(`.lang-btn[onclick="setLang('${lang}')"]`).forEach(btn => btn.classList.add('active'));
            
            // Swap images if on home
            const heroDesktop = document.querySelector('.hero-image source[media="(min-width: 769px)"]');
            const heroMobile = document.querySelector('.hero-image source[media="(max-width: 768px)"]');
            const heroImg = document.getElementById('hero-logo');
            
            if (heroDesktop && heroMobile && heroImg) {
                if (lang === 'es') {
                    heroDesktop.srcset = 'hero-banner-es.jpeg';
                    heroMobile.srcset = 'hero-banner-mobile-es.jpeg';
                    heroImg.src = 'hero-banner-es.jpeg';
                } else {
                    heroDesktop.srcset = 'hero-banner-en.jpeg';
                    heroMobile.srcset = 'hero-banner-mobile-en.jpeg';
                    heroImg.src = 'hero-banner-en.jpeg';
                }
            }
            
            // Persist choice (optional)
            localStorage.setItem('lang', lang);
        }
        
        // Init lang
        window.addEventListener('DOMContentLoaded', () => {
            const savedLang = localStorage.getItem('lang') || 'es';
            if (savedLang === 'en') setLang('en');
        });
"""

nav_replace = """
            <div class="nav-links">
                <a href="index.html"><span data-lang="es">Inicio</span><span data-lang="en">Home</span></a>
                <a href="anibal.html" class="nav-active">Anibal</a>
                <a href="pricing.html"><span data-lang="es">Precios</span><span data-lang="en">Pricing</span></a>
                <a href="demo.html" class="btn btn-primary"><span data-lang="es">Agendar Demo →</span><span data-lang="en">Book a Demo →</span></a>
                
                <div class="lang-switch">
                    <button class="lang-btn active" onclick="setLang('es')" title="Español">🇦🇷</button>
                    <button class="lang-btn" onclick="setLang('en')" title="English">🇺🇸</button>
                </div>
            </div>
"""

mobile_replace = """
        <div class="mobile-menu" id="mobileMenu">
            <a href="index.html"><span data-lang="es">Inicio</span><span data-lang="en">Home</span></a>
            <a href="anibal.html">Anibal</a>
            <a href="pricing.html"><span data-lang="es">Precios</span><span data-lang="en">Pricing</span></a>
            <a href="demo.html" class="btn btn-primary" style="width:100%;text-align:center;"><span data-lang="es">Agendar Demo →</span><span data-lang="en">Book a Demo →</span></a>
            <div class="lang-switch" style="justify-content: center; margin-top: 1rem; margin-left: 0;">
                <button class="lang-btn active" onclick="setLang('es')" title="Español">🇦🇷</button>
                <button class="lang-btn" onclick="setLang('en')" title="English">🇺🇸</button>
            </div>
        </div>
"""

footer_replace = """
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <div style="margin-bottom:0.75rem;">
                        <img src="isologo-transparente.png" alt="A Team" style="height:44px; width:auto;">
                    </div>
                    <p style="font-size:0.85rem;"><span data-lang="es">Agentes inteligentes. Vida simple.<br>© 2026 A-Team. Todos los derechos reservados.</span><span data-lang="en">Clever agents. Easy living.<br>© 2026 A-Team. All rights reserved.</span></p>
                </div>
                <div class="footer-col">
                    <h5><span data-lang="es">Agentes</span><span data-lang="en">Agents</span></h5>
                    <a href="anibal.html"><span data-lang="es">Anibal — Cobranzas</span><span data-lang="en">Anibal — Collections</span></a>
                    <a href="#"><span data-lang="es">Agente de Ventas (pronto)</span><span data-lang="en">Sales Agent (soon)</span></a>
                    <a href="#"><span data-lang="es">Agente de Reportes (pronto)</span><span data-lang="en">Reporting Agent (soon)</span></a>
                </div>
                <div class="footer-col">
                    <h5><span data-lang="es">Compañía</span><span data-lang="en">Company</span></h5>
                    <a href="index.html"><span data-lang="es">Sobre A-Team</span><span data-lang="en">About A-Team</span></a>
                    <a href="pricing.html">Pricing</a>
                    <a href="demo.html"><span data-lang="es">Agendar Demo</span><span data-lang="en">Book a Demo</span></a>
                </div>
                <div class="footer-col">
                    <h5><span data-lang="es">Legales</span><span data-lang="en">Legal</span></h5>
                    <a href="terms.html"><span data-lang="es">Términos y Condiciones</span><span data-lang="en">Terms &amp; Conditions</span></a>
                </div>
            </div>
        </div>
    </footer>
"""


for filename in files:
    if not os.path.exists(filename): continue
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<html lang="en">' in content:
        content = content.replace('<html lang="en">', '<html lang="es">')
    
    if '/* Language Switcher */' not in content:
        content = content.replace("/* ── Page-specific overrides ─────────────────────────────────── */", "/* ── Page-specific overrides ─────────────────────────────────── */\n" + style_add)
    
    if "lang-switch" not in content:
        nav_orig = re.search(r'<div class="nav-links">.*?</div>', content, re.DOTALL)
        if nav_orig:
            # maintain nav-active
            nr = nav_replace
            if filename == 'pricing.html':
                nr = nr.replace('<a href="pricing.html">', '<a href="pricing.html" class="nav-active">').replace('<a href="anibal.html" class="nav-active">', '<a href="anibal.html">')
            elif filename == 'demo.html':
                nr = nr.replace('<a href="anibal.html" class="nav-active">', '<a href="anibal.html">')
            elif filename == 'terms.html':
                nr = nr.replace('<a href="anibal.html" class="nav-active">', '<a href="anibal.html">')
            
            content = content.replace(nav_orig.group(0), nr.strip())

        mobile_orig = re.search(r'<div class="mobile-menu" id="mobileMenu">.*?</div>', content, re.DOTALL)
        if mobile_orig:
            content = content.replace(mobile_orig.group(0), mobile_replace.strip())
            
        footer_orig = re.search(r'<footer class="footer">.*?</footer>', content, re.DOTALL)
        if footer_orig:
            content = content.replace(footer_orig.group(0), footer_replace.strip())
            
        if "function setLang" not in content:
            content = content.replace("lucide.createIcons();", "lucide.createIcons();\n" + js_add)
            
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Done patching.")
