import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Language Switcher Styles and JS
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
        body.lang-en div[data-lang="en"] {
            display: block;
        }
"""
if "/* Language Switcher */" not in content:
    content = content.replace("/* ── Page-specific overrides ─────────────────────────────────── */", "/* ── Page-specific overrides ─────────────────────────────────── */\n" + style_add)

# 2. Nav and Mobile Nav
nav_orig = re.search(r'<div class="nav-links">.*?</div>', content, re.DOTALL).group(0)
if "lang-switch" not in nav_orig:
    nav_replace = """
            <div class="nav-links">
                <a href="index.html" class="nav-active"><span data-lang="es">Inicio</span><span data-lang="en">Home</span></a>
                <a href="anibal.html">Anibal</a>
                <a href="pricing.html"><span data-lang="es">Precios</span><span data-lang="en">Pricing</span></a>
                <a href="demo.html" class="btn btn-primary"><span data-lang="es">Agendar Demo →</span><span data-lang="en">Book a Demo →</span></a>
                
                <div class="lang-switch">
                    <button class="lang-btn active" onclick="setLang('es')" title="Español">🇦🇷</button>
                    <button class="lang-btn" onclick="setLang('en')" title="English">🇺🇸</button>
                </div>
            </div>
    """
    content = content.replace(nav_orig, nav_replace.strip())

mobile_orig = re.search(r'<div class="mobile-menu" id="mobileMenu">.*?</div>', content, re.DOTALL).group(0)
if "lang-switch" not in mobile_orig:
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
    content = content.replace(mobile_orig, mobile_replace.strip())

# 3. JS function
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
            
            // Swap images
            const heroDesktop = document.querySelector('source[media="(min-width: 769px)"]');
            const heroMobile = document.querySelector('source[media="(max-width: 768px)"]');
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
        }
"""
if "function setLang" not in content:
    content = content.replace("lucide.createIcons();", "lucide.createIcons();\n" + js_add)

# 4. Hero replacements
replacements = [
    ('<p class="manifesto-label" style="margin-bottom:1.25rem;">Agentic AI · 2026</p>', 
     '<p class="manifesto-label" style="margin-bottom:1.25rem;" data-lang="es">IA Agéntica · 2026</p><p class="manifesto-label" style="margin-bottom:1.25rem;" data-lang="en">Agentic AI · 2026</p>'),
    ('Your business,<br>run by <em>AI agents</em><br>that actually work.', 
     '<span data-lang="es">Tu negocio,<br>operado por <em>agentes de IA</em><br>que realmente funcionan.</span><span data-lang="en">Your business,<br>run by <em>AI agents</em><br>that actually work.</span>'),
    ('We build agents that don\'t suggest — they <strong>execute</strong>.<br>\n                    Each agent owns an operational role. You get your time back.', 
     '<span data-lang="es">Construimos agentes que no sugieren — <strong>ejecutan</strong>.<br>Cada agente asume un rol operativo. Recuperá tu tiempo.</span><span data-lang="en">We build agents that don\'t suggest — they <strong>execute</strong>.<br>Each agent owns an operational role. You get your time back.</span>'),
    ('>Meet Anibal →<', '><span data-lang="es">Conocer a Aníbal →</span><span data-lang="en">Meet Anibal →</span><'),
    ('>Book a Demo<', '><span data-lang="es">Agendar Demo</span><span data-lang="en">Book a Demo</span><'),
    ('srcset="hero-banner-mobile.jpeg"', 'srcset="hero-banner-mobile-es.jpeg"'),
    ('srcset="hero-banner.jpeg"', 'srcset="hero-banner-es.jpeg"'),
    ('src="hero-banner.jpeg"', 'src="hero-banner-es.jpeg"'),
    ('<span>Scroll</span>', '<span data-lang="es">Deslizar</span><span data-lang="en">Scroll</span>')
]

for old, new in replacements:
    content = content.replace(old, new)

