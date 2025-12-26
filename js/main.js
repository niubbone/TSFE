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
import { initUtilities } from './utilities.js';

// ✅ NUOVO: Istanza TabLoader globale
let tabLoader = null;

/**
 * Cambia tab attivo - VERSIONE IBRIDA con loader dinamico
 * IMPORTANTE: Solo utilities usa il loader (POC), altre tab funzionano come prima
 */
window.switchTab = async function(tabName) {
  // 🛡️ PROTEZIONE: Previeni errori se chiamata senza parametro valido
  if (!tabName || tabName === 'undefined') {
    console.warn('⚠️ switchTab chiamata senza parametro valido - operazione ignorata');
    return;
  }
  
  console.log(`🖱️ Switching to tab: ${tabName}`);
  
  // Disattiva tutti i pulsanti - CON CONTROLLO NULL
  document.querySelectorAll('.tab-button').forEach(btn => {
    if (btn && btn.classList) {
      btn.classList.remove('active');
    }
  });
  
  // Attiva il pulsante corrispondente
  const activeBtn = Array.from(document.querySelectorAll('.tab-button'))
    .find(btn => btn && btn.textContent && btn.textContent.toLowerCase().includes(tabName));
  
  if (activeBtn && activeBtn.classList) {
    activeBtn.classList.add('active');
  }
  
  // ✅ TUTTE LE TAB USANO LOADER DINAMICO
  // Migrazione completata!
  if (tabLoader) {
    console.log(`🔄 Loading ${tabName} dynamically...`);
    
    // Nascondi tutte le tab statiche
    document.querySelectorAll('.tab-content').forEach(tab => {
      if (tab && tab.classList) {
        tab.classList.remove('active');
      }
    });
    
    // ✅ FIX: Nascondi anche container per evitare conflitti
    const container = document.getElementById('tab-container');
    if (container) {
      // Salva stato corrente prima di pulire
      container.dataset.loadingDynamic = 'true';
    }
    
    // Carica utilities dinamicamente
    await tabLoader.show(tabName);
    
  } else {
    console.log('📄 Using static tab switching...');
    
    // ✅ FIX: Ripristina container se era dinamico
    const container = document.getElementById('tab-container');
    if (container && container.dataset.loadingDynamic === 'true') {
      delete container.dataset.loadingDynamic;
    }
    
    // VECCHIA LOGICA (invariata) per altre tab
    // Nascondi tutte le tab - CON CONTROLLO NULL
    document.querySelectorAll('.tab-content').forEach(tab => {
      if (tab && tab.classList) {
        tab.classList.remove('active');
      }
    });
    
    // Attiva la tab selezionata - CON CONTROLLO NULL
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab && targetTab.classList) {
      targetTab.classList.add('active');
    } else {
      console.error('❌ Tab non trovata:', tabName + '-tab');
      return;
    }
    
    // Inizializza il contenuto specifico della tab
    // Tutte le tab sono ora dinamiche - questi fallback non dovrebbero mai attivarsi
    switch(tabName) {
      case 'proforma':
      case 'utilities':
      case 'timesheet':
      case 'clienti':
      case 'vendite':
        console.log(`⚠️ ${tabName} fallback - dovrebbe essere dinamico`);
        break;
    }
  }
};

/**
 * Inizializzazione applicazione
 */
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inizializzazione Studio Smart Timesheet...');
  
  // Inizializza stato globale
  initGlobalState();
  
  // ✅ NUOVO: Inizializza TabLoader
  if (window.TabLoader) {
    tabLoader = new TabLoader();
    if (!tabLoader.init()) {
      console.error('❌ TabLoader init failed, fallback to static tabs');
      tabLoader = null;
    }
  } else {
    console.warn('⚠️ TabLoader not found, using static tabs only');
  }
  
  // Setup tab switching
  setupTabs();
  
  // Inizializza moduli essenziali
  await initTimesheet();
  initProforma();
  
  // Esponi funzioni globali per onclick HTML
  exposeGlobalFunctions();
  
  console.log('✅ Applicazione inizializzata con successo!');
});

// ✅ Event listener per tab caricate dinamicamente
window.addEventListener('tab-loaded', (e) => {
  const tabName = e.detail.tab;
  console.log(`🎯 Tab loaded event: ${tabName}`);
  
  // Init specifico per tab dinamiche
  if (tabName === 'utilities') {
    console.log('✅ Utilities tab ready (dynamic)');
  } else if (tabName === 'timesheet') {
    console.log('✅ Timesheet tab ready (dynamic)');
  } else if (tabName === 'clienti') {
    console.log('✅ Clienti tab ready (dynamic)');
  } else if (tabName === 'vendite') {
    console.log('✅ Vendite tab ready (dynamic)');
    if (typeof initVenditeTab === 'function') {
      initVenditeTab();
    }
  } else if (tabName === 'proforma') {
    console.log('✅ Proforma tab ready (dynamic)');
    if (typeof showProformaStep === 'function') {
      showProformaStep(1);
    }
  }
});

/**
 * Setup navigazione tab
 * VERSIONE CORRETTA con caso Clienti aggiunto e fix double click
 */
function setupTabs() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // ✅ FIX: Previeni propagazione multipla
      e.preventDefault();
      e.stopPropagation();
      
      let tabName;
      
      if (btn.textContent.includes('Timesheet')) {
        tabName = 'timesheet';
      } else if (btn.textContent.includes('Proforma')) {
        tabName = 'proforma';
      } else if (btn.textContent.includes('Vendite')) {
        tabName = 'vendite';
      } else if (btn.textContent.includes('Clienti')) {  // ✅ FIX: AGGIUNTO CASO CLIENTI
        tabName = 'clienti';
      } else if (btn.textContent.includes('Utilities')) {
        tabName = 'utilities';
      }
      
      // ✅ FIX: Chiama switchTab solo se tabName è definito
      if (tabName) {
        window.switchTab(tabName);
      } else {
        console.warn('⚠️ Pulsante tab non riconosciuto:', btn.textContent);
      }
    }, { once: false }); // Non once, ma preveniamo duplicati con stopPropagation
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
