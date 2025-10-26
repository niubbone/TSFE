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
        const cssFiles = ['main.css', 'tabs.css', 'forms.css', 'tables.css', 'modals.css', 'utilities.css', 'vendite.css'];
        
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
        const jsFiles = ['config.js', 'main.js', 'api.js', 'timesheet.js', 'proforma.js', 'utilities.js', 'utils.js', 'vendite.js'];
        
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
═══════════════════════════════════════════════════════════
CRM STUDIO SMART - BACKUP FRONTEND
═══════════════════════════════════════════════════════════

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
 * Verifica integrità dati - VERSIONE CON MODALE SCROLLABILE
 */
window.checkDataIntegrity = async function() {
    try {
        showNotification('diagnostic-info', '⏳ Verifica integrità in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=check_integrity`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
        // ✅ MOSTRA IN MODALE INVECE CHE IN ALERT
        if (data.healthy) {
            // Sistema integro
            const statsHTML = formatStatsHTML(data.stats);
            showIntegrityModal('✅ SISTEMA INTEGRO', statsHTML + '<p style="color: #28a745; font-weight: bold; margin-top: 20px;">Nessuna anomalia rilevata.</p>', 'success');
            showNotification('diagnostic-info', '✅ Tutti i dati sono integri!', 'success');
        } else {
            // Anomalie trovate
            const reportHTML = formatIntegrityReportHTML(data);
            showIntegrityModal('⚠️ REPORT INTEGRITÀ DATI', reportHTML, 'warning');
            
            const totalProblems = (data.issues?.length || 0) + (data.warnings?.length || 0);
            showNotification(
                'diagnostic-info', 
                `⚠️ ${totalProblems} anomalie trovate (vedi dettagli)`, 
                'warning'
            );
        }
        
    } catch (error) {
        console.error('Errore verifica integrità:', error);
        showNotification('diagnostic-info', '❌ Errore durante la verifica: ' + error.message, 'error');
    }
};

/**
 * Mostra modale con report di integrità
 */
function showIntegrityModal(title, contentHTML, type) {
    // Rimuovi modale esistente se presente
    const existingModal = document.getElementById('integrity-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Crea modale
    const modal = document.createElement('div');
    modal.id = 'integrity-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    const borderColor = type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545';
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        max-width: 800px;
        max-height: 80vh;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        border-top: 4px solid ${borderColor};
        display: flex;
        flex-direction: column;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const titleEl = document.createElement('h3');
    titleEl.style.cssText = 'margin: 0; font-size: 20px; color: #333;';
    titleEl.textContent = title;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: #666;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;
    `;
    closeBtn.onclick = () => modal.remove();
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    
    // Body (scrollabile)
    const body = document.createElement('div');
    body.style.cssText = `
        padding: 20px;
        overflow-y: auto;
        max-height: calc(80vh - 140px);
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
    `;
    body.innerHTML = contentHTML;
    
    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 15px 20px;
        border-top: 1px solid #e0e0e0;
        text-align: right;
    `;
    
    const okBtn = document.createElement('button');
    okBtn.textContent = 'Chiudi';
    okBtn.style.cssText = `
        background: ${borderColor};
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
    `;
    okBtn.onclick = () => modal.remove();
    
    footer.appendChild(okBtn);
    
    // Assembla modale
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    
    // Chiudi cliccando fuori
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    // Chiudi con ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(modal);
}

/**
 * Formatta le statistiche come HTML
 */
function formatStatsHTML(stats) {
    if (!stats) return '<p>Statistiche non disponibili</p>';
    
    let html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 15px;">';
    html += '<h4 style="margin: 0 0 10px 0; color: #333;">📊 Statistiche Sistema</h4>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    
    if (stats.clienti !== undefined) {
        html += `<tr><td style="padding: 5px 0;"><strong>👥 Clienti:</strong></td><td style="text-align: right;">${stats.clienti}</td></tr>`;
    }
    if (stats.timesheet !== undefined) {
        html += `<tr><td style="padding: 5px 0;"><strong>📋 Timesheet:</strong></td><td style="text-align: right;">${stats.timesheet}</td></tr>`;
    }
    if (stats.pacchetti !== undefined) {
        html += `<tr><td style="padding: 5px 0;"><strong>📦 Pacchetti:</strong></td><td style="text-align: right;">${stats.pacchetti}`;
        if (stats.pacchettiAttivi !== undefined) {
            html += ` <span style="color: #28a745;">(${stats.pacchettiAttivi} attivi)</span>`;
        }
        html += `</td></tr>`;
    }
    if (stats.canoni !== undefined) {
        html += `<tr><td style="padding: 5px 0;"><strong>💰 Canoni:</strong></td><td style="text-align: right;">${stats.canoni}`;
        if (stats.canoniAttivi !== undefined) {
            html += ` <span style="color: #28a745;">(${stats.canoniAttivi} attivi)</span>`;
        }
        html += `</td></tr>`;
    }
    if (stats.firme !== undefined) {
        html += `<tr><td style="padding: 5px 0;"><strong>📝 Firme:</strong></td><td style="text-align: right;">${stats.firme}`;
        if (stats.firmeAttive !== undefined) {
            html += ` <span style="color: #28a745;">(${stats.firmeAttive} attive)</span>`;
        }
        html += `</td></tr>`;
    }
    
    html += '</table>';
    html += '</div>';
    
    return html;
}

/**
 * Formatta il report di integrità come HTML
 */
function formatIntegrityReportHTML(data) {
    let html = '';
    
    // Statistiche
    if (data.stats) {
        html += formatStatsHTML(data.stats);
    }
    
    // Sommario
    if (data.summary) {
        html += '<div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #ffc107;">';
        html += '<h4 style="margin: 0 0 10px 0; color: #856404;">📊 Sommario Problemi</h4>';
        html += '<table style="width: 100%;">';
        
        if (data.summary.critical > 0) {
            html += `<tr><td style="padding: 3px 0;">🔴 <strong>Critici:</strong></td><td style="text-align: right;">${data.summary.critical}</td></tr>`;
        }
        if (data.summary.high > 0) {
            html += `<tr><td style="padding: 3px 0;">🟠 <strong>Alta priorità:</strong></td><td style="text-align: right;">${data.summary.high}</td></tr>`;
        }
        if (data.summary.medium > 0) {
            html += `<tr><td style="padding: 3px 0;">🟡 <strong>Media priorità:</strong></td><td style="text-align: right;">${data.summary.medium}</td></tr>`;
        }
        if (data.summary.warnings > 0) {
            html += `<tr><td style="padding: 3px 0;">⚠️ <strong>Avvisi:</strong></td><td style="text-align: right;">${data.summary.warnings}</td></tr>`;
        }
        
        html += '</table>';
        html += '</div>';
    }
    
    // Issues critici e ad alta priorità
    if (data.issues && data.issues.length > 0) {
        const criticalIssues = data.issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
        
        if (criticalIssues.length > 0) {
            html += '<div style="background: #f8d7da; padding: 15px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #dc3545;">';
            html += '<h4 style="margin: 0 0 10px 0; color: #721c24;">🚨 Problemi Critici</h4>';
            html += '<ol style="margin: 0; padding-left: 20px;">';
            
            criticalIssues.forEach((issue) => {
                const emoji = issue.severity === 'CRITICAL' ? '🔴' : '🟠';
                html += `<li style="margin-bottom: 10px;">`;
                html += `<strong>${emoji} ${issue.message}</strong>`;
                if (issue.solution) {
                    html += `<br><span style="color: #856404;">💡 Soluzione: ${issue.solution}</span>`;
                }
                html += `</li>`;
            });
            
            html += '</ol>';
            html += '</div>';
        }
        
        // Altri issues
        const otherIssues = data.issues.filter(i => i.severity !== 'CRITICAL' && i.severity !== 'HIGH');
        if (otherIssues.length > 0) {
            html += '<div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #ffc107;">';
            html += `<h4 style="margin: 0 0 10px 0; color: #856404;">🟡 Altri Problemi (${otherIssues.length})</h4>`;
            html += '<ul style="margin: 0; padding-left: 20px;">';
            
            const displayCount = Math.min(otherIssues.length, 10);
            otherIssues.slice(0, displayCount).forEach((issue) => {
                html += `<li style="margin-bottom: 8px;">`;
                html += `${issue.message}`;
                if (issue.solution) {
                    html += `<br><span style="color: #856404; font-size: 12px;">💡 ${issue.solution}</span>`;
                }
                html += `</li>`;
            });
            
            if (otherIssues.length > displayCount) {
                html += `<li style="color: #666; font-style: italic;">... e altri ${otherIssues.length - displayCount} problemi</li>`;
            }
            
            html += '</ul>';
            html += '</div>';
        }
    }
    
    // Warnings
    if (data.warnings && data.warnings.length > 0) {
        html += '<div style="background: #d1ecf1; padding: 15px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #17a2b8;">';
        html += `<h4 style="margin: 0 0 10px 0; color: #0c5460;">⚠️ Avvisi (${data.warnings.length})</h4>`;
        html += '<ul style="margin: 0; padding-left: 20px;">';
        
        const displayCount = Math.min(data.warnings.length, 10);
        data.warnings.slice(0, displayCount).forEach((warning) => {
            html += `<li style="margin-bottom: 8px;">`;
            html += `${warning.message}`;
            if (warning.solution) {
                html += `<br><span style="color: #0c5460; font-size: 12px;">💡 ${warning.solution}</span>`;
            }
            html += `</li>`;
        });
        
        if (data.warnings.length > displayCount) {
            html += `<li style="color: #666; font-style: italic;">... e altri ${data.warnings.length - displayCount} avvisi</li>`;
        }
        
        html += '</ul>';
        html += '</div>';
    }
    
    // Azione consigliata
    html += '<div style="background: #e7f3ff; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">';
    html += '<h4 style="margin: 0 0 10px 0; color: #004085;">💡 Azione Consigliata</h4>';
    html += '<p style="margin: 0;">Verifica i problemi nel foglio Google e correggi le anomalie indicate.</p>';
    html += '</div>';
    
    return html;
}

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
