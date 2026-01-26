// =======================================================================
// === PROFORMA - GESTIONE TAB PROFORMA ===
// =======================================================================

import { getTimesheetDaFatturare, generateProforma } from './api.js';
import { formatDate, formatCurrency } from './utils.js';

// Definisci API_URL globale
const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.APPS_SCRIPT_URL)
  ? CONFIG.APPS_SCRIPT_URL
  : 'https://script.google.com/macros/s/AKfycbxrpkmfBlraaYihYYtJB0uvg8K60sPM-9uLmybcqoiVM6rSabZe6QK_-00L9CGAFwdo/exec';

/**
 * Inizializza il tab proforma
 */
export function initProforma() {
  setupProformaListeners();
}

/**
 * Setup event listeners per proforma
 */
function setupProformaListeners() {
  const applicaQuotaCheckbox = document.getElementById('applica_quota');
  if (applicaQuotaCheckbox) {
    applicaQuotaCheckbox.addEventListener('change', updateProformaTotals);
  }
}

/**
 * Mostra uno specifico step della proforma
 */
export function showProformaStep(stepNumber) {
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });
  const stepElement = document.getElementById('step-' + stepNumber);
  if (stepElement) {
    stepElement.classList.add('active');
  }
}

/**
 * Carica i timesheet e canoni da fatturare per un cliente
 */
export async function loadTimesheetForClient() {
  const clientName = document.getElementById('proforma_client_select').value;
  
  if (!clientName) {
    alert('Seleziona un cliente');
    return;
  }
  
  const loadingBox = document.getElementById('loading-timesheet');
  loadingBox.style.display = 'block';
  
  try {
    // ✅ AGGIORNATO: getTimesheetDaFatturare ora restituisce { timesheet, canoni }
    const result = await getTimesheetDaFatturare(clientName);
    
    // Combina timesheet e canoni in un unico array per la tabella
    // I canoni hanno già tipo: 'CANONE' dal backend
    const allItems = [
      ...result.timesheet.map(t => ({ ...t, tipo: t.tipo || 'Intervento', itemType: 'TIMESHEET' })),
      ...result.canoni.map(c => ({ ...c, itemType: 'CANONE' }))
    ];
    
    window.currentTimesheetData = allItems;
    window.currentCanoniData = result.canoni; // Salva canoni separatamente per riferimento
    
    displayTimesheetTable(allItems);
    showProformaStep(2);
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore: ' + error.message);
  } finally {
    loadingBox.style.display = 'none';
  }
}

/**
 * Mostra la tabella dei timesheet e canoni
 */
