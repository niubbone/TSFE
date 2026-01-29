// =======================================================================
// === LISTA PROFORMA EMESSE ===
// =======================================================================

// Variabile per memorizzare tutte le proforma caricate
let allProformeData = [];

/**
 * Carica e mostra lista proforma
 */
async function loadProformaList(forceReload = false) {
  console.log('🔄 loadProformaList chiamata, forceReload:', forceReload);
  
  const container = document.getElementById('proforma-list-container');
  if (!container) {
    console.error('❌ Container proforma-list-container non trovato!');
    return;
  }
  
  // Se abbiamo già i dati e non è un reload forzato, usa i dati in memoria
  if (allProformeData.length > 0 && !forceReload) {
    filterAndRenderProforma();
    return;
  }
  
  container.innerHTML = '<div class="loading">⏳ Caricamento proforma...</div>';
  
  try {
    const API_URL = window.CONFIG?.APPS_SCRIPT_URL || '';
    console.log('📡 API_URL:', API_URL);
    
    if (!API_URL) {
      throw new Error('API URL non configurato - window.CONFIG non disponibile');
    }
    
    const url = `${API_URL}?action=get_proforma_list`;
    
    console.log('📡 Chiamata API:', url);
    
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('📦 Risposta API:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Errore caricamento proforma');
    }
    
    allProformeData = result.data || [];
    console.log('✅ Proforma ricevute:', allProformeData.length);
    
    // Popola filtro anni
    populateAnniFilter();
    
    // Applica filtri e renderizza
    filterAndRenderProforma();
    
  } catch (error) {
    console.error('❌ Errore loadProformaList:', error);
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div>Errore caricamento proforma</div>
        <div style="font-size: 12px; margin-top: 8px; color: #999;">${error.message}</div>
        <button onclick="loadProformaList(true)" style="margin-top: 10px;" class="btn-secondary">🔄 Riprova</button>
      </div>
    `;
  }
}

/**
 * Popola il filtro anni con gli anni presenti nelle proforma
 */
function populateAnniFilter() {
  const selectAnno = document.getElementById('filter-anno-proforma');
  if (!selectAnno) return;
  
  // Estrai anni unici dalle proforma
  const anni = [...new Set(allProformeData.map(p => {
    if (!p.data) return null;
    const date = new Date(p.data);
    return isNaN(date.getTime()) ? null : date.getFullYear();
  }).filter(a => a !== null))].sort((a, b) => b - a); // Ordine decrescente
  
  selectAnno.innerHTML = '<option value="">Tutti gli anni</option>';
  anni.forEach(anno => {
    const option = document.createElement('option');
    option.value = anno;
    option.textContent = anno;
    selectAnno.appendChild(option);
  });
  
  console.log('✅ Popolato filtro anni:', anni);
}

/**
 * Filtra e renderizza le proforma in base ai filtri selezionati
 */
function filterAndRenderProforma() {
  const clienteFilter = document.getElementById('filter-cliente-proforma')?.value || '';
  const annoFilter = document.getElementById('filter-anno-proforma')?.value || '';
  const statoFilter = document.getElementById('filter-stato-proforma')?.value || '';
  
  console.log('🔍 Filtri:', { cliente: clienteFilter, anno: annoFilter, stato: statoFilter });
  
  let filtered = allProformeData;
  
  // Filtro cliente
  if (clienteFilter) {
    filtered = filtered.filter(p => p.cliente === clienteFilter);
  }
  
  // Filtro anno
  if (annoFilter) {
    const annoNum = parseInt(annoFilter);
    filtered = filtered.filter(p => {
      if (!p.data) return false;
      const date = new Date(p.data);
      return date.getFullYear() === annoNum;
    });
  }
  
  // Filtro stato
  if (statoFilter) {
    if (statoFilter === 'fatturata') {
      filtered = filtered.filter(p => p.nFattura || p.stato === 'Fatturata' || p.stato === 'Pagata');
    } else if (statoFilter === 'non_fatturata') {
      filtered = filtered.filter(p => !p.nFattura && p.stato !== 'Fatturata' && p.stato !== 'Pagata');
    }
  }
  
  console.log('📊 Proforma filtrate:', filtered.length, 'di', allProformeData.length);
  renderProformaList(filtered);
}

/**
 * Chiamata quando cambiano i filtri
 */
function filterProformaList() {
  if (allProformeData.length === 0) {
    loadProformaList(true);
  } else {
    filterAndRenderProforma();
  }
}

/**
 * Reset di tutti i filtri
 */
function resetProformaFilters() {
  const filterCliente = document.getElementById('filter-cliente-proforma');
  const filterAnno = document.getElementById('filter-anno-proforma');
  const filterStato = document.getElementById('filter-stato-proforma');
  
  if (filterCliente) filterCliente.value = '';
  if (filterAnno) filterAnno.value = '';
  if (filterStato) filterStato.value = '';
  
  filterAndRenderProforma();
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
  
  console.log('🎨 Rendering', proformeList.length, 'proforma');
  
  container.innerHTML = proformeList.map(proforma => {
    // Badge con icone per stato
    let badgeClass, badgeText;
    if (proforma.stato === 'Pagata') {
      badgeClass = 'badge-success';
      badgeText = '💰 Fatturata e pagata';
    } else if (proforma.stato === 'Fatturata') {
      badgeClass = 'badge-info';
      badgeText = '📄 Fatturata';
    } else {
      badgeClass = 'badge-warning';
      badgeText = '⏳ Proforma';
    }
    
    const dataFormatted = formatDateItalian(proforma.data);
    const importoFormatted = formatCurrency(proforma.importo);
    
    return `
      <div class="proforma-card">
        <div class="proforma-header">
          <div class="proforma-number">
            ${proforma.nProforma}
            <span class="badge ${badgeClass}">
              ${badgeText}
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
          ${proforma.pdfUrl ? `<a href="${proforma.pdfUrl}" target="_blank" class="btn-small btn-secondary">📥 PDF</a>` : ''}
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
  
  // Imposta data di oggi come default
  const oggi = new Date().toISOString().split('T')[0];
  document.getElementById('fattura-data-input').value = oggi;
  
  // Reset checkbox pagato
  document.getElementById('fattura-pagato-checkbox').checked = false;
  
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
  const dataFattura = document.getElementById('fattura-data-input').value;
  const pagato = document.getElementById('fattura-pagato-checkbox').checked;
  
  if (!numeroFattura) {
    alert('⚠️ Inserisci il numero fattura');
    return;
  }
  
  if (!dataFattura) {
    alert('⚠️ Inserisci la data fattura');
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
    
    const url = `${API_URL}?action=update_numero_fattura&n_proforma=${encodeURIComponent(nProforma)}&numero_fattura=${encodeURIComponent(numeroFattura)}&data_fattura=${encodeURIComponent(dataFattura)}&pagato=${pagato}`;
    
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
 * Popola select clienti per filtro proforma
 */
function populateProformaClientFilter() {
  const filterSelect = document.getElementById('filter-cliente-proforma');
  if (!filterSelect) {
    console.warn('⚠️ Select filter-cliente-proforma non trovato');
    return;
  }
  
  filterSelect.innerHTML = '<option value="">Tutti i clienti</option>';
  
  if (window.clients && Array.isArray(window.clients)) {
    window.clients.forEach(cliente => {
      const option = document.createElement('option');
      const name = typeof cliente === 'string' ? cliente : cliente.name;
      option.value = name;
      option.textContent = name;
      filterSelect.appendChild(option);
    });
    console.log('✅ Popolato select filtro proforma con ' + window.clients.length + ' clienti');
  } else {
    console.warn('⚠️ window.clients non disponibile per filtro proforma');
  }
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

// Inizializza al caricamento pagina
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 proforma-list.js caricato');
  
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

// Esponi funzioni globalmente
window.loadProformaList = loadProformaList;
window.populateProformaClientFilter = populateProformaClientFilter;
window.filterProformaList = filterProformaList;
window.resetProformaFilters = resetProformaFilters;
window.filterAndRenderProforma = filterAndRenderProforma;
window.openFatturaModal = openFatturaModal;
window.closeFatturaModal = closeFatturaModal;
window.saveNumeroFattura = saveNumeroFattura;
