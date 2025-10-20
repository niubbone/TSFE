// =======================================================================
// === UTILITIES - GESTIONE BACKUP, LOG E DIAGNOSTICA ===
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
        showNotification('info-box', '⏳ Creazione backup ZIP del frontend...', 'info');
        
        const zip = new JSZip();
        
        // 1. HTML
        const htmlResponse = await fetch('index.html');
        const htmlContent = await htmlResponse.text();
        zip.file('index.html', htmlContent);
        
        // 2. MANIFEST
        try {
            const manifestResponse = await fetch('manifest.json');
            const manifestContent = await manifestResponse.text();
            zip.file('manifest.json', manifestContent);
        } catch(e) {
            console.log('manifest.json non trovato');
        }
        
        // 3. CSS
        const cssFolder = zip.folder('css');
        const cssFiles = ['main.css', 'tabs.css', 'forms.css', 'tables.css', 'modals.css', 'utilities.css'];
        
        for (const file of cssFiles) {
            try {
                const response = await fetch(`css/${file}`);
                const content = await response.text();
                cssFolder.file(file, content);
            } catch(e) {
                console.log(`css/${file} non trovato`);
            }
        }
        
        // 4. JAVASCRIPT
        const jsFolder = zip.folder('js');
        const jsFiles = ['config.js', 'main.js', 'api.js', 'timesheet.js', 'proforma.js', 'utilities.js', 'utils.js'];
        
        for (const file of jsFiles) {
            try {
                const response = await fetch(`js/${file}`);
                const content = await response.text();
                jsFolder.file(file, content);
            } catch(e) {
                console.log(`js/${file} non trovato`);
            }
        }
        
        // 5. ASSETS
        const assetsFiles = [
            'favicon.ico', 'favicon.svg', 'favicon-96x96.png',
            'apple-touch-icon.png', 'web-app-manifest-192x192.png', 'web-app-manifest-512x512.png'
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
        
        // 6. README
        const readmeContent = `
═══════════════════════════════════════════════════════
CRM STUDIO SMART - BACKUP FRONTEND
═══════════════════════════════════════════════════════

Data backup: ${new Date().toLocaleString('it-IT')}
Versione: ${CONFIG.VERSION}

CONTENUTO:
├── index.html
├── manifest.json
├── css/ (6 files)
├── js/ (7 files)
└── assets/ (icone)

RIPRISTINO:
1. Estrai tutti i file
2. Carica su GitHub Pages
3. Verifica CONFIG.APPS_SCRIPT_URL in js/config.js
4. Test: python3 -m http.server 8000

BACKEND (NON INCLUSO):
Per salvare backend Apps Script:
1. Apri script.google.com
2. Copia manualmente ogni file .gs

CONFIGURAZIONE CORRENTE:
Apps Script URL: ${CONFIG.APPS_SCRIPT_URL}
Versione: ${CONFIG.VERSION}
        `.trim();
        
        zip.file('README.txt', readmeContent);
        
        // 7. GENERA ZIP
        showNotification('info-box', '📦 Compressione file...', 'info');
        
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
        
        showNotification('info-box', '✅ Backup frontend scaricato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore backup frontend:', error);
        showNotification('info-box', '❌ Errore: ' + error.message, 'error');
    }
};

/**
 * Test connessione backend
 */
window.testConnection = async function() {
    try {
        showNotification('diagnostic-info', '⏳ Test connessione in corso...', 'info');
        
        const startTime = Date.now();
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=test_connection`;
        const response = await fetch(url);
        const data = await response.json();
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (data.success) {
            showNotification(
                'diagnostic-info',
                `✅ Connessione OK! Tempo: ${responseTime}ms | Fogli: ${data.sheets}`,
                'success'
            );
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore test connessione:', error);
        showNotification('diagnostic-info', '❌ Connessione fallita: ' + error.message, 'error');
    }
};

/**
 * Verifica integrità dati
 */
window.checkDataIntegrity = async function() {
    try {
        showNotification('diagnostic-info', '⏳ Verifica integrità in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=check_integrity`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            if (data.healthy) {
                showNotification('diagnostic-info', '✅ Tutti i dati sono integri!', 'success');
            } else {
                const issues = data.issues.join('\n• ');
                alert(`⚠️ Trovate ${data.issues.length} anomalie:\n\n• ${issues}\n\nVerifica la configurazione dei fogli Google.`);
                showNotification('diagnostic-info', `⚠️ ${data.issues.length} anomalie trovate`, 'warning');
            }
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore verifica integrità:', error);
        showNotification('diagnostic-info', '❌ Errore durante la verifica: ' + error.message, 'error');
    }
};

