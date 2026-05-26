/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║       LinkedIn B2B Prospecting Scraper — A-Team         ║
 * ║       Powered by Playwright (Stealth Mode)              ║
 * ╚══════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const { chromium } = require('playwright');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

// ── Colores de consola ───────────────────────────────────────
const c = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', cyan: '\x1b[36m', bold: '\x1b[1m',
};
const log  = (msg) => console.log(`${c.cyan}[INFO]${c.reset}  ${msg}`);
const ok   = (msg) => console.log(`${c.green}[OK]${c.reset}    ${msg}`);
const warn = (msg) => console.log(`${c.yellow}[WARN]${c.reset}  ${msg}`);
const err  = (msg) => console.log(`${c.red}[ERROR]${c.reset} ${msg}`);

// ── Config ───────────────────────────────────────────────────
const CONFIG = {
  email:      process.env.LINKEDIN_EMAIL    || '',
  password:   process.env.LINKEDIN_PASSWORD || '',
  query:      process.env.SEARCH_QUERY      || 'property manager Australia',
  maxLeads:   parseInt(process.env.MAX_LEADS || '50', 10),
  minDelay:   parseInt(process.env.MIN_DELAY_MS || '2000', 10),
  maxDelay:   parseInt(process.env.MAX_DELAY_MS || '4000', 10),
  outputFile: process.env.OUTPUT_FILE       || 'leads_output',
  mode:       process.env.SCRAPE_MODE       || 'search',
  debug:      process.env.DEBUG === 'true',
};

// ── Utilidades ───────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = () =>
  sleep(CONFIG.minDelay + Math.random() * (CONFIG.maxDelay - CONFIG.minDelay));

async function smoothScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, 250);
        total += 250;
        if (total >= document.body.scrollHeight) { clearInterval(timer); resolve(); }
      }, 100);
    });
  });
}

async function humanMove(page) {
  const x = 200 + Math.random() * 700;
  const y = 100 + Math.random() * 500;
  await page.mouse.move(x, y, { steps: 8 + Math.floor(Math.random() * 8) });
}