function displayTimesheetTable(items) {
  const tbody = document.getElementById('timesheet-tbody');
  tbody.innerHTML = '';
  window.selectedTimesheet = [];
  window.selectedCanoni = [];
  
  if (items.length === 0) {
    document.getElementById('timesheet-table-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔭</div>
        <p><strong>Nessun elemento da fatturare</strong></p>
        <p>Non ci sono timesheet o canoni "Da fatturare" per questo cliente</p>
      </div>
    `;
    document.getElementById('selection-info').style.display = 'none';
    return;
  }
  
  document.getElementById('timesheet-table-container').style.display = 'block';
  document.getElementById('selection-info').style.display = 'block';
  
  items.forEach((row, index) => {
    const isCanone = row.itemType === 'CANONE';
    const dataFormatted = formatDate(row.dataItaliana || row.data);
    
    // Badge distintivo per tipo
    const tipoBadge = isCanone 
      ? `<span class="badge badge-canone" style="background:#9b59b6;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">📋 CANONE</span>`
      : `<span class="badge badge-timesheet" style="background:#3498db;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">⏱️ Intervento</span>`;
    
    // Descrizione: per canoni mostra descrizione, per timesheet mostra tipo intervento
    const descrizione = isCanone 
      ? (row.descrizione || 'Canone')
      : (row.tipo || 'Intervento');
    
    const tr = document.createElement('tr');
    tr.style.backgroundColor = isCanone ? '#f8f4fc' : ''; // Sfondo leggermente viola per canoni
    
    tr.innerHTML = `
      <td>
        <input type="checkbox" class="timesheet-checkbox" 
               data-index="${index}" 
               data-row="${row.rowIndex}" 
               data-date="${row.data}"
               data-item-type="${row.itemType}"
               ${isCanone ? `data-canone-id="${row.idCanone}"` : ''}
               onchange="window.updateSelection()" checked>
      </td>
      <td>${tipoBadge}</td>
      <td>${dataFormatted}</td>
      <td>${descrizione}</td>
      <td style="text-align:center;">${isCanone ? '-' : row.ore}</td>
      <td><strong>${formatCurrency(row.costo || 0)}</strong></td>
    `;
    tbody.appendChild(tr);
  });
  
  updateSelection();
}

/**
 * Seleziona tutti i timesheet
 */
export function selectAllTimesheet() {
  document.querySelectorAll('.timesheet-checkbox').forEach(checkbox => {
    checkbox.checked = true;
  });
  updateSelection();
}

/**
 * Deseleziona tutti i timesheet
 */
export function deselectAllTimesheet() {
  document.querySelectorAll('.timesheet-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  updateSelection();
}

/**
 * Aggiorna la selezione dei timesheet e canoni
 */
export function updateSelection() {
  window.selectedTimesheet = [];
  window.selectedCanoni = [];
  let subtotale = 0;
  let countTimesheet = 0;
  let countCanoni = 0;
  
  document.querySelectorAll('.timesheet-checkbox:checked').forEach(checkbox => {
    const index = parseInt(checkbox.dataset.index);
    const rowIndex = parseInt(checkbox.dataset.row);
    const itemType = checkbox.dataset.itemType;
    const item = window.currentTimesheetData[index];
    
    if (itemType === 'CANONE') {
      // Per i canoni salva l'ID canone
      window.selectedCanoni.push({
        rowIndex: rowIndex,
        idCanone: checkbox.dataset.canoneId,
        importo: item.costo
      });
      countCanoni++;
    } else {
      // Per i timesheet salva il rowIndex
      window.selectedTimesheet.push(rowIndex);
      countTimesheet++;
    }
    
    subtotale += parseFloat(item.costo) || 0;
  });
  
  const totalCount = countTimesheet + countCanoni;
  const countText = [];
  if (countTimesheet > 0) countText.push(`${countTimesheet} timesheet`);
  if (countCanoni > 0) countText.push(`${countCanoni} canoni`);
  
  document.getElementById('selected-count').textContent = countText.join(' + ') || '0 elementi';
  document.getElementById('subtotale-preview').textContent = formatCurrency(subtotale);
  
  document.getElementById('proceed-to-step3-btn').disabled = totalCount === 0;
}

/**
 * Procede allo step 3 (configurazione proforma)
 */
export function proceedToStep3() {
  const totalSelected = window.selectedTimesheet.length + window.selectedCanoni.length;
  
  if (totalSelected === 0) {
    alert('Seleziona almeno un elemento (timesheet o canone)');
    return;
  }
  
  let lastDate = new Date(0);
  document.querySelectorAll('.timesheet-checkbox:checked').forEach(checkbox => {
    const dateStr = checkbox.dataset.date;
    if (dateStr) {
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime()) && dateObj > lastDate) {
        lastDate = dateObj;
      }
    }
  });
  
  let dateFormatted = 'data non disponibile';
  if (lastDate.getTime() > 0) {
    dateFormatted = lastDate.toLocaleDateString('it-IT');
  }
  
  document.getElementById('proforma_causale').value = `Per interventi, consulenze e formazione al ${dateFormatted}`;
  
  updateProformaTotals();
  showProformaStep(3);
}

/**
 * Aggiorna i totali della proforma
 */
export function updateProformaTotals() {
  let subtotale = 0;
  
  window.currentTimesheetData.forEach((row, index) => {
    if (window.selectedTimesheet.includes(row.rowIndex)) {
      subtotale += parseFloat(row.costo) || 0;
    }
  });
  
  const applicaQuota = document.getElementById('applica_quota').checked;
  const quotaIntegrativa = applicaQuota ? subtotale * 0.04 : 0;
  const imponibile = subtotale + quotaIntegrativa;
  const ritenuta = imponibile * 0.20;
  const iva = imponibile * 0.22;
  const lordo = imponibile + iva;
  const netto = lordo - ritenuta;
  
  document.getElementById('totale-subtotale').textContent = formatCurrency(subtotale);
  document.getElementById('totale-quota-row').style.display = applicaQuota ? 'flex' : 'none';
  document.getElementById('totale-quota').textContent = formatCurrency(quotaIntegrativa);
  document.getElementById('totale-imponibile').textContent = formatCurrency(imponibile);
  document.getElementById('totale-ritenuta').textContent = formatCurrency(ritenuta);
  document.getElementById('totale-iva').textContent = formatCurrency(iva);
  document.getElementById('totale-lordo').textContent = formatCurrency(lordo);
  document.getElementById('totale-netto').textContent = formatCurrency(netto);
}

/**
 * Genera e invia la proforma finale
 */
export async function generateProformaFinal() {
  const clientName = document.getElementById('proforma_client_select').value;
  const causale = document.getElementById('proforma_causale').value;
  const applicaQuota = document.getElementById('applica_quota').checked;
  
  if (!causale || causale.trim() === '') {
    alert('Inserisci una causale');
    return;
  }
  
  if (window.selectedTimesheet.length === 0) {
    alert('Nessun timesheet selezionato');
    return;
  }
  
  const generateBtn = document.getElementById('generate-proforma-final-btn');
  const proformaInfoBox = document.getElementById('proforma-info-box');
  
  generateBtn.textContent = 'Generazione in corso...';
  generateBtn.disabled = true;
  proformaInfoBox.innerHTML = '<p>⏳ Generazione proforma in corso...</p>';
  
  try {
    const data = await generateProforma(clientName, window.selectedTimesheet, causale, applicaQuota);
    
    proformaInfoBox.innerHTML = `
      <p style="color: #155724; background: #d4edda; padding: 15px !important; border-radius: 4px;">
        ✅ Proforma <strong>${data.proforma_number}</strong> generata e inviata!<br>
        Timesheet inclusi: ${data.timesheet_count}<br>
        Totale: € ${data.totale}
      </p>
    `;
    
    setTimeout(function() {
      showProformaStep(1);
      document.getElementById('proforma_client_select').value = '';
      proformaInfoBox.innerHTML = '<p>📄 Seleziona un cliente per iniziare</p>';
    }, 5000);
  } catch (error) {
    console.error('Errore:', error);
    proformaInfoBox.innerHTML = `<p style="color: #d32f2f;">❌ Errore: ${error.message}</p>`;
  } finally {
    generateBtn.textContent = 'Genera e Invia Proforma';
    generateBtn.disabled = false;
  }
}
// =======================================================================
// === 🆕 FUNZIONI FATTURA DIRETTA - DA AGGIUNGERE ALLA FINE DI proforma.js ===
// =======================================================================

/**
 * Switch tra viste in step 4
 */
function switchProformaView(view) {
  // Aggiorna tab buttons
  document.querySelectorAll('.proforma-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Mostra vista corretta
  document.getElementById('proforma-lista-view').style.display = view === 'lista' ? 'block' : 'none';
  document.getElementById('fattura-diretta-view').style.display = view === 'fattura-diretta' ? 'block' : 'none';
  
  if (view === 'lista') {
    populateProformaClientFilter();
    loadProformaList();
  }
}



/**
 * Apre modal per emettere fattura da proforma
 */
function openEmettiFatturaModal(nProforma, cliente, importo) {
  const modal = document.getElementById('emettiFatturaModal');
  if (!modal) {
    alert('⚠️ Modal non trovato nel DOM');
    return;
  }
  
  // Popola dati
  document.getElementById('fattura-nproforma').textContent = nProforma;
  document.getElementById('fattura-cliente').textContent = cliente;
  document.getElementById('fattura-importo').textContent = formatCurrency(importo);
  
  // Reset form
  document.getElementById('fattura-numero').value = '';
  document.getElementById('fattura-pagato').checked = false;
  
  modal.classList.add('active');
}

/**
 * Chiude modal emetti fattura
 */
function closeEmettiFatturaModal() {
  const modal = document.getElementById('emettiFatturaModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Submit emissione fattura
 */
async function submitEmettiFattura(e) {
  e.preventDefault();
  
  const nProforma = document.getElementById('fattura-nproforma').textContent;
  const numeroFattura = document.getElementById('fattura-numero').value;
  const pagato = document.getElementById('fattura-pagato').checked ? 'SI' : 'NO';
  
  if (!numeroFattura) {
    alert('⚠️ Inserisci il numero fattura');
    return;
  }
  
  const submitBtn = document.querySelector('#emettiFatturaForm button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Aggiornamento...';
  
  try {
    const url = `${API_URL}?action=update_numero_fattura&n_proforma=${encodeURIComponent(nProforma)}&numero_fattura=${encodeURIComponent(numeroFattura)}&pagato=${pagato}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Errore aggiornamento fattura');
    }
    
    alert('✅ Fattura emessa con successo!');
    closeEmettiFatturaModal();
    loadProformaList(); // Refresh lista
    
  } catch (error) {
    console.error('Errore emissione fattura:', error);
    alert('❌ Errore: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Esponi funzioni globalmente
window.openEmettiFatturaModal = openEmettiFatturaModal;
window.closeEmettiFatturaModal = closeEmettiFatturaModal;
window.submitEmettiFattura = submitEmettiFattura;
/**
 * Apre modal fattura diretta
 */
function openFatturaDirettaModal() {
  if (!window.selectedTimesheet || window.selectedTimesheet.length === 0) {
    alert('⚠️ Seleziona almeno un timesheet');
    return;
  }
  
  const clientName = document.getElementById('proforma_client_select').value;
  
  // Calcola subtotale
  let subtotale = 0;
  window.currentTimesheetData.forEach((row, index) => {
    if (window.selectedTimesheet.includes(row.rowIndex)) {
      subtotale += parseFloat(row.costo) || 0;
    }
  });
  
  // Popola modal
  document.getElementById('fattura-diretta-cliente').textContent = clientName;
  document.getElementById('fattura-diretta-count').textContent = window.selectedTimesheet.length;
  document.getElementById('fattura-diretta-subtotale').textContent = formatCurrency(subtotale);
  
  // Imposta causale default
  const oggi = new Date().toLocaleDateString('it-IT');
  document.getElementById('fattura-diretta-causale').value = `Servizi di consulenza e formazione al ${oggi}`;
  
  // Reset checkbox
  document.getElementById('fattura-diretta-quota').checked = false;
  document.getElementById('fattura-diretta-pagato').checked = false;
  
  // Aggiorna totali preview
  updateFatturaDirettaTotals();
  
  // Mostra modal
  const modal = document.getElementById('fatturaDirettaModal');
  modal.classList.add('active');
}

/**
 * Chiude modal fattura diretta
 */
function closeFatturaDirettaModal() {
  const modal = document.getElementById('fatturaDirettaModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Aggiorna totali preview fattura diretta
 */
function updateFatturaDirettaTotals() {
  let subtotale = 0;
  window.currentTimesheetData.forEach((row, index) => {
    if (window.selectedTimesheet.includes(row.rowIndex)) {
      subtotale += parseFloat(row.costo) || 0;
    }
  });
  
  const applicaQuota = document.getElementById('fattura-diretta-quota').checked;
  const quotaIntegrativa = applicaQuota ? subtotale * 0.04 : 0;
  const imponibile = subtotale + quotaIntegrativa;
  const iva = imponibile * 0.22;
  const totale = imponibile + iva;
  
  document.getElementById('fd-preview-subtotale').textContent = formatCurrency(subtotale);
  document.getElementById('fd-quota-row').style.display = applicaQuota ? 'flex' : 'none';
  document.getElementById('fd-preview-quota').textContent = formatCurrency(quotaIntegrativa);
  document.getElementById('fd-preview-imponibile').textContent = formatCurrency(imponibile);
  document.getElementById('fd-preview-iva').textContent = formatCurrency(iva);
  document.getElementById('fd-preview-totale').textContent = formatCurrency(totale);
}

/**
 * Genera fattura diretta finale
 */
async function generateFatturaDirettaFinal(event) {
  event.preventDefault();
  
  const clientName = document.getElementById('proforma_client_select').value;
  const numeroFattura = document.getElementById('fattura-diretta-numero').value.trim();
  const causale = document.getElementById('fattura-diretta-causale').value.trim();
  const applicaQuota = document.getElementById('fattura-diretta-quota').checked;
  const pagato = document.getElementById('fattura-diretta-pagato').checked;
  
  if (!numeroFattura) {
    alert('⚠️ Inserisci il numero fattura');
    return;
  }
  
  if (!causale) {
    alert('⚠️ Inserisci la causale');
    return;
  }
  
  const submitBtn = document.getElementById('fattura-diretta-submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Generazione in corso...';
  
  try {
    const API_URL = window.CONFIG?.APPS_SCRIPT_URL || '';
    
    const params = new URLSearchParams({
      action: 'generate_fattura_diretta',
      client_name: clientName,
      timesheet_ids: window.selectedTimesheet.join(','),
      numero_fattura: numeroFattura,
      causale: causale,
      applica_quota: applicaQuota,
      pagato: pagato
    });
    
    const response = await fetch(`${API_URL}?${params}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Errore generazione fattura');
    }
    
    alert(`✅ Fattura ${numeroFattura} generata e sincronizzata!\n\n` +
          `Cliente: ${result.cliente}\n` +
          `Timesheet: ${result.timesheet_count}\n` +
          `Totale: € ${result.totale}\n\n` +
          `La fattura è stata registrata in "Fatture Smart".`);
    
    closeFatturaDirettaModal();
    
    // Reset e torna a step 1
    setTimeout(() => {
      showProformaStep(1);
      document.getElementById('proforma_client_select').value = '';
    }, 1000);
    
  } catch (error) {
    console.error('Errore:', error);
    alert('❌ Errore: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Event listener per checkbox quota
document.addEventListener('DOMContentLoaded', function() {
  const quotaCheckbox = document.getElementById('fattura-diretta-quota');
  if (quotaCheckbox) {
    quotaCheckbox.addEventListener('change', updateFatturaDirettaTotals);
  }
});

// Esponi funzioni globalmente per onclick HTML
window.switchProformaView = switchProformaView;
window.openFatturaDirettaModal = openFatturaDirettaModal;
window.closeFatturaDirettaModal = closeFatturaDirettaModal;
window.generateFatturaDirettaFinal = generateFatturaDirettaFinal;

// Esponi funzioni lista proforma globalmente per onclick HTML
window.openEmettiFatturaModal = openEmettiFatturaModal;
window.closeEmettiFatturaModal = closeEmettiFatturaModal;
window.submitEmettiFattura = submitEmettiFattura;