/**
 * Visualizza log sistema
 */
window.viewLogs = async function() {
    try {
        const logDisplay = document.getElementById('log-display');
        const logControls = document.getElementById('log-controls');
        
        logDisplay.innerHTML = '<p class="loading">⏳ Caricamento log...</p>';
        logControls.style.display = 'none';
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_logs&limit=100`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.logs && data.logs.length > 0) {
            displayLogs(data.logs);
            logControls.style.display = 'flex';
            showNotification('log-info', `✅ Caricati ${data.logs.length} log`, 'success');
        } else if (data.success && data.logs && data.logs.length === 0) {
            logDisplay.innerHTML = '<p class="text-muted">Nessun log presente nel sistema</p>';
            showNotification('log-info', 'ℹ️ Nessun log disponibile', 'info');
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore visualizzazione log:', error);
        document.getElementById('log-display').innerHTML = '<p style="color: #dc3545;">Errore: ' + error.message + '</p>';
        showNotification('log-info', '❌ Errore caricamento log', 'error');
    }
};

/**
 * Visualizza i log con filtri
 */
function displayLogs(logs) {
    const logDisplay = document.getElementById('log-display');
    
    if (!logs || logs.length === 0) {
        logDisplay.innerHTML = '<p class="text-muted">Nessun log da visualizzare</p>';
        return;
    }
    
    let html = '<div class="log-entries">';
    
    logs.forEach(log => {
        const levelClass = log.level.toLowerCase();
        const levelEmoji = {
            'INFO': 'ℹ️',
            'SUCCESS': '✅',
            'WARNING': '⚠️',
            'ERROR': '❌'
        }[log.level] || '📝';
        
        html += `
            <div class="log-entry" data-level="${log.level}">
                <div class="log-header">
                    <span class="log-level ${levelClass}">${levelEmoji} ${log.level}</span>
                    <span class="log-timestamp">${log.timestamp}</span>
                </div>
                <div class="log-body">
                    <strong>${log.action}</strong>: ${log.message}
                    ${log.user ? `<br><small>👤 ${log.user}</small>` : ''}
                    ${log.data ? `<br><small>📊 ${log.data}</small>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    logDisplay.innerHTML = html;
}

/**
 * Filtra log per livello
 */
window.filterLogs = function(level) {
    const entries = document.querySelectorAll('.log-entry');
    
    entries.forEach(entry => {
        if (level === 'ALL' || entry.dataset.level === level) {
            entry.style.display = 'block';
        } else {
            entry.style.display = 'none';
        }
    });
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
};

/**
 * Pulisci log vecchi
 */
window.cleanOldLogs = async function() {
    if (!confirm('Sei sicuro di voler eliminare i log più vecchi di 30 giorni?')) {
        return;
    }
    
    try {
        showNotification('log-info', '⏳ Pulizia log in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=clean_logs&days=30`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            showNotification('log-info', `✅ Eliminati ${data.deleted} log`, 'success');
            
            // Ricarica i log
            const logDisplay = document.getElementById('log-display');
            if (logDisplay && logDisplay.querySelector('.log-entry')) {
                window.viewLogs();
            }
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore pulizia log:', error);
        showNotification('log-info', '❌ Errore durante la pulizia: ' + error.message, 'error');
    }
};

/**
 * Esporta log come CSV
 */
window.exportLogsCSV = function() {
    const entries = document.querySelectorAll('.log-entry:not([style*="display: none"])');
    
    if (entries.length === 0) {
        alert('Nessun log da esportare');
        return;
    }
    
    let csv = 'Timestamp,Level,Action,Message,User\n';
    
    entries.forEach(entry => {
        const timestamp = entry.querySelector('.log-timestamp').textContent;
        const level = entry.dataset.level;
        const body = entry.querySelector('.log-body').textContent.trim();
        const parts = body.split(':');
        const action = parts[0].trim();
        const message = parts.slice(1).join(':').trim().split('👤')[0].trim();
        const userMatch = body.match(/👤 (.+)/);
        const user = userMatch ? userMatch[1].trim() : '';
        
        csv += `"${timestamp}","${level}","${action}","${message}","${user}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('log-info', '✅ Log esportati in CSV', 'success');
};

console.log('✅ Utilities module caricato');
