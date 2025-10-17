// =======================================================================
// === UTILITIES - BACKUP FRONTEND ===
// =======================================================================

import { CONFIG } from './config.js';
import { showNotification } from './utils.js';

/**
 * Inizializza la tab Utilities
 */
export function initUtilities() {
    console.log('✅ Utilities module inizializzato');
}

/**
 * Scarica backup completo frontend come ZIP
 */
window.downloadFrontendBackup = async function() {
    try {
        showNotification('⏳ Creazione backup ZIP del frontend...', 'info');
        
        // Crea ZIP
        const zip = new JSZip();
        
        // ===== 1. FILE HTML =====
        const htmlResponse = await fetch('index.html');
        const htmlContent = await htmlResponse.text();
        zip.file('index.html', htmlContent);
        
        // ===== 2. MANIFEST =====
        try {
            const manifestResponse = await fetch('manifest.json');
            const manifestContent = await manifestResponse.text();
            zip.file('manifest.json', manifestContent);
        } catch(e) {
            console.log('manifest.json non trovato');
        }
        
        // ===== 3. CSS =====
        const cssFolder = zip.folder('css');
        const cssFiles = [
            'main.css',
            'tabs.css',
            'forms.css',
            'tables.css',
            'modals.css',
            'utilities.css'
        ];
        
        for (const file of cssFiles) {
            try {
                const response = await fetch(`css/${file}`);
                const content = await response.text();
                cssFolder.file(file, content);
            } catch(e) {
                console.log(`css/${file} non trovato`);
            }
        }
        
        // ===== 4. JAVASCRIPT =====
        const jsFolder = zip.folder('js');
        const jsFiles = [
            'config.js',
            'main.js',
            'api.js',
            'timesheet.js',
            'proforma.js',
            'utilities.js',
            'utils.js'
        ];
        
        for (const file of jsFiles) {
            try {
                const response = await fetch(`js/${file}`);
                const content = await response.text();
                jsFolder.file(file, content);
            } catch(e) {
                console.log(`js/${file} non trovato`);
            }
        }
        
        // ===== 5. ASSETS (ICONE) =====
        const assetsFiles = [
            'favicon.ico',
            'favicon.svg',
            'favicon-96x96.png',
            'apple-touch-icon.png',
            'web-app-manifest-192x192.png',
            'web-app-manifest-512x512.png'
        ];
        
        for (const file of assetsFiles) {
            try {
                const response = await fetch(file);
                const blob = await response.blob();
                zip.file(file, blob);
            } catch(e) {
                console.log(`${file} non trovato - ignorato`);
            }
        }
        
        // ===== 6. README =====
        const readmeContent = `
═══════════════════════════════════════════════════════
CRM STUDIO SMART - BACKUP FRONTEND
═══════════════════════════════════════════════════════

Data backup: ${new Date().toLocaleString('it-IT')}
Versione: ${CONFIG.VERSION}

CONTENUTO:
├── index.html                  Pagina principale
├── manifest.json              Configurazione PWA
├── css/                       Fogli di stile (6 files)
│   ├── main.css
│   ├── tabs.css
│   ├── forms.css
│   ├── tables.css
│   ├── modals.css
│   └── utilities.css
├── js/                        JavaScript modulare (7 files)
│   ├── config.js             ⚠️ Contiene URL Apps Script
│   ├── main.js
│   ├── api.js
│   ├── timesheet.js
│   ├── proforma.js
│   ├── utilities.js
│   └── utils.js
├── [assets]                   Icone e risorse
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png
│   └── web-app-manifest-512x512.png
└── README.txt                 Questo file

═══════════════════════════════════════════════════════
RIPRISTINO
═══════════════════════════════════════════════════════

1. Estrai tutti i file da questo ZIP
2. Carica su GitHub Pages o hosting web
3. Verifica che js/config.js contenga l'URL corretto di Apps Script
4. Apri index.html nel browser

CONFIGURAZIONE:
Se il backend (Apps Script) è cambiato, aggiorna:
js/config.js → CONFIG.APPS_SCRIPT_URL

TEST LOCALE:
python3 -m http.server 8000
Poi apri: http://localhost:8000

═══════════════════════════════════════════════════════
BACKEND (NON INCLUSO)
═══════════════════════════════════════════════════════

Questo backup contiene SOLO il frontend.

Per salvare il backend (Apps Script):
1. Apri script.google.com
2. Trova il progetto CRM
3. Copia manualmente ogni file .gs in file di testo

File backend da salvare separatamente:
- config.gs
- helpers.gs (o clienti.gs)
- pacchetti.gs
- timesheet.gs
- proforma.gs
- email.gs
- codice.gs
- utilities.gs

═══════════════════════════════════════════════════════
CONFIGURAZIONE CORRENTE
═══════════════════════════════════════════════════════

Apps Script URL: ${CONFIG.APPS_SCRIPT_URL}
App Name: ${CONFIG.APP_NAME}
Versione: ${CONFIG.VERSION}
Backup Timestamp: ${new Date().toISOString()}

═══════════════════════════════════════════════════════
SUPPORTO
═══════════════════════════════════════════════════════

Email: info@studio-smart.it
Tel: +39 3487429976
        `.trim();
        
        zip.file('README.txt', readmeContent);
        
        // ===== 7. GENERA E SCARICA ZIP =====
        showNotification('📦 Compressione file...', 'info');
        
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `CRM_Frontend_${timestamp}.zip`;
        
        const downloadUrl = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        showNotification('✅ Backup frontend scaricato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore backup frontend:', error);
        showNotification('❌ Errore: ' + error.message, 'error');
    }
};

console.log('✅ Utilities module caricato');
