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
    
    // Carica automaticamente la versione all'apertura
    if (window.checkVersion) {
        window.checkVersion();
    }
}

/**
 * Scarica backup metadati backend
 */
window.downloadBackup = async function() {
    try {
        showNotification('⏳ Generazione backup in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=generate_backup`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            // Crea un file JSON con il backup
            const backupData = JSON.stringify(data.backup, null, 2);
            const blob = new Blob([backupData], { type: 'application/json' });
            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Crea nome file con timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const filename = `CRM_backend_metadata_${timestamp}.json`;
            
            // Trigger download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            showNotification('✅ Backup metadati scaricato!', 'success');
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore download backup:', error);
        showNotification('❌ Errore durante il download del backup: ' + error.message, 'error');
    }
};

/**
 * Scarica backup completo (frontend + backend metadata)
 */
window.downloadFullBackup = async function() {
    try {
        showNotification('⏳ Generazione backup completo...', 'info');
        
        // 1. Scarica metadati backend
        const urlBackend = `${CONFIG.APPS_SCRIPT_URL}?action=generate_backup`;
        const responseBackend = await fetch(urlBackend);
        const backendData = await responseBackend.json();
        
        if (!backendData.success) {
            throw new Error('Errore backend: ' + backendData.error);
        }
        
        // 2. Crea snapshot del frontend (config attuale)
        const frontendSnapshot = {
            config: CONFIG,
            timestamp: new Date().toISOString(),
            note: "Frontend completo disponibile su GitHub repository",
            repository: "https://github.com/[tuo-username]/[tuo-repo]"
        };
        
        // 3. Combina tutto
        const fullBackup = {
            type: "CRM_Studio_Smart_Full_Backup",
            created: new Date().toISOString(),
            backend: backendData.backup,
            frontend: frontendSnapshot,
            restoreInstructions: {
                step1: "Apps Script: ⋮ → 'Crea una copia' del progetto",
                step2: "Google Sheet: File → Crea una copia",
                step3: "Frontend: git clone dal repository GitHub",
                step4: "Aggiorna CONFIG.APPS_SCRIPT_URL in config.js con il nuovo deployment URL"
            }
        };
        
        // 4. Crea file JSON
        const backupData = JSON.stringify(fullBackup, null, 2);
        const blob = new Blob([backupData], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        
        // 5. Download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `CRM_FULL_backup_${timestamp}.json`;
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        showNotification('✅ Backup completo scaricato!', 'success');
        
    } catch (error) {
        console.error('Errore backup completo:', error);
        showNotification('❌ Errore: ' + error.message, 'error');
    }
};

/**
 * Verifica versione corrente
 */
window.checkVersion = async function() {
    try {
        const versionInfo = document.getElementById('version-info');
        if (!versionInfo) {
            console.log('Elemento version-info non trovato');
            return;
        }
        
        versionInfo.textContent = 'Caricamento...';
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_version`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            const info = data.version;
            versionInfo.innerHTML = `
                <strong>Versione:</strong> ${info.version}<br>
                <strong>Ultimo aggiornamento:</strong> ${info.lastUpdate}<br>
                <strong>Verificato il:</strong> ${new Date(info.timestamp).toLocaleString('it-IT')}
            `;
        } else {
            versionInfo.textContent = 'Errore nel caricamento';
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore verifica versione:', error);
        const versionInfo = document.getElementById('version-info');
        if (versionInfo) {
            versionInfo.textContent = 'Errore: ' + error.message;
        }
    }
};

/**
 * Visualizza log sistema
 */
window.viewLogs = async function() {
    try {
        const logDisplay = document.getElementById('log-display');
        logDisplay.innerHTML = '<p>⏳ Caricamento log...</p>';
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_logs&limit=100`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.logs && data.logs.length > 0) {
            let html = '';
            
            data.logs.forEach(log => {
                const levelClass = log.level.toLowerCase();
                html += `
                    <div class="log-entry">
                        <span class="log-timestamp">${log.timestamp}</span>
                        <span class="log-level ${levelClass}">${log.level}</span>
                        <span class="log-message">${log.action}: ${log.message}</span>
                    </div>
                `;
            });
            
            logDisplay.innerHTML = html;
            showNotification(`✅ Caricati ${data.logs.length} log`, 'success');
        } else if (data.success && data.logs && data.logs.length === 0) {
            logDisplay.innerHTML = '<p class="text-muted">Nessun log presente nel sistema</p>';
            showNotification('ℹ️ Nessun log disponibile', 'info');
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore visualizzazione log:', error);
        document.getElementById('log-display').innerHTML = '<p style="color: #dc3545;">Errore: ' + error.message + '</p>';
        showNotification('❌ Errore caricamento log', 'error');
    }
};

/**
 * Pulisci log vecchi
 */
window.cleanOldLogs = async function() {
    if (!confirm('Sei sicuro di voler eliminare i log più vecchi di 30 giorni?')) {
        return;
    }
    
    try {
        showNotification('⏳ Pulizia log in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=clean_logs&days=30`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            showNotification(`✅ Eliminati ${data.deleted} log`, 'success');
            
            // Ricarica i log se visibili
            const logDisplay = document.getElementById('log-display');
            if (logDisplay && logDisplay.querySelector('.log-entry')) {
                window.viewLogs();
            }
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore pulizia log:', error);
        showNotification('❌ Errore durante la pulizia: ' + error.message, 'error');
    }
};

/**
 * Test connessione backend
 */
window.testConnection = async function() {
    try {
        showNotification('⏳ Test connessione in corso...', 'info');
        
        const startTime = Date.now();
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=test_connection`;
        const response = await fetch(url);
        const data = await response.json();
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (data.success) {
            showNotification(
                `✅ Connessione OK! Tempo: ${responseTime}ms | Fogli: ${data.sheets}`, 
                'success'
            );
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore test connessione:', error);
        showNotification('❌ Connessione fallita: ' + error.message, 'error');
    }
};

/**
 * Verifica integrità dati
 */
window.checkDataIntegrity = async function() {
    try {
        showNotification('⏳ Verifica integrità in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=check_integrity`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            if (data.healthy) {
                showNotification('✅ Tutti i dati sono integri!', 'success');
            } else {
                const issues = data.issues.join('\n• ');
                alert(`⚠️ Trovate ${data.issues.length} anomalie:\n\n• ${issues}\n\nVerifica la configurazione dei fogli Google.`);
                showNotification(`⚠️ ${data.issues.length} anomalie trovate`, 'warning');
            }
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore verifica integrità:', error);
        showNotification('❌ Errore durante la verifica: ' + error.message, 'error');
    }
};

console.log('✅ Utilities module caricato');
