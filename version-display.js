/**
 * Version Display - UI Components
 * 
 * Aggiorna automaticamente versione nella UI
 */

import { VERSION, VERSION_INFO, getVersionString, getFullVersionString, logVersion } from './version.js';

/**
 * Inizializza display versione
 */
export function initVersionDisplay() {
  // Log in console
  logVersion();
  
  // Update version box in utilities tab
  updateUtilitiesVersionBox();
  
  // Update footer (se esiste)
  updateFooterVersion();
  
  // Update page title
  updatePageTitle();
  
  // Expose version globally per debug
  window.CRM_VERSION = VERSION;
  window.CRM_VERSION_INFO = VERSION_INFO;
}

/**
 * Aggiorna box versione in Utilities tab
 */
function updateUtilitiesVersionBox() {
  // Cerca il box versione esistente
  const versionBox = document.querySelector('.version-box') || 
                     document.querySelector('[data-version]') ||
                     document.getElementById('version-info');
  
  if (versionBox) {
    // Update contenuto esistente
    versionBox.innerHTML = generateVersionBoxHTML();
  } else {
    // Crea nuovo box nella sezione utilities
    createVersionBox();
  }
}

/**
 * Genera HTML per version box
 */
function generateVersionBoxHTML() {
  return `
    <div class="version-info-content">
      <div class="version-header">
        <span class="version-icon">🚀</span>
        <span class="version-number">${getVersionString()}</span>
        <span class="version-badge">${VERSION_INFO.name}</span>
      </div>
      
      <div class="version-date">
        📅 ${VERSION_INFO.date}
      </div>
      
      <div class="version-changelog">
        <strong>✨ Novità:</strong>
        <ul>
          ${VERSION_INFO.changelog.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      
      <div class="version-actions">
        <button onclick="showFullChangelog()" class="btn-small">
          Changelog Completo
        </button>
        <button onclick="checkForUpdates()" class="btn-small">
          Verifica Aggiornamenti
        </button>
      </div>
    </div>
    
    <style>
      .version-info-content {
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
      
      .version-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .version-icon {
        font-size: 24px;
      }
      
      .version-number {
        font-size: 28px;
        font-weight: bold;
      }
      
      .version-badge {
        background: rgba(255,255,255,0.2);
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .version-date {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 15px;
      }
      
      .version-changelog {
        background: rgba(255,255,255,0.1);
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 15px;
      }
      
      .version-changelog ul {
        margin: 10px 0 0 0;
        padding-left: 20px;
      }
      
      .version-changelog li {
        margin: 5px 0;
        font-size: 14px;
      }
      
      .version-actions {
        display: flex;
        gap: 10px;
      }
      
      .btn-small {
        background: white;
        color: #667eea;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: transform 0.2s;
      }
      
      .btn-small:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
    </style>
  `;
}

/**
 * Crea nuovo version box
 */
function createVersionBox() {
  const utilitiesTab = document.getElementById('utilities-tab') || 
                       document.querySelector('[data-tab="utilities"]');
  
  if (!utilitiesTab) {
    console.warn('Utilities tab not found - version box not created');
    return;
  }
  
  const versionBox = document.createElement('div');
  versionBox.className = 'version-box';
  versionBox.id = 'version-info';
  versionBox.innerHTML = generateVersionBoxHTML();
  
  // Inserisci all'inizio della sezione utilities
  utilitiesTab.insertBefore(versionBox, utilitiesTab.firstChild);
}

/**
 * Aggiorna footer
 */
function updateFooterVersion() {
  const footer = document.querySelector('footer') || 
                 document.querySelector('.footer') ||
                 document.getElementById('footer');
  
  if (footer) {
    // Cerca elemento versione esistente
    let versionEl = footer.querySelector('.version') || 
                    footer.querySelector('[data-version]');
    
    if (!versionEl) {
      versionEl = document.createElement('span');
      versionEl.className = 'version';
      footer.appendChild(versionEl);
    }
    
    versionEl.textContent = getVersionString();
    versionEl.title = getFullVersionString();
  }
}

/**
 * Aggiorna page title
 */
function updatePageTitle() {
  const currentTitle = document.title;
  
  // Se non ha già versione, aggiungila
  if (!currentTitle.includes('v')) {
    document.title = `${currentTitle} - ${getVersionString()}`;
  }
}

/**
 * Mostra changelog completo
 */
window.showFullChangelog = function() {
  const modal = document.createElement('div');
  modal.className = 'changelog-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="this.parentElement.remove()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>📝 Changelog Completo</h2>
          <button class="modal-close" onclick="this.closest('.changelog-modal').remove()">×</button>
        </div>
        
        <div class="modal-body">
          <div class="version-section">
            <h3>${getFullVersionString()}</h3>
            <p class="version-date">${VERSION_INFO.date}</p>
            <ul>
              ${VERSION_INFO.changelog.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          
          <div class="version-section">
            <h3>v4.0.0 "Backend Refactoring"</h3>
            <p class="version-date">19 Dicembre 2024</p>
            <ul>
              <li>✅ Backend completamente refactored</li>
              <li>✅ Router switch/case pulito</li>
              <li>✅ ~500 righe duplicate eliminate</li>
              <li>✅ Utilities unificate</li>
              <li>✅ Cache ottimizzata +70%</li>
            </ul>
          </div>
          
          <div class="version-section">
            <h3>v3.7 "Sistema Rinnovi"</h3>
            <p class="version-date">31 Ottobre 2024</p>
            <ul>
              <li>✅ Sistema rinnovi automatici canoni/firme</li>
              <li>✅ Storico rinnovi completo</li>
              <li>✅ Email scadenze automatiche</li>
            </ul>
          </div>
          
          <div class="version-section">
            <h3>v3.1 "Scadenzario"</h3>
            <ul>
              <li>✅ Scadenzario integrato</li>
              <li>✅ Google Calendar integration</li>
              <li>✅ Alert automatici</li>
            </ul>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-primary" onclick="this.closest('.changelog-modal').remove()">
            Chiudi
          </button>
        </div>
      </div>
    </div>
    
    <style>
      .changelog-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
      }
      
      .modal-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .modal-content {
        background: white;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
      }
      
      .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-header h2 {
        margin: 0;
        color: #667eea;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: #999;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;
      }
      
      .modal-close:hover {
        color: #333;
      }
      
      .modal-body {
        padding: 24px;
        overflow-y: auto;
      }
      
      .version-section {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .version-section:last-child {
        border-bottom: none;
      }
      
      .version-section h3 {
        color: #333;
        margin: 0 0 5px 0;
      }
      
      .version-section .version-date {
        color: #999;
        font-size: 14px;
        margin: 0 0 10px 0;
      }
      
      .version-section ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .version-section li {
        margin: 8px 0;
        color: #666;
      }
      
      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
      }
      
      .btn-primary {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      
      .btn-primary:hover {
        background: #5568d3;
      }
    </style>
  `;
  
  document.body.appendChild(modal);
};

/**
 * Verifica aggiornamenti
 */
window.checkForUpdates = async function() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    alert('Service Worker non attivo - impossibile verificare aggiornamenti');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      
      // Mostra notifica
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #51cf66;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          animation: slideIn 0.3s ease;
        ">
          ✅ Versione ${VERSION} è la più recente
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  } catch (error) {
    console.error('Error checking updates:', error);
    alert('Errore verifica aggiornamenti');
  }
};

// Auto-init quando DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVersionDisplay);
} else {
  initVersionDisplay();
}