# 5. Manifesto Section
replacements_manifesto = [
    ('>Our story<', '><span data-lang="es">Nuestra historia</span><span data-lang="en">Our story</span><'),
    ('Built for the work<br>nobody wants to <em>do.</em>', '<span data-lang="es">Hecho para el trabajo<br>que nadie quiere <em>hacer.</em></span><span data-lang="en">Built for the work<br>nobody wants to <em>do.</em></span>'),
    ('<p>SMBs in Latin America don\'t need more dashboards. They need someone — or something — to\n                            actually do the work.</p>', '<p data-lang="es">Las PyMEs en Latinoamérica no necesitan más paneles de control. Necesitan a alguien —o algo— que realmente haga el trabajo.</p><p data-lang="en">SMBs in Latin America don\'t need more dashboards. They need someone — or something — to actually do the work.</p>'),
    ('<p>Large companies have entire teams for collections, reconciliation, support, and operations.\n                            SMBs don\'t. And traditional SaaS just gives you another screen to manage.</p>', '<p data-lang="es">Las grandes empresas tienen equipos enteros para cobranzas, conciliación, soporte y operaciones. Las PyMEs no. Y el SaaS tradicional solo te da otra pantalla para gestionar.</p><p data-lang="en">Large companies have entire teams for collections, reconciliation, support, and operations. SMBs don\'t. And traditional SaaS just gives you another screen to manage.</p>'),
    ('<p>We build agents that aren\'t another app. They\'re coworkers that own the tasks nobody wants to\n                            do — so you can focus on the work that only you can do.</p>', '<p data-lang="es">Construimos agentes que no son una aplicación más. Son compañeros de trabajo que se hacen cargo de las tareas que nadie quiere hacer, para que puedas enfocarte en el trabajo que solo vos podés hacer.</p><p data-lang="en">We build agents that aren\'t another app. They\'re coworkers that own the tasks nobody wants to do — so you can focus on the work that only you can do.</p>'),
    ('Without an agent', '<span data-lang="es">Sin un agente</span><span data-lang="en">Without an agent</span>'),
    ('With A-Team', '<span data-lang="es">Con A-Team</span><span data-lang="en">With A-Team</span>'),
    ('Manual reminders', '<span data-lang="es">Recordatorios manuales</span><span data-lang="en">Manual reminders</span>'),
    ('Automatic, every time', '<span data-lang="es">Automático, siempre</span><span data-lang="en">Automatic, every time</span>'),
    ('Forgotten follow-ups', '<span data-lang="es">Seguimientos olvidados</span><span data-lang="en">Forgotten follow-ups</span>'),
    ('WhatsApp sequences run themselves', '<span data-lang="es">Las secuencias de WhatsApp se ejecutan solas</span><span data-lang="en">WhatsApp sequences run themselves</span>'),
    ('Spreadsheet\n                            reconciliation', '<span data-lang="es">Conciliación en hojas de cálculo</span><span data-lang="en">Spreadsheet reconciliation</span>'),
    ('Instant reconciliation', '<span data-lang="es">Conciliación instantánea</span><span data-lang="en">Instant reconciliation</span>'),
    ('No real-time\n                            visibility', '<span data-lang="es">Sin visibilidad en tiempo real</span><span data-lang="en">No real-time visibility</span>'),
    ('Real-time dashboard', '<span data-lang="es">Panel en tiempo real</span><span data-lang="en">Real-time dashboard</span>'),
    ('Scale = hire more\n                            people', '<span data-lang="es">Escalar = contratar más personas</span><span data-lang="en">Scale = hire more people</span>'),
    ('Scale = add an agent', '<span data-lang="es">Escalar = sumar un agente</span><span data-lang="en">Scale = add an agent</span>')
]

for old, new in replacements_manifesto:
    content = content.replace(old, new)


# 6. Agents section heading
agents_heading = [
    ('>Agents<', '><span data-lang="es">Agentes</span><span data-lang="en">Agents</span><'),
    ('One team. Many agents.<br><span class="text-gradient">Zero headcount.</span>', '<span data-lang="es">Un equipo. Varios agentes.<br><span class="text-gradient">Cero empleados.</span></span><span data-lang="en">One team. Many agents.<br><span class="text-gradient">Zero headcount.</span></span>'),
    ('<p>Each agent owns a specific operational role. They don\'t suggest — they do the work.</p>', '<p data-lang="es">Cada agente asume un rol operativo específico. No sugieren, hacen el trabajo.</p><p data-lang="en">Each agent owns a specific operational role. They don\'t suggest — they do the work.</p>')
]
for old, new in agents_heading:
    content = content.replace(old, new)

