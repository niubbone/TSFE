// =======================================================================
// === UTILITIES - GESTIONE BACKUP, LOG E DIAGNOSTICA ===
// =======================================================================

import { CONFIG } from './config.js';
import { showNotification } from './utils.js';

/**
 * Inizializza la tab Utilities
 */
export function initUtilities() {
    console.log('Inizializzazione Utilities...');
    
    // Carica automaticamente la versione all'apertura
    if (window.checkVersion) {
        window.checkVersion();
    }
}

/**
 * Scarica backup completo del backend
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
            const filename = `CRM_backup_${timestamp}.json`;
            
            // Trigger download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            showNotification('✅ Backup scaricato con successo!', 'success');
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore download backup:', error);
        showNotification('❌ Errore durante il download del backup: ' + error.message, 'error');
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
            showNotification('✅ Versione verificata', 'success');
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
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore visualizzazione log:', error);
        document.getElementById('log-display').innerHTML = '<p class="text-danger">Errore: ' + error.message + '</p>';
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
            if (logDisplay.querySelector('.log-entry')) {
                viewLogs();
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
                `✅ Connessione OK! Tempo di risposta: ${responseTime}ms | Fogli: ${data.sheets}`, 
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
                const issues = data.issues.join('\n- ');
                showNotification(
                    `⚠️ Trovate ${data.issues.length} anomalie:\n- ${issues}`, 
                    'warning'
                );
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
