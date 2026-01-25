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

/**
 * BACKUP FRONTEND DINAMICO v2.0 - True Auto-Discovery
 * Scansiona index.html per trovare TUTTI i CSS/JS referenziati
 * Non richiede più liste hardcoded
 */
window.downloadFrontendBackup = async function() {
    try {
        showNotification('info-box', '⏳ Creazione backup ZIP dinamico v2.0...', 'info');
        
        const zip = new JSZip();
        let totalFiles = 0;
        let successFiles = 0;
        const processedFiles = new Set();
        
        // ===== FASE 1: Scarica e analizza index.html =====
        showNotification('info-box', '📄 Analisi index.html...', 'info');
        
        let indexContent = '';
        try {
            const indexResponse = await fetch('index.html');
            if (indexResponse.ok) {
                indexContent = await indexResponse.text();
                zip.file('index.html', indexContent);
                processedFiles.add('index.html');
                successFiles++;
                totalFiles++;
            }
        } catch(e) {
            console.error('Errore fetch index.html:', e);
        }
        
        // ===== FASE 2: Estrai tutti i riferimenti da index.html =====
        const cssFiles = new Set();
        const jsFiles = new Set();
        
        // CSS: <link rel="stylesheet" href="...">
        const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
        let match;
        while ((match = cssRegex.exec(indexContent)) !== null) {
            const href = match[1];
            if (!href.startsWith('http') && href.endsWith('.css')) {
                cssFiles.add(href);
            }
        }
        
        // CSS alternativo: href prima di rel
        const cssRegex2 = /<link[^>]+href=["']([^"']+\.css)["']/gi;
        while ((match = cssRegex2.exec(indexContent)) !== null) {
            const href = match[1];
            if (!href.startsWith('http')) {
                cssFiles.add(href);
            }
        }
        
        // JS: <script src="...">
        const jsRegex = /<script[^>]+src=["']([^"']+)["']/gi;
        while ((match = jsRegex.exec(indexContent)) !== null) {
            const src = match[1];
            if (!src.startsWith('http') && src.endsWith('.js')) {
                jsFiles.add(src);
            }
        }
        
        console.log('CSS trovati:', [...cssFiles]);
        console.log('JS trovati:', [...jsFiles]);
        
        // ===== FASE 3: Scarica CSS =====
        showNotification('info-box', `🎨 Scaricamento ${cssFiles.size} file CSS...`, 'info');
        const cssFolder = zip.folder('css');
        
        for (const cssPath of cssFiles) {
            if (processedFiles.has(cssPath)) continue;
            totalFiles++;
            
            try {
                const response = await fetch(cssPath);
                if (response.ok) {
                    const content = await response.text();
                    const fileName = cssPath.includes('/') ? cssPath.split('/').pop() : cssPath;
                    
                    if (cssPath.startsWith('css/')) {
                        cssFolder.file(fileName, content);
                    } else {
                        zip.file(cssPath, content);
                    }
                    processedFiles.add(cssPath);
                    successFiles++;
                    console.log(`✓ CSS: ${cssPath}`);
                }
            } catch(e) {
                console.warn(`✗ CSS: ${cssPath}`, e.message);
            }
        }
        
        // ===== FASE 4: Scarica JS =====
        showNotification('info-box', `⚙️ Scaricamento ${jsFiles.size} file JS...`, 'info');
        const jsFolder = zip.folder('js');
        
        for (const jsPath of jsFiles) {
            if (processedFiles.has(jsPath)) continue;
            totalFiles++;
            
            try {
                const response = await fetch(jsPath);
                if (response.ok) {
                    const content = await response.text();
                    const fileName = jsPath.includes('/') ? jsPath.split('/').pop() : jsPath;
                    
                    if (jsPath.startsWith('js/')) {
                        jsFolder.file(fileName, content);
                    } else {
                        zip.file(jsPath, content);
                    }
                    processedFiles.add(jsPath);
                    successFiles++;
                    console.log(`✓ JS: ${jsPath}`);
                }
            } catch(e) {
                console.warn(`✗ JS: ${jsPath}`, e.message);
            }
        }
        
        // ===== FASE 5: File root aggiuntivi =====
        showNotification('info-box', '📁 File root aggiuntivi...', 'info');
        const rootFiles = [
            'manifest.json', 
            'service-worker.js', 
            'sw-register.js', 
            'version.js', 
            'version-display.js', 
            'version-display.css'
        ];
        
        for (const file of rootFiles) {
            if (processedFiles.has(file)) continue;
            totalFiles++;
            
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const content = await response.text();
                    zip.file(file, content);
                    processedFiles.add(file);
                    successFiles++;
                    console.log(`✓ Root: ${file}`);
                }
            } catch(e) {
                console.warn(`✗ Root: ${file}`, e.message);
            }
        }
        
        // ===== FASE 6: Docs =====
        showNotification('info-box', '📚 Scansione docs...', 'info');
        const docsFolder = zip.folder('docs');
        const knownDocs = [
            'docs/architecture.html', 
            'docs/arc_backend.html', 
            'docs/arc_frontend.html', 
            'docs/tech_sheet.html'
        ];
        
        for (const docPath of knownDocs) {
            if (processedFiles.has(docPath)) continue;
            totalFiles++;
            
            try {
                const response = await fetch(docPath);
                if (response.ok) {
                    const content = await response.text();
                    const fileName = docPath.split('/').pop();
                    docsFolder.file(fileName, content);
                    processedFiles.add(docPath);
                    successFiles++;
                    console.log(`✓ Doc: ${docPath}`);
                }
            } catch(e) {}
        }
        
        // ===== FASE 7: Icons =====
        showNotification('info-box', '🎨 Scansione icons...', 'info');
        const iconsFolder = zip.folder('icons');
        const knownIcons = [
            'icons/favicon.ico', 
            'icons/favicon.svg', 
            'icons/favicon-96x96.png', 
            'icons/apple-touch-icon.png', 
            'icons/web-app-manifest-192x192.png', 
            'icons/web-app-manifest-512x512.png'
        ];
        
        for (const iconPath of knownIcons) {
            if (processedFiles.has(iconPath)) continue;
            totalFiles++;
            
            try {
                const response = await fetch(iconPath);
                if (response.ok) {
                    const blob = await response.blob();
                    const fileName = iconPath.split('/').pop();
                    iconsFolder.file(fileName, blob);
                    processedFiles.add(iconPath);
                    successFiles++;
                    console.log(`✓ Icon: ${iconPath}`);
                }
            } catch(e) {}
        }
        
        // ===== FASE 8: README =====
        const cssInZip = [...processedFiles].filter(f => f.endsWith('.css')).length;
        const jsInZip = [...processedFiles].filter(f => f.endsWith('.js')).length;
        
        const readmeContent = `
═══════════════════════════════════════════════════════════
CRM STUDIO SMART - BACKUP FRONTEND AUTOMATICO v2.0
═══════════════════════════════════════════════════════════

Data backup: ${new Date().toLocaleString('it-IT')}
Versione: ${CONFIG.VERSION || 'N/D'}

CONTENUTO (AUTO-SCOPERTO DA index.html):
✅ File scaricati: ${successFiles}/${totalFiles}

STRUTTURA:
├── index.html
├── File root PWA (manifest, service-worker, version)
├── css/ (${cssInZip} files)
├── js/ (${jsInZip} files)
├── docs/
└── icons/

FILE INCLUSI:
${[...processedFiles].sort().map(f => `  • ${f}`).join('\n')}

RIPRISTINO:
1. Estrai mantenendo struttura
2. Carica su GitHub Pages
3. Verifica CONFIG.APPS_SCRIPT_URL in js/config.js
4. Test locale: python3 -m http.server 8000

BACKEND:
Per esportare il backend vai in Apps Script Editor:
File > Download > Scarica come .zip

CONFIGURAZIONE:
Apps Script URL: ${CONFIG.APPS_SCRIPT_URL || 'N/D'}
`.trim();
        
        zip.file('README.txt', readmeContent);
        
        // ===== FASE 9: GENERA ZIP =====
        showNotification('info-box', '📦 Compressione...', 'info');
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
        
        showNotification('info-box', `✅ Backup completato! ${successFiles}/${totalFiles} file`, 'success');
        console.log('=== BACKUP COMPLETATO ===');
        console.log('File inclusi:', [...processedFiles].sort());
        
    } catch (error) {
        console.error('Errore backup:', error);
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
 * Verifica integrità dati - VERSIONE CON DISPLAY COME I LOG
 */
window.checkDataIntegrity = async function() {
    try {
        const integrityDisplay = document.getElementById('integrity-display');
        const integrityControls = document.getElementById('integrity-controls');
        
        integrityDisplay.innerHTML = '<p class="loading">⏳ Verifica integrità in corso...</p>';
        integrityControls.style.display = 'none';
        
        showNotification('diagnostic-info', '⏳ Verifica integrità in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=check_integrity`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
        // Mostra risultati nel display
        displayIntegrityResults(data);
        integrityControls.style.display = 'flex';
        
        if (data.healthy) {
            showNotification('diagnostic-info', '✅ Tutti i dati sono integri!', 'success');
        } else {
            const totalProblems = (data.issues?.length || 0) + (data.warnings?.length || 0);
            showNotification(
                'diagnostic-info', 
                `⚠️ ${totalProblems} anomalie trovate (vedi dettagli sotto)`, 
                'warning'
            );
        }
        
    } catch (error) {
        console.error('Errore verifica integrità:', error);
        document.getElementById('integrity-display').innerHTML = '<p style="color: #dc3545;">Errore: ' + error.message + '</p>';
        showNotification('diagnostic-info', '❌ Errore durante la verifica: ' + error.message, 'error');
    }
};

/**
 * Mostra risultati verifica integrità in stile log
 */
function displayIntegrityResults(data) {
    const integrityDisplay = document.getElementById('integrity-display');
    
    let html = '<div class="log-entries">';
    
    // STATISTICHE GENERALI
    html += `
        <div class="log-entry" data-level="INFO">
            <div class="log-header">
                <span class="log-level info">📊 STATISTICHE</span>
                <span class="log-timestamp">${new Date().toLocaleString('it-IT')}</span>
            </div>
            <div class="log-body">
                ${formatStatsForDisplay(data.stats)}
            </div>
        </div>
    `;
    
    // STATO SISTEMA
    if (data.healthy) {
        html += `
            <div class="log-entry" data-level="SUCCESS">
                <div class="log-header">
                    <span class="log-level success">✅ SISTEMA INTEGRO</span>
                </div>
                <div class="log-body">
                    <strong>Nessuna anomalia rilevata</strong><br>
                    Tutti i controlli sono stati superati con successo.
                </div>
            </div>
        `;
    } else {
        // ERRORI CRITICI
        if (data.issues && data.issues.length > 0) {
            const orphanIssues = data.issues.filter(i => i.type === 'orphan');
            const duplicateIssues = data.issues.filter(i => i.type === 'duplicate');
            const referenceIssues = data.issues.filter(i => i.type === 'reference');
            const otherIssues = data.issues.filter(i => !['orphan', 'duplicate', 'reference'].includes(i.type));
            
            // Orfani
            if (orphanIssues.length > 0) {
                html += `
                    <div class="log-entry" data-level="ERROR">
                        <div class="log-header">
                            <span class="log-level error">❌ RECORD ORFANI (${orphanIssues.length})</span>
                        </div>
                        <div class="log-body">
                `;
                orphanIssues.slice(0, 5).forEach(issue => {
                    html += `<strong>• ${issue.message}</strong><br>`;
                    if (issue.solution) {
                        html += `<small style="color: #721c24;">💡 ${issue.solution}</small><br>`;
                    }
                });
                if (orphanIssues.length > 5) {
                    html += `<small style="color: #666; font-style: italic;">... e altri ${orphanIssues.length - 5} record orfani</small>`;
                }
                html += `</div></div>`;
            }
            
            // Duplicati
            if (duplicateIssues.length > 0) {
                html += `
                    <div class="log-entry" data-level="ERROR">
                        <div class="log-header">
                            <span class="log-level error">❌ DUPLICATI (${duplicateIssues.length})</span>
                        </div>
                        <div class="log-body">
                `;
                duplicateIssues.slice(0, 5).forEach(issue => {
                    html += `<strong>• ${issue.message}</strong><br>`;
                    if (issue.solution) {
                        html += `<small style="color: #721c24;">💡 ${issue.solution}</small><br>`;
                    }
                });
                if (duplicateIssues.length > 5) {
                    html += `<small style="color: #666; font-style: italic;">... e altri ${duplicateIssues.length - 5} duplicati</small>`;
                }
                html += `</div></div>`;
            }
            
            // Riferimenti
            if (referenceIssues.length > 0) {
                html += `
                    <div class="log-entry" data-level="ERROR">
                        <div class="log-header">
                            <span class="log-level error">❌ RIFERIMENTI NON VALIDI (${referenceIssues.length})</span>
                        </div>
                        <div class="log-body">
                `;
                referenceIssues.slice(0, 5).forEach(issue => {
                    html += `<strong>• ${issue.message}</strong><br>`;
                    if (issue.solution) {
                        html += `<small style="color: #721c24;">💡 ${issue.solution}</small><br>`;
                    }
                });
                if (referenceIssues.length > 5) {
                    html += `<small style="color: #666; font-style: italic;">... e altri ${referenceIssues.length - 5} riferimenti non validi</small>`;
                }
                html += `</div></div>`;
            }
            
            // Altri problemi
            if (otherIssues.length > 0) {
                html += `
                    <div class="log-entry" data-level="ERROR">
                        <div class="log-header">
                            <span class="log-level error">❌ ALTRI PROBLEMI (${otherIssues.length})</span>
                        </div>
                        <div class="log-body">
                `;
                otherIssues.slice(0, 5).forEach(issue => {
                    html += `<strong>• ${issue.message}</strong><br>`;
                    if (issue.solution) {
                        html += `<small style="color: #721c24;">💡 ${issue.solution}</small><br>`;
                    }
                });
                if (otherIssues.length > 5) {
                    html += `<small style="color: #666; font-style: italic;">... e altri ${otherIssues.length - 5} problemi</small>`;
                }
                html += `</div></div>`;
            }
        }
        
        // AVVISI
        if (data.warnings && data.warnings.length > 0) {
            html += `
                <div class="log-entry" data-level="WARNING">
                    <div class="log-header">
                        <span class="log-level warning">⚠️ AVVISI (${data.warnings.length})</span>
                    </div>
                    <div class="log-body">
            `;
            data.warnings.slice(0, 10).forEach(warning => {
                html += `<strong>• ${warning.message}</strong><br>`;
                if (warning.solution) {
                    html += `<small style="color: #856404;">💡 ${warning.solution}</small><br>`;
                }
            });
            if (data.warnings.length > 10) {
                html += `<small style="color: #666; font-style: italic;">... e altri ${data.warnings.length - 10} avvisi</small>`;
            }
            html += `</div></div>`;
        }
        
        // AZIONE CONSIGLIATA
        html += `
            <div class="log-entry" data-level="INFO">
                <div class="log-header">
                    <span class="log-level info">💡 AZIONE CONSIGLIATA</span>
                </div>
                <div class="log-body">
                    <strong>Verifica i problemi nel foglio Google e correggi le anomalie indicate.</strong><br>
                    Utilizza i filtri sopra per concentrarti su specifiche tipologie di problemi.
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    integrityDisplay.innerHTML = html;
}

/**
 * Formatta le statistiche per il display
 */
function formatStatsForDisplay(stats) {
    if (!stats) return 'Nessuna statistica disponibile';
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">';
    
    if (stats.clienti !== undefined) {
        html += `<div><strong>👥 Clienti:</strong> ${stats.clienti} totali</div>`;
    }
    if (stats.timesheet !== undefined) {
        html += `<div><strong>⏱️ Timesheet:</strong> ${stats.timesheet} record</div>`;
    }
    if (stats.pacchetti !== undefined) {
        html += `<div><strong>📦 Pacchetti:</strong> ${stats.pacchetti} totali</div>`;
    }
    if (stats.pacchettiAttivi !== undefined) {
        html += `<div><strong>✅ Pacchetti Attivi:</strong> ${stats.pacchettiAttivi}</div>`;
    }
    if (stats.canoni !== undefined) {
        html += `<div><strong>💰 Canoni:</strong> ${stats.canoni} totali</div>`;
    }
    if (stats.canoniAttivi !== undefined) {
        html += `<div><strong>✅ Canoni Attivi:</strong> ${stats.canoniAttivi}</div>`;
    }
    if (stats.firme !== undefined) {
        html += `<div><strong>✍️ Firme:</strong> ${stats.firme} totali</div>`;
    }
    if (stats.firmeAttive !== undefined) {
        html += `<div><strong>✅ Firme Attive:</strong> ${stats.firmeAttive}</div>`;
    }
    
    html += '</div>';
    return html;
}

/**
 * Filtra risultati integrità per tipo
 */
window.filterIntegrity = function(type) {
    const entries = document.querySelectorAll('#integrity-display .log-entry');
    
    entries.forEach(entry => {
        const level = entry.dataset.level;
        const text = entry.textContent.toLowerCase();
        
        let shouldShow = false;
        
        if (type === 'ALL') {
            shouldShow = true;
        } else if (type === 'STATS') {
            shouldShow = level === 'INFO' && text.includes('statistiche');
        } else if (type === 'ERRORS') {
            shouldShow = level === 'ERROR';
        } else if (type === 'WARNINGS') {
            shouldShow = level === 'WARNING';
        } else if (type === 'SUCCESS') {
            shouldShow = level === 'SUCCESS';
        }
        
        entry.style.display = shouldShow ? 'block' : 'none';
    });
    
    // Update active button
    document.querySelectorAll('#integrity-controls .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
};

/**
 * Esporta report integrità come testo
 */
window.exportIntegrityReport = function() {
    const entries = document.querySelectorAll('#integrity-display .log-entry:not([style*="display: none"])');
    
    if (entries.length === 0) {
        alert('Nessun dato da esportare');
        return;
    }
    
    let text = '═══════════════════════════════════════\n';
    text += 'REPORT INTEGRITÀ DATI CRM\n';
    text += '═══════════════════════════════════════\n';
    text += `Data: ${new Date().toLocaleString('it-IT')}\n\n`;
    
    entries.forEach(entry => {
        const header = entry.querySelector('.log-header');
        const body = entry.querySelector('.log-body');
        
        if (header && body) {
            const level = header.querySelector('.log-level')?.textContent || '';
            const timestamp = header.querySelector('.log-timestamp')?.textContent || '';
            const content = body.textContent.trim();
            
            text += `${level}\n`;
            if (timestamp) text += `${timestamp}\n`;
            text += `${content}\n`;
            text += '───────────────────────────────────────\n\n';
        }
    });
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrity_report_${new Date().toISOString().substring(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('diagnostic-info', '✅ Report esportato', 'success');
};

/**
 * Visualizza log sistema
 */
window.viewLogs = async function() {
    console.log('🔍 viewLogs() chiamata');
    
    try {
        // Verifica elementi DOM
        const logDisplay = document.getElementById('log-display');
        const logControls = document.getElementById('log-controls');
        
        if (!logDisplay) {
            console.error('❌ Elemento #log-display non trovato');
            alert('Errore: elemento #log-display non trovato nel DOM');
            return;
        }
        
        logDisplay.innerHTML = '<p class="loading">⏳ Caricamento log...</p>';
        if (logControls) {
            logControls.style.display = 'none';
        }
        
        // Verifica CONFIG
        if (!CONFIG || !CONFIG.APPS_SCRIPT_URL) {
            throw new Error('CONFIG.APPS_SCRIPT_URL non definito in config.js');
        }
        
        // Fetch log
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_logs&limit=100`;
        console.log('📡 Fetching logs da:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 Response ricevuta:', data);
        
        // Gestisci response (supporta data.logs O data.data)
        let logs = null;
        
        if (data.success) {
            logs = data.logs || data.data || [];
            console.log(`✅ Trovati ${logs.length} log`);
        } else {
            throw new Error(data.error || 'Backend ha ritornato success: false');
        }
        
        // Mostra log
        if (logs && logs.length > 0) {
            displayLogs(logs);
            if (logControls) {
                logControls.style.display = 'flex';
            }
            showNotification('log-info', `✅ Caricati ${logs.length} log`, 'success');
        } else {
            logDisplay.innerHTML = '<p class="text-muted">📝 Nessun log presente nel sistema</p>';
            showNotification('log-info', 'ℹ️ Nessun log disponibile', 'info');
        }
        
    } catch (error) {
        console.error('❌ Errore visualizzazione log:', error);
        
        const logDisplay = document.getElementById('log-display');
        if (logDisplay) {
            logDisplay.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Errore Caricamento Log</h4>
                    <p style="margin: 0 0 10px 0; color: #856404;"><strong>Errore:</strong> ${error.message}</p>
                    <details style="margin-top: 10px;">
                        <summary style="cursor: pointer; color: #856404; user-select: none;">🔍 Dettagli Debug (clicca per espandere)</summary>
                        <pre style="margin-top: 10px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px; overflow-x: auto; font-size: 0.85rem; white-space: pre-wrap;">${error.stack || 'Stack trace non disponibile'}</pre>
                    </details>
                    <div style="margin-top: 15px; padding: 12px; background: white; border-radius: 4px; font-size: 0.9rem; color: #856404;">
                        <strong>Possibili cause:</strong>
                        <ul style="margin: 8px 0 0 20px; line-height: 1.8;">
                            <li>Backend Apps Script non raggiungibile</li>
                            <li>API endpoint errato in <code>config.js</code></li>
                            <li>Errore nel backend (controllare Apps Script logs)</li>
                            <li>Problema CORS o network</li>
                            <li>Backend ritorna formato dati diverso</li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
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
 * Mostra dropdown per scegliere quanti giorni di log cancellare
 */
window.showCleanLogsMenu = function() {
    const btn = event.target.closest('button');
    const rect = btn.getBoundingClientRect();
    
    // Rimuovi menu esistente se presente
    const existingMenu = document.getElementById('clean-logs-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    // Crea menu dropdown
    const menu = document.createElement('div');
    menu.id = 'clean-logs-menu';
    menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 5}px;
        right: ${window.innerWidth - rect.right}px;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 180px;
    `;
    
    const options = [
        { label: 'Più vecchi di 30 giorni', days: 30 },
        { label: 'Più vecchi di 15 giorni', days: 15 },
        { label: 'Più vecchi di 7 giorni', days: 7 },
        { label: 'Tutti i log', days: 0 }
    ];
    
    options.forEach(option => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.2s;
        `;
        item.textContent = option.label;
        
        item.onmouseover = () => item.style.background = '#f8f9fa';
        item.onmouseout = () => item.style.background = 'white';
        
        item.onclick = () => {
            menu.remove();
            cleanLogsWithDays(option.days);
        };
        
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // Chiudi menu cliccando fuori
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
};

/**
 * Pulisci log con giorni specificati
 */
async function cleanLogsWithDays(days) {
    let confirmMessage;
    if (days === 0) {
        confirmMessage = 'Sei sicuro di voler eliminare TUTTI i log?';
    } else {
        confirmMessage = `Sei sicuro di voler eliminare i log più vecchi di ${days} giorni?`;
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showNotification('log-info', '⏳ Pulizia log in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=clean_logs&days=${days}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            const message = days === 0 
                ? `✅ Eliminati tutti i ${data.deleted} log` 
                : `✅ Eliminati ${data.deleted} log`;
            showNotification('log-info', message, 'success');
            
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
}

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