# 7. Agents Cards replacement
agents_orig = re.search(r'<div class="agents-roster">.*?</div>\s*</div>\s*</section>', content, re.DOTALL)
if agents_orig:
    agents_html = """
            <div class="agents-roster">
                <!-- Anibal — Live -->
                <div class="agent-card live stagger-fade">
                    <div class="agent-status live-badge"><span data-lang="es">Activo ahora</span><span data-lang="en">Live now</span></div>
                    <div class="agent-icon">
                        <i data-lucide="landmark"></i>
                    </div>
                    <p class="agent-role"><span data-lang="es">Agente de Cobranzas</span><span data-lang="en">Collections Agent</span></p>
                    <h3>Anibal</h3>
                    <p data-lang="es">Automatiza todo el ciclo de cobranza vía WhatsApp: mensajes, seguimientos y conciliación de pagos. Sin trabajo manual, sin facturas sin cobrar.</p>
                    <p data-lang="en">Automates the full collections cycle via WhatsApp — messages, follow-ups, payment reconciliation. No manual work, no missed invoices.</p>
                    <a href="anibal.html" class="agent-link">
                        <span data-lang="es">Conocer a Anibal</span><span data-lang="en">Meet Anibal</span> <i data-lucide="arrow-right"></i>
                    </a>
                </div>

                <!-- Reporte -->
                <div class="agent-card stagger-fade">
                    <div class="agent-status coming-badge"><span data-lang="es">Próximamente</span><span data-lang="en">Coming soon</span></div>
                    <div class="agent-icon" style="background:rgba(139,92,246,0.08);color:var(--secondary);">
                        <i data-lucide="bar-chart-2"></i>
                    </div>
                    <p class="agent-role" style="color:var(--secondary);"><span data-lang="es">Agente de Reportes</span><span data-lang="en">Reporting Agent</span></p>
                    <h3>Reporte</h3>
                    <p data-lang="es">Respondé consultas sobre KPIs, métricas y el estado de los demás agentes en tiempo real desde WhatsApp.</p>
                    <p data-lang="en">Answers queries about KPIs, metrics, and the status of other agents in real-time from WhatsApp.</p>
                </div>

                <!-- Ventas -->
                <div class="agent-card stagger-fade">
                    <div class="agent-status coming-badge"><span data-lang="es">Próximamente</span><span data-lang="en">Coming soon</span></div>
                    <div class="agent-icon" style="background:rgba(236,72,153,0.08);color:var(--accent);">
                        <i data-lucide="message-square"></i>
                    </div>
                    <p class="agent-role" style="color:var(--accent);"><span data-lang="es">Agente de Ventas</span><span data-lang="en">Sales Agent</span></p>
                    <h3>Ventas</h3>
                    <p data-lang="es">Responde preguntas frecuentes, califica leads automáticamente y te ayuda a cerrar más ventas sin incrementar el personal.</p>
                    <p data-lang="en">Answers FAQs, automatically qualifies leads, and helps you close more deals without adding headcount.</p>
                </div>
                
                <!-- Agendador -->
                <div class="agent-card stagger-fade">
                    <div class="agent-status coming-badge"><span data-lang="es">Próximamente</span><span data-lang="en">Coming soon</span></div>
                    <div class="agent-icon" style="background:rgba(56, 182, 255, 0.08);color:#38B6FF;">
                        <i data-lucide="calendar"></i>
                    </div>
                    <p class="agent-role" style="color:#38B6FF;"><span data-lang="es">Agente Agendador</span><span data-lang="en">Scheduling Agent</span></p>
                    <h3>Agendador</h3>
                    <p data-lang="es">Coordina reuniones, turnos y llamadas directamente con tus clientes sincronizando con tu calendario.</p>
                    <p data-lang="en">Coordinates meetings, appointments, and calls directly with your clients by syncing with your calendar.</p>
                </div>
            </div>
        </div>
    </section>
"""
    content = content.replace(agents_orig.group(0), agents_html.strip())
    
    # CSS Adjust for 4 agents grid
    if "grid-template-columns: repeat(3, 1fr);" in content:
        content = content.replace("grid-template-columns: repeat(3, 1fr);", "grid-template-columns: repeat(2, 1fr);")

