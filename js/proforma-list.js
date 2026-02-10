// =======================================================================
// === LISTA PROFORMA EMESSE (VERSIONE ROBUSTA) ===
// =======================================================================

/**
 * Carica e mostra lista proforma con retry automatico
 * VERSIONE ROBUSTA con protezioni multiple
 */
async function loadProformaList(clientName = null, retryCount = 0) {
  console.log('🔄 loadProformaList() chiamata', { 
    clientName, 
    retryCount,
    timestamp: new Date().toISOString() 
  });
  
  // PROTEZIONE 1: Verifica container
  const container = document.getElementById('proforma-list-container');
  if (!container) {
    console.error('❌ CRITICO: Container proforma-list-container non trovato nel DOM');
    console.log('📋 Containers disponibili:', 
      Array.from(document.querySelectorAll('[id*="proforma"]')).map(el => el.id)
    );
    return;
  }
  
  container.innerHTML = '<div class="loading">⏳ Caricamento proforma...</div>';
  
  // PROTEZIONE 6: Safety timeout assoluto - dopo 20s mostra sempre qualcosa
  const safetyTimeoutId = setTimeout(() => {
    console.error('🚨 SAFETY TIMEOUT: loadProformaList non completata dopo 20 secondi');
    if (container.innerHTML.includes('loading')) {
      container.innerHTML = `
        <div class="error-state" style="padding: 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">⏱️</div>
          <div style="font-weight: bold; margin-bottom: 8px;">Timeout caricamento</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 8px;">Il caricamento sta impiegando troppo tempo</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 16px;">
            Possibili cause: server lento, connessione instabile, backend sovraccarico
          </div>
          <button class="btn-primary btn-small" onclick="loadProformaList()" style="margin-top: 12px;">
            🔄 Riprova
          </button>
        </div>
      `;
    }
  }, 20000);
  
  try {
    // PROTEZIONE 2: Verifica CONFIG con fallback multipli
    let API_URL = null;
    
    // Tentativo 1: window.CONFIG
    if (window.CONFIG && window.CONFIG.APPS_SCRIPT_URL) {
      API_URL = window.CONFIG.APPS_SCRIPT_URL;
      console.log('✅ API URL da window.CONFIG');
    }
    // Tentativo 2: CONFIG globale
    else if (typeof CONFIG !== 'undefined' && CONFIG.APPS_SCRIPT_URL) {
      API_URL = CONFIG.APPS_SCRIPT_URL;
      console.log('✅ API URL da CONFIG globale');
    }
    // Tentativo 3: Hardcoded fallback
    else {
      API_URL = 'https://script.google.com/macros/s/AKfycbxrpkmfBlraaYihYYtJB0uvg8K60sPM-9uLmybcqoiVM6rSabZe6QK_-00L9CGAFwdo/exec';
      console.warn('⚠️ Uso API URL fallback hardcoded');
    }
    
    if (!API_URL || API_URL.trim() === '') {
      clearTimeout(safetyTimeoutId);
      throw new Error('API URL non disponibile - CONFIG non caricato');
    }
    
    // Costruisci URL completo
    const url = clientName 
      ? `${API_URL}?action=get_proforma_list&cliente=${encodeURIComponent(clientName)}`
      : `${API_URL}?action=get_proforma_list`;
    
    console.log('📡 Chiamata API:', url.substring(0, 100) + '...');
    console.log('🔗 Parametri:', { action: 'get_proforma_list', cliente: clientName || 'tutti' });
    
    // PROTEZIONE 3: Timeout di 15 secondi (aumentato da 10)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Timeout raggiunto dopo 15 secondi');
      controller.abort();
    }, 15000);
    
    const fetchStartTime = Date.now();
    const response = await fetch(url, { 
      signal: controller.signal,
      cache: 'no-cache' // Evita cache problematiche
    });
    clearTimeout(timeoutId);
    clearTimeout(safetyTimeoutId); // Cancella safety timeout se fetch completa
    
    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`📥 Risposta ricevuta in ${fetchDuration}ms:`, response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse JSON
    const result = await response.json();
    console.log('📦 Dati JSON ricevuti:', {
      success: result.success,
      dataLength: result.data?.length,
      hasError: !!result.error
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Errore caricamento proforma (success=false)');
    }
    
    // SUCCESSO: Renderizza lista
    renderProformaList(result.data || []);
    console.log('✅ Lista proforma renderizzata con successo:', result.data?.length || 0, 'elementi');
    
  } catch (error) {
    clearTimeout(safetyTimeoutId); // Cancella safety timeout su errore
    console.error('❌ Errore loadProformaList:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    
    // PROTEZIONE 4: Retry automatico (max 2 tentativi)
    // Ma NON su timeout (AbortError) per evitare loop
    if (retryCount < 2 && error.name !== 'AbortError') {
      const retryDelay = 2000 * (retryCount + 1); // Delay progressivo: 2s, 4s
      console.log(`🔁 Retry ${retryCount + 1}/2 tra ${retryDelay}ms...`);
      
      container.innerHTML = `
        <div class="loading">
          ⏳ Tentativo ${retryCount + 2}/3...
        </div>
      `;
      
      setTimeout(() => loadProformaList(clientName, retryCount + 1), retryDelay);
      return;
    }
    
    // PROTEZIONE 5: Mostra errore user-friendly con diagnostica
    let errorMessage = error.message;
    let suggestion = 'Verifica la connessione internet e riprova.';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout - il server non risponde entro 15 secondi';
      suggestion = 'Il backend potrebbe essere lento o non disponibile. Riprova tra qualche minuto.';
    } else if (error.message.includes('CONFIG')) {
      errorMessage = 'Configurazione mancante';
      suggestion = 'Ricarica la pagina (CTRL+F5) per ricaricare la configurazione.';
    } else if (error.message.includes('HTTP')) {
      suggestion = 'Errore del server. Controlla i log di Google Apps Script.';
    }
    
    container.innerHTML = `
      <div class="error-state" style="padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
        <div style="font-weight: bold; margin-bottom: 8px;">Errore caricamento proforma</div>
        <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${errorMessage}</div>
        <div style="font-size: 12px; color: #999; margin-bottom: 16px;">${suggestion}</div>
        <button class="btn-primary btn-small" onclick="loadProformaList()" style="margin-top: 12px;">
          🔄 Riprova
        </button>
        <button class="btn-secondary btn-small" onclick="console.log('Debug info:', window.CONFIG)" style="margin-top: 12px; margin-left: 8px;">
          🐛 Debug Console
        </button>
      </div>
    `;
  }
}

