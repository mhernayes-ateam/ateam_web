# LinkedIn B2B Scraper — A-Team 🚀

Extrae leads de LinkedIn (nombre, cargo, empresa, ubicación, email visible, URL de perfil) y los exporta como **CSV + JSON** listos para importar a Google Sheets o tu CRM.

---

## Instalación

```bash
cd linkedin-scraper

# Instalar dependencias
/usr/local/bin/npm install

# Instalar Chromium (solo primera vez)
/usr/local/bin/npx playwright install chromium
```

---

## Configuración

```bash
cp .env.example .env
```

Editá `.env` con tus datos:

| Variable | Descripción |
|---|---|
| `LINKEDIN_EMAIL` | Tu email de LinkedIn |
| `LINKEDIN_PASSWORD` | Tu contraseña |
| `SEARCH_QUERY` | Query de búsqueda, ej: `property manager Sydney` |
| `MAX_LEADS` | Cuántos leads extraer (default: 50) |
| `SCRAPE_MODE` | `search` (personas) o `company` (empleados de empresa) |
| `OUTPUT_FILE` | Nombre base del archivo de salida |

---

## Uso

```bash
/usr/local/bin/node scraper.js
```

El browser se abre en modo **visible** para que puedas resolver CAPTCHAs manualmente si LinkedIn los solicita. La sesión se guarda en `./browser-session/` para no tener que loguearte cada vez.

---

## Output

Genera dos archivos con timestamp:
- `leads_output_2026-05-21T16-00-00.csv` → Para importar a Google Sheets
- `leads_output_2026-05-21T16-00-00.json` → Para usar en n8n o pipelines

Columnas del CSV:

| Nombre | Cargo | Empresa | Ubicación | Email | LinkedIn URL | Seguidores | Conexiones | Fecha Scrape |

---

## Modos de Scraping

### Modo `search` (default)
Busca personas por keywords. Ideal para prospección B2B amplia.
```
SEARCH_QUERY=property manager Melbourne
SCRAPE_MODE=search
```

### Modo `company`
Extrae empleados de una empresa específica.
```
SEARCH_QUERY=real-estate-company-name
SCRAPE_MODE=company
```

---

## Anti-detección

El scraper implementa:
- ✅ `headless: false` — navegador visible, no detectado como bot
- ✅ User-Agent de Chrome real en macOS
- ✅ Delays aleatorios entre acciones (1.5–3.5 seg)
- ✅ Scroll suave simulando lectura humana
- ✅ Movimientos de mouse aleatorios
- ✅ Perfil de browser persistente (evita re-login)
- ✅ `navigator.webdriver = false`

---

## ⚠️ Notas legales

- Usá con una cuenta de LinkedIn secundaria/dedicada para prospección
- LinkedIn puede bloquear cuentas que hagan scraping masivo
- Mantené `MAX_LEADS` bajo (< 100/día) para evitar bans
- Los Términos de Servicio de LinkedIn prohíben el scraping automático

---

## Integración con n8n

El JSON de salida puede consumirse directamente desde n8n:
1. **Read Binary File** → lee el `.json`
2. **JSON Parse** → extrae el array de leads  
3. **Google Sheets** → inserta en tu hoja de prospección
4. **HTTP Request** → envía a tu CRM o a ManyChat
