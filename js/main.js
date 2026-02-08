// =======================================================================
// === MAIN.JS - GESTIONE TAB E INIZIALIZZAZIONE ===
// =======================================================================

/**
 * Switch tra i tab con caricamento automatico dei contenuti
 */
function switchTab(tabName) {
  console.log('🔄 Switch tab:', tabName);
  
  // Nasconde tutti i tab
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Rimuove active dai pulsanti
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Mostra tab selezionato
  const selectedTab = document.getElementById(tabName + '-tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Attiva pulsante corrispondente
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(button => {
    if (button.textContent.toLowerCase().includes(getTabEmoji(tabName))) {
      button.classList.add('active');
    }
  });
  
  // 🎯 CARICAMENTO AUTOMATICO CONTENUTI PER OGNI TAB
  switch(tabName) {
    case 'proforma':
      console.log('📄 Tab Proforma - caricamento automatico');
      // Ritarda di 100ms per dare tempo al DOM di aggiornare
      setTimeout(() => {
        // Carica lista proforma
        if (typeof window.loadProformaList === 'function') {
          window.loadProformaList();
        } else {
          console.error('❌ loadProformaList non disponibile!');
        }
        
        // Carica dropdown clienti
        if (typeof window.populateClientDropdown === 'function') {
          window.populateClientDropdown();
        } else {
          console.error('❌ populateClientDropdown non disponibile!');
        }
      }, 100);
      break;
      
    case 'vendite':
      console.log('🛒 Tab Vendite');
      // Qui puoi aggiungere caricamento vendite se necessario
      break;
      
    case 'clienti':
      console.log('👥 Tab Clienti');
      // Qui puoi aggiungere caricamento clienti se necessario
      break;
      
    case 'utilities':
      console.log('⚙️ Tab Utilities');
      break;
      
    case 'timesheet':
    default:
      console.log('⏱️ Tab Timesheet');
      break;
  }
}

/**
 * Helper per ottenere emoji del tab
 */
function getTabEmoji(tabName) {
  const emojiMap = {
    'timesheet': '⏱️',
    'proforma': '📄',
    'vendite': '🛒',
    'clienti': '👥',
    'utilities': '⚙️'
  };
  return emojiMap[tabName] || '';
}

// Espone switchTab globalmente
window.switchTab = switchTab;

console.log('✅ main.js caricato - switchTab disponibile');

// =======================================================================
// === INIZIALIZZAZIONE AL CARICAMENTO PAGINA ===
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOMContentLoaded - inizializzazione main.js');
  
  // Verifica che CONFIG sia presente
  if (window.CONFIG && window.CONFIG.APPS_SCRIPT_URL) {
    console.log('✅ CONFIG disponibile:', window.CONFIG.APPS_SCRIPT_URL.substring(0, 50) + '...');
  } else {
    console.error('❌ CONFIG non trovato! Verifica config.js');
  }
  
  // Verifica che le funzioni proforma siano disponibili
  if (typeof window.loadProformaList === 'function') {
    console.log('✅ loadProformaList disponibile');
  } else {
    console.warn('⚠️ loadProformaList non ancora disponibile (verrà caricata da proforma-list.js)');
  }
});
