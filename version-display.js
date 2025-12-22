/**
 * Version Display - UI Components LIGHT THEME
 */

import { VERSION, VERSION_INFO, CHANGELOG, getVersionString, getFullVersionString, logVersion } from './version.js';

console.log('🔍 version-display.js caricato');
console.log('🔍 VERSION:', VERSION);
console.log('🔍 CHANGELOG:', CHANGELOG);

/**
 * Inizializza display versione
 */
export function initVersionDisplay() {
  console.log('🔍 initVersionDisplay() chiamato');
  logVersion();
  updateUtilitiesVersionBox();
  updatePageTitle();
  
  window.CRM_VERSION = VERSION;
  window.CRM_VERSION_INFO = VERSION_INFO;
}

/**
 * Aggiorna/crea box versione in Utilities
 */
function updateUtilitiesVersionBox() {
  console.log('🔍 updateUtilitiesVersionBox() chiamato');
  
  const utilitiesTab = document.getElementById('utilities-tab');
  if (!utilitiesTab) {
    console.warn('⚠️ Utilities tab non trovato');
    return;
  }

  console.log('✅ Utilities tab trovato');

  // Rimuovi vecchi box
  const oldBoxes = [
    utilitiesTab.querySelector('.version-box'),
    utilitiesTab.querySelector('#version-info'),
    utilitiesTab.querySelector('#version-info-box'),
    document.querySelector('.app-version')
  ];
  
  oldBoxes.forEach((box, i) => {
    if (box) {
      console.log(`🗑️ Rimosso vecchio box ${i}`);
      box.remove();
    }
  });

  // Crea nuovo box LIGHT
  const versionBox = document.createElement('div');
  versionBox.className = 'utility-section';
  versionBox.id = 'version-info-box';
  
  versionBox.innerHTML = `
    <h3>ℹ️ Informazioni App</h3>
    
    <div class="version-card">
      <div class="version-header">
        <span class="version-label">Versione</span>
        <span class="version-number">${VERSION}</span>
      </div>
      
      <div class="version-details">
        <div class="version-detail-item">
          <span class="detail-icon">📅</span>
          <span class="detail-label">Build:</span>
          <span class="detail-value">${VERSION_INFO.date}</span>
        </div>
        
        <div class="version-detail-item">
          <span class="detail-icon">🚀</span>
          <span class="detail-label">Deployment:</span>
          <span class="detail-value">GitHub Pages</span>
        </div>
        
        <div class="version-detail-item">
          <span class="detail-icon">⚡</span>
          <span class="detail-label">PWA:</span>
          <span class="detail-value">Attivo</span>
        </div>
      </div>
      
      <button class="btn-changelog" onclick="toggleChangelog()">
        📋 Vedi Changelog
      </button>
      
      <div id="changelog-content" class="changelog-content" style="display: none;">
        ${generateChangelogHTML()}
      </div>
    </div>
  `;

  // Inserisci PRIMA della prima utility-section
  const firstSection = utilitiesTab.querySelector('.utility-section');
  if (firstSection) {
    console.log('✅ Inserisco prima della prima section');
    utilitiesTab.insertBefore(versionBox, firstSection);
  } else {
    console.log('⚠️ Nessuna utility-section trovata, cerco form-container');
    const container = utilitiesTab.querySelector('.form-container');
    if (container) {
      const h1 = container.querySelector('h1');
      const infoBox = container.querySelector('#info-box');
      if (infoBox && infoBox.nextSibling) {
        console.log('✅ Inserisco dopo info-box');
        container.insertBefore(versionBox, infoBox.nextSibling);
      } else if (h1) {
        console.log('✅ Inserisco dopo h1');
        h1.after(versionBox);
      } else {
        console.log('✅ Inserisco in fondo a container');
        container.appendChild(versionBox);
      }
    } else {
      console.log('⚠️ Form-container non trovato, inserisco in utilities-tab');
      utilitiesTab.appendChild(versionBox);
    }
  }
  
  console.log(`✅ Version display inizializzato: ${VERSION}`);
}

/**
 * Genera HTML changelog
 */
function generateChangelogHTML() {
  if (!CHANGELOG || CHANGELOG.length === 0) {
    return '<p class="changelog-empty">Nessun changelog disponibile</p>';
  }

  let html = '<div class="changelog-list">';
  
  CHANGELOG.forEach(entry => {
    const typeClass = entry.type || 'update';
    html += `
      <div class="changelog-entry">
        <div class="changelog-version">
          <span class="version-badge ${typeClass}">${entry.version}</span>
          <span class="version-date">${entry.date}</span>
        </div>
        <div class="changelog-changes">
          <ul>
            ${entry.changes.map(change => `<li>${change}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * Toggle changelog visibility
 */
window.toggleChangelog = function() {
  const content = document.getElementById('changelog-content');
  const btn = document.querySelector('.btn-changelog');
  
  if (!content || !btn) return;
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    btn.textContent = '📋 Nascondi Changelog';
  } else {
    content.style.display = 'none';
    btn.textContent = '📋 Vedi Changelog';
  }
};

/**
 * Aggiorna page title
 */
function updatePageTitle() {
  const currentTitle = document.title;
  if (!currentTitle.includes('v')) {
    document.title = `${currentTitle} - ${getVersionString()}`;
  }
}

// Auto-init
console.log('🔍 Stato DOM:', document.readyState);
if (document.readyState === 'loading') {
  console.log('⏳ Aspetto DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initVersionDisplay);
} else {
  console.log('✅ DOM già pronto, eseguo subito');
  initVersionDisplay();
}