/**
 * Renderizza lista proforma
 * VERSIONE ROBUSTA con protezioni contro errori di rendering
 */
function renderProformaList(proformeList) {
  console.log('🎨 renderProformaList() chiamata', {
    isArray: Array.isArray(proformeList),
    length: proformeList?.length,
    firstItem: proformeList?.[0]
  });
  
  const container = document.getElementById('proforma-list-container');
  if (!container) {
    console.error('❌ CRITICO: Container proforma-list-container non trovato in renderProformaList');
    return;
  }
  
  // PROTEZIONE 1: Verifica array vuoto o null
  if (!proformeList || proformeList.length === 0) {
    console.log('ℹ️ Nessuna proforma da mostrare');
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
        <p style="font-weight: bold; margin-bottom: 8px;">Nessuna proforma emessa</p>
        <p style="color: #666;">Le proforma generate appariranno qui</p>
      </div>
    `;
    return;
  }
  
  try {
    // PROTEZIONE 2: Rendering con try-catch per ogni card
    const html = proformeList.map((proforma, index) => {
      try {
        const badgeClass = proforma.stato === 'Fatturata' ? 'badge-success' : 'badge-warning';
        const dataFormatted = formatDateItalian(proforma.data);
        const importoFormatted = formatCurrency(proforma.importo);
        
        return `
          <div class="proforma-card">
            <div class="proforma-header">
              <div class="proforma-number">
                ${proforma.nProforma || 'N/A'}
                <span class="badge ${badgeClass}">
                  ${proforma.stato || 'Sconosciuto'}
                </span>
              </div>
              <div class="proforma-date">${dataFormatted}</div>
              <div class="proforma-amount">${importoFormatted}</div>
            </div>
            
            <div class="proforma-body">
              <div class="proforma-info">
                <span class="info-icon">👤</span>
                <span>${proforma.cliente || 'Cliente non specificato'}</span>
              </div>
              ${proforma.descrizione ? `
                <div class="proforma-info">
                  <span class="info-icon">📝</span>
                  <span>${proforma.descrizione}</span>
                </div>
              ` : ''}
            </div>
            
            ${proforma.stato !== 'Fatturata' ? `
              <div class="proforma-actions">
                <button class="btn-primary btn-small" onclick="openFatturaModal('${proforma.nProforma}')">
                  📄 Emetti Fattura
                </button>
              </div>
            ` : `
              <div class="proforma-footer">
                <span class="info-label">Fattura:</span>
                <span class="info-value">${proforma.numeroFattura || 'N/A'}</span>
                ${proforma.dataFattura ? `
                  <span class="info-label" style="margin-left: 16px;">Data:</span>
                  <span class="info-value">${formatDateItalian(proforma.dataFattura)}</span>
                ` : ''}
              </div>
            `}
          </div>
        `;
      } catch (cardError) {
        console.error(`❌ Errore rendering card ${index}:`, cardError, proforma);
        return `
          <div class="proforma-card" style="border-left: 3px solid #dc3545;">
            <div class="proforma-body">
              <div style="color: #dc3545;">⚠️ Errore rendering proforma: ${proforma.nProforma || index}</div>
            </div>
          </div>
        `;
      }
    }).join('');
    
    container.innerHTML = html;
    console.log('✅ Rendering completato:', proformeList.length, 'proforma renderizzate');
    
  } catch (error) {
    console.error('❌ ERRORE CRITICO in renderProformaList:', error);
    container.innerHTML = `
      <div class="error-state" style="padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
        <div style="font-weight: bold; margin-bottom: 8px;">Errore rendering lista proforma</div>
        <div style="font-size: 12px; color: #999; margin-bottom: 16px;">${error.message}</div>
        <button class="btn-primary btn-small" onclick="loadProformaList()">
          🔄 Ricarica
        </button>
      </div>
    `;
  }
}

/**
 * Apre modal per emissione fattura
 */
function openFatturaModal(nProforma) {
  console.log('📄 Apertura modal fattura per proforma:', nProforma);
  
  const modal = document.getElementById('fatturaModal');
  if (!modal) {
    console.error('❌ Modal fattura non trovato');
    alert('Errore: modal fattura non trovato nel DOM');
    return;
  }
  
  document.getElementById('fattura-proforma-number').textContent = nProforma;
  document.getElementById('fattura-n-proforma-hidden').value = nProforma;
  document.getElementById('fattura-numero-input').value = '';
  document.getElementById('fattura-numero-input').focus();
  
  modal.classList.add('active');
}

/**
 * Chiude modal fattura
 */
function closeFatturaModal() {
  const modal = document.getElementById('fatturaModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Salva numero fattura
 */
async function saveNumeroFattura(event) {
  event.preventDefault();
  
  const nProforma = document.getElementById('fattura-n-proforma-hidden').value;
  const numeroFattura = document.getElementById('fattura-numero-input').value.trim();
  
  if (!numeroFattura) {
    alert('⚠️ Inserisci il numero fattura');
    return;
  }
  
  const submitBtn = document.getElementById('fattura-submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Salvataggio...';
  
  try {
    const API_URL = window.CONFIG?.APPS_SCRIPT_URL || '';
    if (!API_URL) {
      throw new Error('API URL non configurato');
    }
    
    const url = `${API_URL}?action=update_numero_fattura&n_proforma=${encodeURIComponent(nProforma)}&numero_fattura=${encodeURIComponent(numeroFattura)}`;
    
    console.log('💾 Salvataggio fattura:', { nProforma, numeroFattura });
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Errore salvataggio fattura');
    }
    
    console.log('✅ Fattura salvata con successo');
    alert(`✅ Fattura ${numeroFattura} registrata per proforma ${nProforma}`);
    closeFatturaModal();
    loadProformaList(); // Ricarica lista
    
  } catch (error) {
    console.error('❌ Errore saveNumeroFattura:', error);
    alert('❌ Errore: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Filtra proforma per cliente
 */
function filterProformaList() {
  const selectCliente = document.getElementById('filter-cliente-proforma');
  if (!selectCliente) return;
  
  const clienteSelezionato = selectCliente.value;
  console.log('🔍 Filtro proforma per cliente:', clienteSelezionato || 'TUTTI');
  loadProformaList(clienteSelezionato || null);
}

/**
 * Formatta data in italiano in modo robusto
 */
function formatDateItalian(dateStr) {
  if (!dateStr) return 'Data non disponibile';
  
  try {
    // Se già in formato dd/MM/yyyy, restituisci così com'è
    if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateStr;
    }
    
    // Se in formato ISO yyyy-MM-dd, converti
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const parts = dateStr.split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    // Prova conversione generica a Date
    const date = new Date(dateStr);
    
    // Verifica che sia una data valida
    if (isNaN(date.getTime())) {
      // Se la conversione fallisce, prova a estrarre la data dal formato verbose
      // Es: "Thu Jan 01 2026 00:00:00 GMT+0100"
      const match = dateStr.toString().match(/(\w{3})\s+(\w{3})\s+(\d{2})\s+(\d{4})/);
      if (match) {
        const months = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const day = match[3];
        const month = months[match[2]];
        const year = match[4];
        return `${day}/${month}/${year}`;
      }
      return 'Data non valida';
    }
    
    // Formatta in italiano
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch(e) {
    console.error('Errore formattazione data:', e);
    return 'Data non valida';
  }
}

/**
 * Formatta valuta
 */
function formatCurrency(value) {
  if (!value && value !== 0) return '€ 0,00';
  
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '€ 0,00';
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(num);
}

/**
 * Popola filtro clienti
 */
function populateProformaClientFilter() {
  const selectCliente = document.getElementById('filter-cliente-proforma');
  if (!selectCliente || !window.clients) return;
  
  selectCliente.innerHTML = '<option value="">Tutti i clienti</option>';
  
  window.clients.forEach(cliente => {
    const option = document.createElement('option');
    option.value = typeof cliente === 'string' ? cliente : cliente.name;
    option.textContent = typeof cliente === 'string' ? cliente : cliente.name;
    selectCliente.appendChild(option);
  });
}

// =======================================================================
// === ESPOSIZIONE FUNZIONI SU WINDOW (ACCESSIBILI GLOBALMENTE) ===
// =======================================================================

window.loadProformaList = loadProformaList;
window.renderProformaList = renderProformaList;
window.openFatturaModal = openFatturaModal;
window.closeFatturaModal = closeFatturaModal;
window.saveNumeroFattura = saveNumeroFattura;
window.filterProformaList = filterProformaList;
window.populateProformaClientFilter = populateProformaClientFilter;

/**
 * Resetta tutti i filtri proforma e ricarica lista completa
 */
function resetProformaFilters() {
  console.log('🔄 Reset filtri proforma');
  
  // Reset dropdown clienti
  const clienteFilter = document.getElementById('filter-cliente-proforma');
  if (clienteFilter) clienteFilter.value = '';
  
  // Reset dropdown anno
  const annoFilter = document.getElementById('filter-anno-proforma');
  if (annoFilter) annoFilter.value = '';
  
  // Reset dropdown stato
  const statoFilter = document.getElementById('filter-stato-proforma');
  if (statoFilter) statoFilter.value = '';
  
  // Ricarica lista completa
  filterProformaList();
}

// Espone resetProformaFilters globalmente
window.resetProformaFilters = resetProformaFilters;

console.log('✅ proforma-list.js caricato - funzioni esposte su window');

// =======================================================================
// === INIZIALIZZAZIONE AUTOMATICA ===
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOMContentLoaded - inizializzazione proforma-list');
  
  // Event listener per chiudere modal cliccando fuori
  const fatturaModal = document.getElementById('fatturaModal');
  if (fatturaModal) {
    fatturaModal.addEventListener('click', function(e) {
      if (e.target === fatturaModal) {
        closeFatturaModal();
      }
    });
    console.log('✅ Event listener modal fattura configurato');
  } else {
    console.warn('⚠️ Modal fattura non trovato in DOM');
  }
});
