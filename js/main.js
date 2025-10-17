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

/**
 * Inizializzazione applicazione
 */
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inizializzazione Studio Smart Timesheet...');
  
  // Inizializza stato globale
  initGlobalState();
  
  // Setup tab switching
  setupTabs();
  
  // Inizializza moduli
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
      const tabName = btn.textContent.includes('Timesheet') ? 'timesheet' : 'proforma';
      switchTab(tabName);
    });
  });
}

/**
 * Cambia tab attivo
 */
function switchTab(tabName) {
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
  
  if (tabName === 'proforma') {
    showProformaStep(1);
  }
}

/**
 * Espone funzioni globali per onclick HTML
 * (necessario perché HTML usa onclick="nomeFunc()")
 */
function exposeGlobalFunctions() {
  // Timesheet
  window.openAddClientModal = openAddClientModal;
  window.closeAddClientModal = closeAddClientModal;
  window.saveNewClient = saveNewClient;
  window.switchTab = switchTab;
  
  // Proforma
  window.showProformaStep = showProformaStep;
  window.loadTimesheetForClient = loadTimesheetForClient;
  window.selectAllTimesheet = selectAllTimesheet;
  window.deselectAllTimesheet = deselectAllTimesheet;
  window.updateSelection = updateSelection;
  window.proceedToStep3 = proceedToStep3;
  window.generateProformaFinal = generateProformaFinal;
}
