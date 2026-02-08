// =======================================================================
// === LISTA PROFORMA EMESSE (VERSIONE ROBUSTA) ===
// =======================================================================

/**
 * Carica e mostra lista proforma con retry automatico
 */
async function loadProformaList(clientName = null, retryCount = 0) {
  const container = document.getElementById('proforma-list-container');
  if (!container) {
    console.warn('⚠️ Container proforma-list-container non trovato');
    return;
  }
  
  console.log('🔄 loadProformaList() chiamata', { clientName, retryCount });
  
  container.innerHTML = '<div class="loading">⏳ Caricamento proforma...</div>';
  
  try {
    const API_URL = window.CONFIG?.APPS_SCRIPT_URL || '';
    if (!API_URL) {
      throw new Error('API URL non configurato in window.CONFIG');
    }
    
    const url = clientName 
      ? `${API_URL}?action=get_proforma_list&cliente=${encodeURIComponent(clientName)}`
      : `${API_URL}?action=get_proforma_list`;
    
    console.log('📡 Chiamata API:', url);
    
    // Timeout di 10 secondi
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log('📥 Risposta ricevuta:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📦 Dati JSON:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Errore caricamento proforma');
    }
    
    renderProformaList(result.data || []);
    console.log('✅ Lista proforma renderizzata con successo');
    
  } catch (error) {
    console.error('❌ Errore loadProformaList:', error);
    
    // Retry automatico (max 2 tentativi)
    if (retryCount < 2 && error.name !== 'AbortError') {
      console.log(`🔁 Retry ${retryCount + 1}/2...`);
      setTimeout(() => loadProformaList(clientName, retryCount + 1), 2000);
      return;
    }
    
    // Mostra errore dettagliato
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout - il server non risponde entro 10 secondi';
    }
    
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div>Errore caricamento proforma</div>
        <div style="font-size: 12px; margin-top: 8px; color: #999;">${errorMessage}</div>
        <button class="btn-small" onclick="loadProformaList()" style="margin-top: 12px;">
          🔄 Riprova
        </button>
      </div>
    `;
  }
}

/**
 * Renderizza lista proforma
 */
function renderProformaList(proformeList) {
  const container = document.getElementById('proforma-list-container');
  
  if (!proformeList || proformeList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <p><strong>Nessuna proforma emessa</strong></p>
        <p>Le proforma generate appariranno qui</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = proformeList.map(proforma => {
    const badgeClass = proforma.stato === 'Fatturata' ? 'badge-success' : 'badge-warning';
    const dataFormatted = formatDateItalian(proforma.data);
    const importoFormatted = formatCurrency(proforma.importo);
    
    return `
      <div class="proforma-card">
        <div class="proforma-header">
          <div class="proforma-number">
            ${proforma.nProforma}
            <span class="badge ${badgeClass}">
              ${proforma.stato}
            </span>
          </div>
          <div class="proforma-amount">${importoFormatted}</div>
        </div>
        
        <div class="proforma-body">
          <div class="proforma-cliente">👤 ${proforma.cliente}</div>
          <div class="proforma-causale">${proforma.causale || 'Nessuna causale'}</div>
          <div class="proforma-data">📅 ${dataFormatted}</div>
        </div>
        
        <div class="proforma-footer">
          ${proforma.nFattura 
            ? `<div class="fattura-info">
                 <strong>Fattura:</strong> ${proforma.nFattura}
               </div>`
            : `<button class="btn-small btn-primary" onclick="openFatturaModal('${proforma.nProforma}')">
                 📄 Emetti Fattura
               </button>`
          }
        </div>
      </div>
    `;
  }).join('');
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