// ── Debug: vuelca selectores reales de la página ─────────────
async function debugPage(page, label) {
  if (!CONFIG.debug) return;
  const screenshotPath = path.resolve(`debug_${label}_${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  warn(`[DEBUG] Screenshot → ${screenshotPath}`);

  const info = await page.evaluate(() => {
    // Buscar todos los <li> con clases relevantes
    const lis = [...document.querySelectorAll('li')].slice(0, 5);
    return lis.map(li => ({
      classes: li.className,
      text: li.innerText?.slice(0, 80),
    }));
  });
  warn('[DEBUG] Primeros <li> encontrados:');
  info.forEach((item, i) => warn(`  [${i}] .${item.classes.replace(/\s+/g, '.')} → "${item.text}"`));

  // También dumpeamos todos los selectores candidatos
  const candidates = await page.evaluate(() => {
    const sels = [
      'li.reusable-search__result-container',
      '.search-results-container li',
      '[data-chameleon-result-urn]',
      '.entity-result',
      '.entity-result__item',
      '.search-marvel-srp__result-container',
      '.artdeco-list__item',
      'ul.reusable-search__entity-result-list > li',
    ];
    return sels.map(s => ({ sel: s, count: document.querySelectorAll(s).length }));
  });
  warn('[DEBUG] Conteo de selectores candidatos:');
  candidates.forEach(({ sel, count }) => warn(`  ${count > 0 ? '✅' : '❌'} ${count}x → "${sel}"`));
}

// ── Login ────────────────────────────────────────────────────
async function login(page) {
  log('Navegando al login de LinkedIn…');
  await page.goto('https://www.linkedin.com/login', {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await randomDelay();

  await page.fill('#username', '');
  for (const char of CONFIG.email) {
    await page.type('#username', char, { delay: 80 + Math.random() * 60 });
  }
  await randomDelay();

  await page.fill('#password', '');
  for (const char of CONFIG.password) {
    await page.type('#password', char, { delay: 90 + Math.random() * 70 });
  }
  await randomDelay();

  await page.click('button[type="submit"]');
  await page.waitForURL(/linkedin\.com\/feed|linkedin\.com\/checkpoint/, {
    timeout: 20000,
  });

  const url = page.url();
  if (url.includes('checkpoint') || url.includes('challenge')) {
    warn('LinkedIn solicitó verificación humana (CAPTCHA/2FA).');
    warn('Completá la verificación manualmente en el browser abierto.');
    warn('El scraper esperará hasta 120 segundos…');
    await page.waitForURL(/linkedin\.com\/feed/, { timeout: 120000 });
  }

  ok('Login exitoso ✓');
}

// ── Extraer datos del listitem real de LinkedIn 2025 ─────────
async function parseCard(cardEl) {
  return cardEl.evaluate((el) => {
    // El perfil siempre tiene un <a href="/in/..."> como wrapper o dentro del card
    const profileAnchor = el.querySelector('a[href*="/in/"]');
    const profileUrl    = profileAnchor ? profileAnchor.href.split('?')[0] : '';

    // Nombre: el primer <a> dentro del listitem que apunta a /in/
    // El texto del nombre está en el <a> directo, excluyendo íconos SVG
    let name = '';
    if (profileAnchor) {
      // Clonar para extraer solo texto sin SVG ni spans ocultos
      const clone = profileAnchor.cloneNode(true);
      clone.querySelectorAll('svg, [aria-hidden="true"]').forEach(n => n.remove());
      name = clone.innerText?.trim()?.replace(/\s+/g, ' ') || '';
      // A veces el anchor wrappea todo el card; extraer solo la primera línea
      name = name.split('\n')[0].trim();
    }

    // Si no encontramos nombre por esa ruta, buscar en el primer <p> del card
    if (!name || name.length > 80) {
      const firstP = el.querySelector('p');
      if (firstP) {
        const clone = firstP.cloneNode(true);
        clone.querySelectorAll('svg, span[role="img"]').forEach(n => n.remove());
        name = clone.innerText?.trim()?.split('\n')[0] || '';
      }
    }

    // Cargo y empresa: los <p> que vienen después del nombre
    // En el HTML real: hay 2-3 <p> dentro de los divs de texto
    const allP = [...el.querySelectorAll('p')];
    // El primero con "Miembro de LinkedIn" o nombre real
    // El segundo es el cargo/empresa
    // El tercero es ubicación
    const textPs = allP.map(p => {
      const clone = p.cloneNode(true);
      clone.querySelectorAll('svg, [aria-hidden="true"]').forEach(n => n.remove());
      return clone.innerText?.trim()?.replace(/\s+/g, ' ') || '';
    }).filter(t => t && t.length > 1 && !t.includes('contacto en común'));

    // Primero: nombre (ya lo tenemos)
    // Segundo: cargo
    const title    = textPs[1] || '';
    // Tercero: ubicación
    const location = textPs[2] || '';
    // Empresa: a veces está en el cargo como "Cargo at Empresa"
    let company = '';
    const atMatch = title.match(/ at (.+)$/) || title.match(/ en (.+)$/);
    if (atMatch) company = atMatch[1].trim();

    return {
      name:       name.replace(/\s+/g, ' ').trim(),
      title:      title.split(' at ')[0].split(' en ')[0].trim(),
      company,
      location,
      profileUrl,
      scrapedAt:  new Date().toISOString(),
    };
  });
}

// ── Detectar selector correcto dinámicamente ─────────────────
async function detectCardSelector(page) {
  // LinkedIn 2025: los resultados son div[role="listitem"] dentro de div[role="list"]
  // Solo tomamos los que contienen un enlace a /in/ (perfiles reales, no ads)
  const candidates = [
    'div[role="list"] > div > div[role="listitem"]',
    'div[role="listitem"]',
    'main li',
  ];

  for (const sel of candidates) {
    try {
      const count = await page.$$eval(sel, (els) =>
        els.filter(el => el.querySelector('a[href*="/in/"]')).length
      );
      if (count > 0) {
        ok(`Selector activo: "${sel}" (${count} elementos con /in/)`);
        return sel;
      }
    } catch {
      // no matchea
    }
  }
  return null;
}

// ── Scraping: Búsqueda de personas ──────────────────────────
async function scrapeSearch(page) {
  const leads = [];
  let currentPage = 1;
  const encodedQuery = encodeURIComponent(CONFIG.query);
  const baseUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}&origin=GLOBAL_SEARCH_HEADER`;

  log(`Buscando: "${CONFIG.query}" | Máx. ${CONFIG.maxLeads} leads`);

  while (leads.length < CONFIG.maxLeads) {
    const url = currentPage === 1 ? baseUrl : `${baseUrl}&page=${currentPage}`;

    log(`Página ${currentPage} → ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3500); // Esperar hidratación JS de LinkedIn
    await smoothScroll(page);
    await sleep(1500);

    // Debug si está activado
    await debugPage(page, `page${currentPage}`);

    // Detectar selector dinámicamente
    const cardSel = await detectCardSelector(page);
    if (!cardSel) {
      warn(`No se encontraron resultados en página ${currentPage}. Fin.`);
      warn('Tip: corré con DEBUG=true en .env para ver screenshot y selectores activos.');
      break;
    }

    const cards = await page.$$(cardSel);
    log(`Encontradas ${cards.length} tarjetas en pág. ${currentPage}`);

    let found = 0;
    for (const card of cards) {
      if (leads.length >= CONFIG.maxLeads) break;

      try {
        const lead = await parseCard(card);
        if (!lead.name || !lead.profileUrl) continue;

        // Evitar duplicados
        if (leads.some(l => l.profileUrl === lead.profileUrl)) continue;

        leads.push(lead);
        found++;
        ok(`[${leads.length}/${CONFIG.maxLeads}] ${lead.name} — ${lead.title} @ ${lead.company}`);
        await humanMove(page);
        await sleep(200 + Math.random() * 400);
      } catch (e) {
        warn(`Error parseando tarjeta: ${e.message}`);
      }
    }

    if (found === 0) {
      warn(`Página ${currentPage}: tarjetas encontradas pero sin datos extraíbles.`);
    }

    // Paginación — selector exacto del HTML real de LinkedIn 2025
    const nextBtn = await page.$('button[data-testid="pagination-controls-next-button-visible"]') ||
                    await page.$('button[aria-label="Siguiente"]') ||
                    await page.$('button[aria-label="Next"]');

    if (!nextBtn || leads.length >= CONFIG.maxLeads) {
      log('Fin de resultados.');
      break;
    }

    await nextBtn.click();
    await sleep(2000);
    currentPage++;
    await randomDelay();
  }

  return leads;
}

// ── Scraping: Empleados de empresa ──────────────────────────
async function scrapeCompanyEmployees(page) {
  const leads = [];
  const companySlug = CONFIG.query.replace(/\s+/g, '-').toLowerCase();
  const url = `https://www.linkedin.com/company/${companySlug}/people/`;

  log(`Scrapeando empleados: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await smoothScroll(page);

  const cards = await page.$$('.org-people-profile-card, .artdeco-entity-lockup');
  log(`Encontradas ${cards.length} tarjetas de empleados`);

  for (const card of cards) {
    if (leads.length >= CONFIG.maxLeads) break;
    try {
      const lead = await card.evaluate((el) => {
        const qt = (s) => el.querySelector(s)?.innerText?.trim() || '';
        const anchor = el.querySelector('a[href*="/in/"]') || el.querySelector('a.app-aware-link');
        return {
          name: qt('.org-people-profile-card__profile-title') || qt('.artdeco-entity-lockup__title') || qt('span[aria-hidden="true"]'),
          title: qt('.lt-line-clamp--multi-line') || qt('.artdeco-entity-lockup__subtitle'),
          company: '',
          location: '',
          profileUrl: anchor ? anchor.href.split('?')[0] : '',
          scrapedAt: new Date().toISOString(),
        };
      });
      if (!lead.name) continue;
      leads.push(lead);
      ok(`[${leads.length}] ${lead.name} — ${lead.title}`);
    } catch (e) {
      warn(`Error: ${e.message}`);
    }
  }
  return leads;
}

// ── Enriquecer perfil ────────────────────────────────────────
async function enrichLead(page, lead) {
  if (!lead.profileUrl?.includes('linkedin.com/in/')) return lead;
  try {
    await page.goto(lead.profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2000);
    const enriched = await page.evaluate(() => {
      const email = [...document.querySelectorAll('a[href^="mailto:"]')]
        .map(a => a.href.replace('mailto:', '')).join(', ');
      const followers =
        document.querySelector('.pv-header--connection-count-badge')?.innerText?.trim() ||
        document.querySelector('.pvs-header__subtitle')?.innerText?.trim() || '';
      return { email, followers };
    });
    return { ...lead, ...enriched };
  } catch (e) {
    warn(`No se pudo enriquecer: ${lead.name} — ${e.message}`);
    return lead;
  }
}

// ── Guardar resultados ───────────────────────────────────────
async function saveResults(leads) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseName  = `${CONFIG.outputFile}_${timestamp}`;
  const csvPath   = path.resolve(baseName + '.csv');
  const jsonPath  = path.resolve(baseName + '.json');

  fs.writeFileSync(jsonPath, JSON.stringify(leads, null, 2), 'utf8');
  ok(`JSON guardado → ${jsonPath}`);

  const writer = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'name',        title: 'Nombre'       },
      { id: 'title',       title: 'Cargo'        },
      { id: 'company',     title: 'Empresa'      },
      { id: 'location',    title: 'Ubicación'    },
      { id: 'email',       title: 'Email'        },
      { id: 'profileUrl',  title: 'LinkedIn URL' },
      { id: 'followers',   title: 'Seguidores'   },
      { id: 'scrapedAt',   title: 'Fecha Scrape' },
    ],
  });
  await writer.writeRecords(leads);
  ok(`CSV guardado → ${csvPath}`);
  return { csvPath, jsonPath };
}

// ── Entry Point ──────────────────────────────────────────────
(async () => {
  console.log(`\n${c.bold}${c.cyan}══════════════════════════════════════════${c.reset}`);
  console.log(`${c.bold}${c.cyan}   LinkedIn Scraper — A-Team Prospecting  ${c.reset}`);
  console.log(`${c.bold}${c.cyan}══════════════════════════════════════════${c.reset}\n`);

  if (!CONFIG.email || !CONFIG.password) {
    err('Faltan credenciales en .env (LINKEDIN_EMAIL / LINKEDIN_PASSWORD)');
    process.exit(1);
  }

  if (CONFIG.debug) warn('[DEBUG] Modo debug activado — se generarán screenshots');

  const userDataDir = path.resolve('./browser-session');
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 40,
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'Australia/Sydney',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const page = await browser.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins',   { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    window.chrome = { runtime: {} };
  });

  try {
    // ── Verificar sesión existente ──────────────────────────
    await page.goto('https://www.linkedin.com/feed', {
      waitUntil: 'domcontentloaded', timeout: 20000,
    }).catch(() => {});
    await sleep(2000);

    const isLoggedIn = page.url().includes('/feed');
    if (!isLoggedIn) {
      await login(page);
    } else {
      ok('Sesión ya activa (perfil guardado) ✓');
    }

    await randomDelay();

    // ── Scraping ────────────────────────────────────────────
    let leads = [];
    if (CONFIG.mode === 'company') {
      leads = await scrapeCompanyEmployees(page);
    } else {
      leads = await scrapeSearch(page);
    }

    if (leads.length === 0) {
      warn('No se encontraron leads.');
      warn('→ Corré con DEBUG=true en el .env para ver qué está pasando en el browser.');
    } else {
      log(`\nEnriqueciendo ${leads.length} perfiles…`);
      for (let i = 0; i < leads.length; i++) {
        log(`Enriqueciendo [${i + 1}/${leads.length}]: ${leads[i].name}`);
        leads[i] = await enrichLead(page, leads[i]);
        await randomDelay();
      }

      const paths = await saveResults(leads);
      console.log(`\n${c.bold}${c.green}════════════════════════════════════════${c.reset}`);
      console.log(`${c.bold}${c.green}  ✓ Scraping completado: ${leads.length} leads  ${c.reset}`);
      console.log(`${c.bold}${c.green}  CSV  → ${paths.csvPath}${c.reset}`);
      console.log(`${c.bold}${c.green}  JSON → ${paths.jsonPath}${c.reset}`);
      console.log(`${c.bold}${c.green}════════════════════════════════════════${c.reset}\n`);
    }
  } catch (error) {
    err(`Error fatal: ${error.message}`);
    console.error(error);
  } finally {
    await browser.close();
  }
})();
