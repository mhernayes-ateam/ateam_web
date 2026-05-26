/**
 * debug.js — Diagnóstico de la página de resultados de LinkedIn
 * 
 * USO:
 *   /usr/local/bin/node debug.js
 *
 * Genera:
 *   - debug_screenshot.png    → captura visual de la página
 *   - debug_page.html         → HTML completo tal como lo ve Playwright
 *   - debug_classes.txt       → todos los class names únicos encontrados
 */

require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  query:    process.env.SEARCH_QUERY || 'property manager Australia',
};

(async () => {
  console.log('\n🔍 LinkedIn Debug Tool — A-Team\n');

  const userDataDir = path.resolve('./browser-session');
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 40,
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  try {
    const encodedQuery = encodeURIComponent(CONFIG.query);
    const url = `https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}&origin=GLOBAL_SEARCH_HEADER`;

    console.log(`📡 Navegando a: ${url}\n`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Esperar que LinkedIn hidrate el JS
    console.log('⏳ Esperando 5 segundos para que LinkedIn cargue...');
    await new Promise(r => setTimeout(r, 5000));

    // Scroll para activar lazy loading
    await page.evaluate(async () => {
      window.scrollBy(0, 500);
      await new Promise(r => setTimeout(r, 1000));
      window.scrollBy(0, 500);
    });
    await new Promise(r => setTimeout(r, 2000));

    // ── 1. Screenshot ──────────────────────────────────────────
    const screenshotPath = path.resolve('debug_screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot guardado → ${screenshotPath}`);

    // ── 2. URL actual (detectar redirects) ────────────────────
    console.log(`\n🔗 URL actual: ${page.url()}`);

    // ── 3. Título de la página ─────────────────────────────────
    const title = await page.title();
    console.log(`📄 Título: ${title}`);

    // ── 4. Volcar HTML completo ────────────────────────────────
    const html = await page.content();
    const htmlPath = path.resolve('debug_page.html');
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`💾 HTML completo guardado → ${htmlPath} (${(html.length / 1024).toFixed(1)} KB)`);

    // ── 5. Todos los selectores candidatos ────────────────────
    console.log('\n📊 Conteo de selectores candidatos:');
    const candidates = [
      'li.reusable-search__result-container',
      'ul.reusable-search__entity-result-list > li',
      '[data-chameleon-result-urn]',
      '.entity-result',
      '.entity-result__item',
      '.search-results-container li',
      '.artdeco-list__item',
      '.search-marvel-srp__result-container',
      '.reusable-search__result-container',
      'ul[role="list"] > li',
      '.scaffold-layout__list-container li',
      '.search-results__list li',
      'main li',
    ];

    for (const sel of candidates) {
      const count = await page.$$eval(sel, els => els.length).catch(() => 0);
      const icon = count > 0 ? '✅' : '❌';
      console.log(`  ${icon} ${count.toString().padStart(3)}x  "${sel}"`);
    }

    // ── 6. Primeros 30 class names únicos del body ─────────────
    console.log('\n🏷  Primeros class names únicos en la página:');
    const classNames = await page.evaluate(() => {
      const all = document.querySelectorAll('[class]');
      const unique = new Set();
      all.forEach(el => {
        el.className.toString().split(/\s+/).forEach(c => {
          if (c && c.length > 2) unique.add(c);
        });
      });
      return [...unique].slice(0, 60);
    });
    classNames.forEach(cls => process.stdout.write(`  .${cls}\n`));

    const classPath = path.resolve('debug_classes.txt');
    fs.writeFileSync(classPath, classNames.map(c => `.${c}`).join('\n'), 'utf8');
    console.log(`\n💾 Classes guardadas → ${classPath}`);

    // ── 7. Detectar si hay un muro / login wall ────────────────
    console.log('\n🔐 Detectando posibles bloqueos:');
    const checks = {
      'Login wall (form de login visible)': 'form#login-form, #username',
      'Auth wall (checkpoint)':             '[data-test-id="content-sandbox"]',
      'Premium wall':                       '.premium-upsell-link, [data-control-name="upsell"]',
      'Feed (redirigido al home)':          '.feed-identity-module',
      'Resultado de búsqueda (ul list)':    '.search-results-container, .reusable-search-list',
    };
    for (const [label, sel] of Object.entries(checks)) {
      const found = await page.$(sel).catch(() => null);
      console.log(`  ${found ? '⚠️ ' : '  '} ${label}: ${found ? 'SÍ ENCONTRADO' : 'no'}`);
    }

    // ── 8. Texto visible en pantalla (primeros 800 chars) ──────
    console.log('\n📝 Texto visible en la página (primeros 800 caracteres):');
    const bodyText = await page.evaluate(() =>
      document.body.innerText?.slice(0, 800)?.replace(/\n+/g, '\n').trim()
    );
    console.log('─'.repeat(60));
    console.log(bodyText);
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Diagnóstico completo. Compartí el output arriba y debug_screenshot.png\n');
  }
})();
