// =======================================================================
// === MAIN - INIZIALIZZAZIONE APPLICAZIONE ===
// =======================================================================
import { initGlobalState } from './config.js';
import { initTimesheet, openAddClientModal, closeAddClientModal, saveNewClient } from './timesheet.js';
import { 
  initProforma, 
  showProformaStep, 
  loadTimesheetForClient, 
  selectAllTimesheet, 
  deselectAllTimesheet,
  updateSelection,
  proceedToStep3,
  generateProformaFinal
} from './proforma.js';
import { initUtilities } from './utilities.js';  // ← IMPORTA SUBITO

/**
 * Cambia tab attivo - ESPOSTA GLOBALMENTE SUBITO
 */
window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.getElementById(tabName + '-tab').classList.add('active');
  const activeBtn = Array.from(document.querySelectorAll('.tab-button'))
    .find(btn => btn.textContent.toLowerCase().includes(tabName));
  if (activeBtn) activeBtn.classList.add('active');
  
  // Inizializza il contenuto specifico della tab
  switch(tabName) {
    case 'proforma':
      showProformaStep(1);
      break;
    case 'utilities':
      initUtilities();  // ← CHIAMA INIT
      break;
  }
};

/**
 * Inizializzazione applicazione
 */
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inizializzazione Studio Smart Timesheet...');
  
  // Inizializza stato globale
  initGlobalState();
  
  // Setup tab switching
  setupTabs();
  
  // Inizializza moduli essenziali
  await initTimesheet();
  initProforma();
  
  // Esponi funzioni globali per onclick HTML
  exposeGlobalFunctions();
  
  console.log('✅ Applicazione inizializzata con successo!');
});

/**
 * Setup navigazione tab
 */
function setupTabs() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      let tabName;
      if (btn.textContent.includes('Timesheet')) {
        tabName = 'timesheet';
      } else if (btn.textContent.includes('Proforma')) {
        tabName = 'proforma';
      } else if (btn.textContent.includes('Utilities')) {
        tabName = 'utilities';
      }
      window.switchTab(tabName);
    });
  });
}

/**
 * Espone funzioni globali per onclick HTML
 */
function exposeGlobalFunctions() {
  // Timesheet
  window.openAddClientModal = openAddClientModal;
  window.closeAddClientModal = closeAddClientModal;
  window.saveNewClient = saveNewClient;
  
  // Proforma
  window.showProformaStep = showProformaStep;
  window.loadTimesheetForClient = loadTimesheetForClient;
  window.selectAllTimesheet = selectAllTimesheet;
  window.deselectAllTimesheet = deselectAllTimesheet;
  window.updateSelection = updateSelection;
  window.proceedToStep3 = proceedToStep3;
  window.generateProformaFinal = generateProformaFinal;
  
  // switchTab è già esposta all'inizio del file come window.switchTab
  // downloadFrontendBackup viene esposta in utilities.js (caricato subito ora)
}