# 8. Vision / Principles
vision = [
    ('>How we think<', '><span data-lang="es">Cómo pensamos</span><span data-lang="en">How we think</span><'),
    ('Not another SaaS.<br><span class="text-gradient">Decision infrastructure.</span>', '<span data-lang="es">No otro SaaS.<br><span class="text-gradient">Infraestructura de decisiones.</span></span><span data-lang="en">Not another SaaS.<br><span class="text-gradient">Decision infrastructure.</span></span>'),
    ('<p>A-Team sits above tools and SaaS. Closer to infrastructure — the layer that runs the work so you\n                    don\'t have to.</p>', '<p data-lang="es">A-Team se ubica por encima de las herramientas y el SaaS. Más cerca de la infraestructura: la capa que hace el trabajo para que vos no tengas que hacerlo.</p><p data-lang="en">A-Team sits above tools and SaaS. Closer to infrastructure — the layer that runs the work so you don\'t have to.</p>'),
    ('<h4>Real work, not dashboards</h4>', '<h4><span data-lang="es">Trabajo real, no paneles de control</span><span data-lang="en">Real work, not dashboards</span></h4>'),
    ('<p>If it doesn\'t execute, it\'s not A-Team. We don\'t add another screen to manage. We remove the work\n                        that was never yours to do.</p>', '<p data-lang="es">Si no ejecuta, no es A-Team. No sumamos otra pantalla para gestionar. Eliminamos el trabajo que nunca te correspondió hacer.</p><p data-lang="en">If it doesn\'t execute, it\'s not A-Team. We don\'t add another screen to manage. We remove the work that was never yours to do.</p>'),
    ('<h4>Autonomy with auditability</h4>', '<h4><span data-lang="es">Autonomía con auditabilidad</span><span data-lang="en">Autonomy with auditability</span></h4>'),
    ('<p>Agents act on their own. Every decision is logged, traceable, and explainable. You stay informed\n                        without being involved.</p>', '<p data-lang="es">Los agentes actúan por su cuenta. Cada decisión se registra, es rastreable y explicable. Te mantenés informado sin tener que involucrarte.</p><p data-lang="en">Agents act on their own. Every decision is logged, traceable, and explainable. You stay informed without being involved.</p>'),
    ('<h4>Humans approve. Agents execute.</h4>', '<h4><span data-lang="es">Los humanos aprueban. Los agentes ejecutan.</span><span data-lang="en">Humans approve. Agents execute.</span></h4>'),
    ('<p>Agents never move money, modify contracts, or make irreversible decisions. Critical control stays\n                        with you.</p>', '<p data-lang="es">Los agentes nunca mueven dinero, modifican contratos ni toman decisiones irreversibles. El control crítico sigue siendo tuyo.</p><p data-lang="en">Agents never move money, modify contracts, or make irreversible decisions. Critical control stays with you.</p>'),
    ('<h4>Industry-first design</h4>', '<h4><span data-lang="es">Diseño centrado en la industria</span><span data-lang="en">Industry-first design</span></h4>'),
    ('<p>Every agent speaks the language of its sector. No generic bots — purpose-built systems for real\n                        operational contexts.</p>', '<p data-lang="es">Cada agente habla el idioma de su sector. Nada de bots genéricos: sistemas diseñados específicamente para contextos operativos reales.</p><p data-lang="en">Every agent speaks the language of its sector. No generic bots — purpose-built systems for real operational contexts.</p>')
]

for old, new in vision:
    content = content.replace(old, new)


# 9. Bottom CTA
bottom = [
    ('Start with one agent.<br>Build your team.', '<span data-lang="es">Empezá con un agente.<br>Construí tu equipo.</span><span data-lang="en">Start with one agent.<br>Build your team.</span>'),
    ('<p>Anibal is live. Book a 15-minute demo and see how it handles your specific operation — with your real\n                    data.</p>', '<p data-lang="es">Aníbal está activo. Agendá una demo de 15 minutos y mirá cómo maneja tu operación específica, con tus datos reales.</p><p data-lang="en">Anibal is live. Book a 15-minute demo and see how it handles your specific operation — with your real data.</p>'),
    ('>See Anibal<', '><span data-lang="es">Ver a Anibal</span><span data-lang="en">See Anibal</span><')
]

for old, new in bottom:
    content = content.replace(old, new)

# 10. Footer
footer = [
    ('Clever agents. Easy living.<br>© 2026 A-Team. All rights reserved.', '<span data-lang="es">Agentes inteligentes. Vida simple.<br>© 2026 A-Team. Todos los derechos reservados.</span><span data-lang="en">Clever agents. Easy living.<br>© 2026 A-Team. All rights reserved.</span>'),
    ('>Agents<', '><span data-lang="es">Agentes</span><span data-lang="en">Agents</span><'),
    ('>Anibal — Collections<', '><span data-lang="es">Anibal — Cobranzas</span><span data-lang="en">Anibal — Collections</span><'),
    ('>Sales Agent (soon)<', '><span data-lang="es">Agente de Ventas (pronto)</span><span data-lang="en">Sales Agent (soon)</span><'),
    ('>Support Agent (soon)<', '><span data-lang="es">Agente de Reportes (pronto)</span><span data-lang="en">Reporting Agent (soon)</span><'),
    ('>Company<', '><span data-lang="es">Compañía</span><span data-lang="en">Company</span><'),
    ('>About A-Team<', '><span data-lang="es">Sobre A-Team</span><span data-lang="en">About A-Team</span><'),
    ('>Legal<', '><span data-lang="es">Legales</span><span data-lang="en">Legal</span><'),
    ('>Terms &amp; Conditions<', '><span data-lang="es">Términos y Condiciones</span><span data-lang="en">Terms &amp; Conditions</span><')
]
for old, new in footer:
    content = content.replace(old, new)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

