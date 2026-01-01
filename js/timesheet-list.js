// =======================================================================
// === TIMESHEET LIST MODAL - Gestione Elenco Timesheet ===
// =======================================================================

let allTimesheetData = [];
let filteredTimesheetData = [];

// =======================================================================
// === APERTURA/CHIUSURA MODAL ===
// =======================================================================

/**
 * Apre il modal e carica i timesheet
 */
async function openTimesheetListModal() {
    const modal = document.getElementById('timesheet-list-modal');
    modal.style.display = 'block';
    
    // Carica opzioni filtri
    await loadFilterOptions();
    
    // Carica timesheet
    await loadAllTimesheet();
}

/**
 * Chiude il modal
 */
function closeTimesheetListModal() {
    const modal = document.getElementById('timesheet-list-modal');
    modal.style.display = 'none';
}

// Chiudi modal cliccando fuori
window.onclick = function(event) {
    const modal = document.getElementById('timesheet-list-modal');
    if (event.target === modal) {
        closeTimesheetListModal();
    }
}

// =======================================================================
// === CARICAMENTO DATI ===
// =======================================================================

/**
 * Carica le opzioni per i filtri (clienti, tipi intervento)
 */
async function loadFilterOptions() {
    try {
        // Carica clienti
        const clientiSelect = document.getElementById('filter-cliente');
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=get_data`);
        const data = await response.json();
        
        if (data.success && data.data.clienti) {
            clientiSelect.innerHTML = '<option value="">Tutti i clienti</option>';
            data.data.clienti.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.name;
                option.textContent = cliente.name;
                clientiSelect.appendChild(option);
            });
        }
        
        // Carica tipi intervento
        if (data.success && data.data.tipoIntervento) {
            const tipoSelect = document.getElementById('filter-tipo');
            tipoSelect.innerHTML = '<option value="">Tutti</option>';
            data.data.tipoIntervento.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                tipoSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Errore caricamento opzioni filtri:', error);
    }
}

/**
 * Carica tutti i timesheet dal backend
 */
async function loadAllTimesheet(filters = {}) {
    const loading = document.getElementById('timesheet-list-loading');
    const tableContainer = document.getElementById('timesheet-list-table-container');
    const emptyMsg = document.getElementById('timesheet-list-empty');
    
    loading.style.display = 'block';
    tableContainer.style.display = 'none';
    emptyMsg.style.display = 'none';
    
    try {
        // Costruisci URL con filtri
        let url = `${CONFIG.APPS_SCRIPT_URL}?action=get_all_timesheet`;
        
        if (filters.cliente) {
            url += `&cliente=${encodeURIComponent(filters.cliente)}`;
        }
        if (filters.dataInizio) {
            url += `&data_inizio=${filters.dataInizio}`;
        }
        if (filters.dataFine) {
            url += `&data_fine=${filters.dataFine}`;
        }
        if (filters.tipoIntervento) {
            url += `&tipo_intervento=${encodeURIComponent(filters.tipoIntervento)}`;
        }
        if (filters.modAddebito) {
            url += `&mod_addebito=${encodeURIComponent(filters.modAddebito)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        loading.style.display = 'none';
        
        if (data.success && data.timesheet) {
            allTimesheetData = data.timesheet;
            filteredTimesheetData = data.timesheet;
            
            if (data.timesheet.length > 0) {
                renderTimesheetTable(data.timesheet);
                updateStats(data.timesheet);
                tableContainer.style.display = 'block';
            } else {
                emptyMsg.style.display = 'block';
            }
        } else {
            throw new Error(data.error || 'Errore caricamento timesheet');
        }
        
    } catch (error) {
        console.error('Errore caricamento timesheet:', error);
        loading.style.display = 'none';
        emptyMsg.style.display = 'block';
        alert('❌ Errore durante il caricamento dei timesheet');
    }
}

// =======================================================================
// === RENDERING TABELLA ===
// =======================================================================

/**
 * Renderizza la tabella timesheet
 */
function renderTimesheetTable(timesheetList) {
    const tbody = document.getElementById('timesheet-list-tbody');
    tbody.innerHTML = '';
    
    timesheetList.forEach(ts => {
        const row = document.createElement('tr');
        
        // Determina classe badge stato
        let badgeClass = 'badge-status';
        const modAddebito = ts.modAddebito || '';
        
        if (modAddebito === 'Da fatturare') {
            badgeClass += ' status-da-fatturare';
        } else if (modAddebito === 'Proformato') {
            badgeClass += ' status-proformato';
        } else if (modAddebito === 'Fatturato') {
            badgeClass += ' status-fatturato';
        } else if (modAddebito === 'Scalato') {
            badgeClass += ' status-scalato';
        }
        
        row.innerHTML = `
            <td>${ts.data || '-'}</td>
            <td>${ts.cliente || '-'}</td>
            <td>${ts.tipoIntervento || '-'}</td>
            <td>${ts.modEsecuzione || '-'}</td>
            <td style="text-align: center;">${ts.ore || '0'}</td>
            <td style="text-align: right;">€ ${parseFloat(ts.importo || 0).toFixed(2)}</td>
            <td><span class="${badgeClass}">${modAddebito || 'N/D'}</span></td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ts.descrizione || '-'}</td>
            <td>
                <div class="timesheet-actions">
                    <button class="timesheet-action-btn" onclick="editTimesheetFromList('${ts.idIntervento}', ${ts.rowIndex})" title="Modifica">
                        ✏️
                    </button>
                    <button class="timesheet-action-btn" onclick="deleteTimesheetFromList('${ts.idIntervento}', ${ts.rowIndex})" title="Elimina" style="color: #dc3545;">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Aggiorna statistiche
 */
function updateStats(timesheetList) {
    let totaleOre = 0;
    let totaleImporto = 0;
    
    timesheetList.forEach(ts => {
        totaleOre += parseFloat(ts.ore || 0);
        totaleImporto += parseFloat(ts.importo || 0);
    });
    
    document.getElementById('stat-totale-ore').textContent = totaleOre.toFixed(1);
    document.getElementById('stat-interventi').textContent = timesheetList.length;
    document.getElementById('stat-importo').textContent = `€ ${totaleImporto.toFixed(2)}`;
}

// =======================================================================
// === FILTRI ===
// =======================================================================

/**
 * Applica i filtri selezionati
 */
async function applyTimesheetFilters() {
    const filters = {
        cliente: document.getElementById('filter-cliente').value,
        dataInizio: document.getElementById('filter-data-inizio').value,
        dataFine: document.getElementById('filter-data-fine').value,
        tipoIntervento: document.getElementById('filter-tipo').value,
        modAddebito: document.getElementById('filter-mod-addebito').value
    };
    
    await loadAllTimesheet(filters);
}

/**
 * Reset filtri
 */
function resetTimesheetFilters() {
    document.getElementById('filter-cliente').value = '';
    document.getElementById('filter-data-inizio').value = '';
    document.getElementById('filter-data-fine').value = '';
    document.getElementById('filter-tipo').value = '';
    document.getElementById('filter-mod-addebito').value = '';
    
    loadAllTimesheet();
}

// =======================================================================
// === AZIONI TIMESHEET ===
// =======================================================================

/**
 * Modifica timesheet (da implementare)
 */
function editTimesheetFromList(idIntervento, rowIndex) {
    alert(`🚧 Funzione in sviluppo\n\nModifica timesheet: ${idIntervento}\nRiga: ${rowIndex}`);
    // TODO: Aprire modal modifica o redirect a form
}

/**
 * Elimina timesheet (da implementare)
 */
async function deleteTimesheetFromList(idIntervento, rowIndex) {
    const confirm = window.confirm(`⚠️ Sei sicuro di voler eliminare il timesheet ${idIntervento}?\n\nQuesta operazione è irreversibile.`);
    
    if (!confirm) return;
    
    alert(`🚧 Funzione in sviluppo\n\nElimina timesheet: ${idIntervento}\nRiga: ${rowIndex}`);
    
    // TODO: Chiamata backend per eliminazione
    // try {
    //     const url = `${CONFIG.APPS_SCRIPT_URL}?action=delete_timesheet&row=${rowIndex}`;
    //     const response = await fetch(url);
    //     const data = await response.json();
    //     
    //     if (data.success) {
    //         alert('✅ Timesheet eliminato con successo');
    //         await loadAllTimesheet();
    //     } else {
    //         throw new Error(data.error);
    //     }
    // } catch (error) {
    //     console.error('Errore eliminazione:', error);
    //     alert('❌ Errore durante l\'eliminazione del timesheet');
    // }
}

// =======================================================================
// === EXPORT CSV ===
// =======================================================================

/**
 * Esporta timesheet in CSV
 */
function exportTimesheetCSV() {
    if (!filteredTimesheetData || filteredTimesheetData.length === 0) {
        alert('⚠️ Nessun dato da esportare');
        return;
    }
    
    // Header CSV
    const headers = ['ID', 'Data', 'Cliente', 'Tipo', 'Modalità', 'Ore', 'Importo', 'Stato', 'Descrizione'];
    let csv = headers.join(';') + '\n';
    
    // Righe dati
    filteredTimesheetData.forEach(ts => {
        const row = [
            ts.idIntervento || '',
            ts.data || '',
            ts.cliente || '',
            ts.tipoIntervento || '',
            ts.modEsecuzione || '',
            ts.ore || '0',
            ts.importo || '0',
            ts.modAddebito || '',
            `"${(ts.descrizione || '').replace(/"/g, '""')}"` // Escape virgolette
        ];
        csv += row.join(';') + '\n';
    });
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_export_${today}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ Export CSV completato!');
}
