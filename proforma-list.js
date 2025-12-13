// =======================================================================
// === LISTA PROFORMA EMESSE ===
// =======================================================================

/**
 * Carica e mostra lista proforma
 */
async function loadProformaList(clientName = null) {
  const container = document.getElementById('proforma-list-container');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">⏳ Caricamento proforma...</div>';
  
  try {
    const API_URL = window.CONFIG?.APPS_SCRIPT_URL || '';
    if (!API_URL) {
      throw new Error('API URL non configurato');
    }
    
    const url = clientName 
      ? `${API_URL}?action=get_proforma_list&cliente=${encodeURIComponent(clientName)}`
      : `${API_URL}?action=get_proforma_list`;
      
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Errore caricamento proforma');
    }
    
    renderProformaList(result.data || []);
    
  } catch (error) {
    console.error('Errore loadProformaList:', error);
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div>Errore caricamento proforma</div>
        <div style="font-size: 12px; margin-top: 8px; color: #999;">${error.message}</div>
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
  const modal = document.getElementById('fatturaModal');
  if (!modal) {
    console.error('Modal fattura non trovato');
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
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Errore salvataggio fattura');
    }
    
    alert(`✅ Fattura ${numeroFattura} registrata per proforma ${nProforma}`);
    closeFatturaModal();
    loadProformaList(); // Ricarica lista
    
  } catch (error) {
    console.error('Errore saveNumeroFattura:', error);
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
  loadProformaList(clienteSelezionato || null);
}

/**
 * Formatta data in italiano
 */
function formatDateItalian(dateStr) {
  if (!dateStr) return 'Data non disponibile';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch(e) {
    return dateStr;
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

// Inizializza al caricamento pagina
document.addEventListener('DOMContentLoaded', function() {
  // Event listener per chiudere modal cliccando fuori
  const fatturaModal = document.getElementById('fatturaModal');
  if (fatturaModal) {
    fatturaModal.addEventListener('click', function(e) {
      if (e.target === fatturaModal) {
        closeFatturaModal();
      }
    });
  }
});
