// =======================================================================
// === CLIENTI - GESTIONE COMPLETA ===
// =======================================================================

// Importa CONFIG dall'applicazione principale
const CONFIG = window.CONFIG || { APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxrpkmfBlraaYihYYtJB0uvg8K60sPM-9uLmybcqoiVM6rSabZe6QK_-00L9CGAFwdo/exec' };

let currentCliente = null;
let allClienti = [];

// =======================================================================
// === FUNZIONE HELPER PER NOTIFICHE ===
// =======================================================================

/**
 * Mostra una notifica nella info-box
 */
function showNotification(elementId, message, type) {
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.error('❌ Elemento non trovato:', elementId);
        if (type === 'error') alert(message);
        return;
    }
    
    element.className = 'info-box';
    
    if (type === 'success') {
        element.className = 'info-box success';
        element.style.backgroundColor = '#d4edda';
        element.style.borderColor = '#c3e6cb';
        element.style.color = '#155724';
    } else if (type === 'error') {
        element.className = 'info-box error';
        element.style.backgroundColor = '#f8d7da';
        element.style.borderColor = '#f5c6cb';
        element.style.color = '#721c24';
    } else if (type === 'warning') {
        element.className = 'info-box warning';
        element.style.backgroundColor = '#fff3cd';
        element.style.borderColor = '#ffeaa7';
        element.style.color = '#856404';
    } else {
        element.style.backgroundColor = '#d1ecf1';
        element.style.borderColor = '#bee5eb';
        element.style.color = '#0c5460';
    }
    
    element.innerHTML = '<p>' + message + '</p>';
    
    if (type === 'success') {
        setTimeout(() => {
            element.className = 'info-box';
            element.style.backgroundColor = '';
            element.style.borderColor = '';
            element.style.color = '';
            element.innerHTML = '<p>Cerca, visualizza e modifica i dati dei tuoi clienti</p>';
        }, 5000);
    }
}

// =======================================================================
// === RICERCA CLIENTI ===
// =======================================================================

/**
 * Ricerca clienti per nome, P.IVA, CF, email
 */
async function searchCliente() {
    const searchTerm = document.getElementById('cliente-search').value.trim();
    
    if (!searchTerm) {
        alert('Inserisci un termine di ricerca');
        return;
    }
    
    try {
        showNotification('clienti-info', '⏳ Ricerca in corso...', 'info');
        
        // Importa CONFIG dalla window
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=search_clienti&search=${encodeURIComponent(searchTerm)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.clienti) {
            displaySearchResults(data.clienti);
            showNotification('clienti-info', `✅ Trovati ${data.clienti.length} clienti`, 'success');
        } else {
            throw new Error(data.error || 'Errore ricerca');
        }
        
    } catch (error) {
        console.error('Errore ricerca clienti:', error);
        showNotification('clienti-info', '❌ Errore durante la ricerca', 'error');
    }
}

/**
 * Mostra i risultati della ricerca
 */
function displaySearchResults(clienti) {
    const resultsDiv = document.getElementById('search-results');
    const resultsList = document.getElementById('search-results-list');
    
    if (clienti.length === 0) {
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = '<p class="empty-state">Nessun cliente trovato</p>';
        return;
    }
    
    allClienti = clienti;
    
    let html = '';
    clienti.forEach(cliente => {
        const isAttivo = cliente.attivo === 'SI';
        const statusClass = isAttivo ? 'attivo' : 'non-attivo';
        const statusText = isAttivo ? '✅ Attivo' : '❌ Non Attivo';
        
        html += `
            <div class="cliente-card" onclick="loadClienteDetail('${cliente.id}')">
                <div class="cliente-card-header">
                    <span class="cliente-card-name">${cliente.nome}</span>
                    <span class="cliente-card-status ${statusClass}">${statusText}</span>
                </div>
                <div class="cliente-card-body">
                    ${cliente.id ? `<div class="cliente-card-info">🆔 ${cliente.id}</div>` : ''}
                    ${cliente.email ? `<div class="cliente-card-info">📧 ${cliente.email}</div>` : ''}
                    ${cliente.piva ? `<div class="cliente-card-info">🏢 P.IVA: ${cliente.piva}</div>` : ''}
                    ${cliente.cf ? `<div class="cliente-card-info">🆔 CF: ${cliente.cf}</div>` : ''}
                    ${cliente.citta ? `<div class="cliente-card-info">📍 ${cliente.citta}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    resultsList.innerHTML = html;
    resultsDiv.style.display = 'block';
}

// =======================================================================
// === DETTAGLIO CLIENTE ===
// =======================================================================

/**
 * Carica i dettagli di un cliente
 */
async function loadClienteDetail(clienteId) {
    try {
        showNotification('clienti-info', '⏳ Caricamento dettagli...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_cliente&id=${encodeURIComponent(clienteId)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.cliente) {
            currentCliente = data.cliente;
            showClienteDetail(data.cliente);
            loadClienteProdotti(clienteId);
            loadClienteTimesheet(clienteId);
            showNotification('clienti-info', '✅ Cliente caricato', 'success');
        } else {
            throw new Error(data.error || 'Errore caricamento');
        }
        
    } catch (error) {
        console.error('Errore caricamento cliente:', error);
        showNotification('clienti-info', '❌ Errore caricamento cliente', 'error');
    }
}

/**
 * Mostra il form con i dettagli del cliente
 */
function showClienteDetail(cliente) {
    // Popola il form
    document.getElementById('edit-id-cliente').value = cliente.id || '';
    document.getElementById('edit-nome-cliente').value = cliente.nome || '';
    document.getElementById('edit-titolo').value = cliente.titolo || '';
    document.getElementById('edit-indirizzo').value = cliente.indirizzo || '';
    document.getElementById('edit-cap').value = cliente.cap || '';
    document.getElementById('edit-citta').value = cliente.citta || '';
    document.getElementById('edit-piva').value = cliente.piva || '';
    document.getElementById('edit-cf').value = cliente.cf || '';
    document.getElementById('edit-sdi').value = cliente.sdi || '';
    document.getElementById('edit-email').value = cliente.email || '';
    document.getElementById('edit-referente').value = cliente.referente || '';
    document.getElementById('edit-attivo').value = cliente.attivo || 'SI';
    
    // Mostra le sezioni
    document.getElementById('cliente-detail-section').style.display = 'block';
    document.getElementById('cliente-prodotti-section').style.display = 'block';
    document.getElementById('cliente-timesheet-section').style.display = 'block';
    
    // Scroll alla sezione dettaglio
    document.getElementById('cliente-detail-section').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Chiude il dettaglio cliente
 */
function closeClienteDetail() {
    currentCliente = null;
    document.getElementById('cliente-detail-section').style.display = 'none';
    document.getElementById('cliente-prodotti-section').style.display = 'none';
    document.getElementById('cliente-timesheet-section').style.display = 'none';
    document.getElementById('cliente-form').reset();
}

// =======================================================================
// === SALVATAGGIO CLIENTE ===
// =======================================================================

/**
 * Gestisce il submit del form cliente
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cliente-form');
    if (form) {
        form.addEventListener('submit', saveClienteChanges);
    }
});

/**
 * Salva le modifiche al cliente o crea un nuovo cliente
 */
async function saveClienteChanges(event) {
    event.preventDefault();
    
    const isNew = currentCliente && currentCliente.isNew;
    const actionType = isNew ? 'create_cliente' : 'update_cliente';
    
    const clienteData = {
        nome: document.getElementById('edit-nome-cliente').value,
        titolo: document.getElementById('edit-titolo').value,
        indirizzo: document.getElementById('edit-indirizzo').value,
        cap: document.getElementById('edit-cap').value,
        citta: document.getElementById('edit-citta').value,
        piva: document.getElementById('edit-piva').value,
        cf: document.getElementById('edit-cf').value,
        sdi: document.getElementById('edit-sdi').value,
        email: document.getElementById('edit-email').value,
        referente: document.getElementById('edit-referente').value,
        attivo: document.getElementById('edit-attivo').value
    };
    
    // Se non è nuovo, aggiungi l'ID
    if (!isNew) {
        clienteData.id = document.getElementById('edit-id-cliente').value;
    }
    
    if (!clienteData.nome) {
        alert('Il nome del cliente è obbligatorio');
        return;
    }
    
    try {
        const messagePrefix = isNew ? 'Creazione' : 'Salvataggio';
        showNotification('clienti-info', `⏳ ${messagePrefix} in corso...`, 'info');
        
        // Importa CONFIG dalla window se non è definito
        
        const url = `${CONFIG.APPS_SCRIPT_URL}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: actionType,
                ...clienteData
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (isNew) {
                showNotification('clienti-info', `✅ Cliente creato con successo! ID: ${data.clienteId}`, 'success');
                
                // Carica il cliente appena creato
                setTimeout(() => {
                    loadClienteDetail(data.clienteId);
                }, 1000);
            } else {
                showNotification('clienti-info', '✅ Cliente aggiornato con successo', 'success');
                currentCliente = clienteData;
                
                // Ricarica la ricerca se c'è un termine
                const searchTerm = document.getElementById('cliente-search').value;
                if (searchTerm) {
                    searchCliente();
                }
            }
        } else {
            throw new Error(data.error || `Errore ${messagePrefix.toLowerCase()}`);
        }
        
    } catch (error) {
        console.error('Errore salvataggio cliente:', error);
        const messagePrefix = isNew ? 'creazione' : 'salvataggio';
        showNotification('clienti-info', `❌ Errore durante ${messagePrefix}`, 'error');
    }
}

// =======================================================================
// === NUOVO CLIENTE ===
// =======================================================================

/**
 * Mostra il form per un nuovo cliente
 */
function openNewClienteForm() {
    currentCliente = { id: '', isNew: true };
    
    // Reset del form
    document.getElementById('cliente-form').reset();
    document.getElementById('edit-id-cliente').value = '(Verrà assegnato automaticamente)';
    document.getElementById('edit-attivo').value = 'SI';
    
    // Mostra solo la sezione dettaglio
    document.getElementById('cliente-detail-section').style.display = 'block';
    document.getElementById('cliente-prodotti-section').style.display = 'none';
    document.getElementById('cliente-timesheet-section').style.display = 'none';
    
    // Scroll alla sezione
    document.getElementById('cliente-detail-section').scrollIntoView({ behavior: 'smooth' });
    
    showNotification('clienti-info', 'ℹ️ Compilare i dati del nuovo cliente', 'info');
}


// =======================================================================
// === ASSEGNAZIONE ID MANCANTI ===
// =======================================================================

/**
 * Assegna ID a tutti i clienti che non ne hanno uno
 */
async function assignMissingClientIDs() {
    if (!confirm('Vuoi assegnare automaticamente gli ID ai clienti che non ne hanno uno?')) {
        return;
    }
    
    try {
        showNotification('clienti-info', '⏳ Assegnazione ID in corso...', 'info');
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=assign_missing_ids`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            showNotification('clienti-info', `✅ Assegnati ${data.assigned} ID`, 'success');
        } else {
            throw new Error(data.error || 'Errore assegnazione');
        }
        
    } catch (error) {
        console.error('Errore assegnazione ID:', error);
        showNotification('clienti-info', '❌ Errore durante l\'assegnazione', 'error');
    }
}

// =======================================================================
// === PRODOTTI CLIENTE ===
// =======================================================================

/**
 * Carica i prodotti attivi del cliente
 */
async function loadClienteProdotti(clienteId) {
    try {
        const contentDiv = document.getElementById('cliente-prodotti-content');
        contentDiv.innerHTML = '<p class="text-muted">⏳ Caricamento prodotti...</p>';
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_cliente_prodotti&id=${encodeURIComponent(clienteId)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            displayClienteProdotti(data.prodotti);
        } else {
            contentDiv.innerHTML = '<p class="empty-state">Errore caricamento prodotti</p>';
        }
        
    } catch (error) {
        console.error('Errore caricamento prodotti:', error);
        document.getElementById('cliente-prodotti-content').innerHTML = 
            '<p class="empty-state">Errore caricamento prodotti</p>';
    }
}

/**
 * Visualizza i prodotti del cliente
 */
function displayClienteProdotti(prodotti) {
    const contentDiv = document.getElementById('cliente-prodotti-content');
    
    if (!prodotti || prodotti.length === 0) {
        contentDiv.innerHTML = '<p class="empty-state">Nessun prodotto attivo per questo cliente</p>';
        return;
    }
    
    let html = '';
    
    prodotti.forEach(prodotto => {
        const tipoClass = prodotto.tipo.toLowerCase();
        const statusClass = prodotto.stato.toLowerCase().replace(' ', '-');
        
        html += `
            <div class="prodotto-item">
                <div class="prodotto-header">
                    <span class="prodotto-type ${tipoClass}">${getEmojiForType(prodotto.tipo)} ${prodotto.tipo}</span>
                    <span class="prodotto-status ${statusClass}">${prodotto.stato}</span>
                </div>
                <div class="prodotto-body">
                    ${prodotto.descrizione ? `
                    <div class="prodotto-info-item">
                        <span class="prodotto-info-label">Descrizione</span>
                        <span class="prodotto-info-value">${prodotto.descrizione}</span>
                    </div>` : ''}
                    ${prodotto.dataInizio ? `
                    <div class="prodotto-info-item">
                        <span class="prodotto-info-label">Data Inizio</span>
                        <span class="prodotto-info-value">${prodotto.dataInizio}</span>
                    </div>` : ''}
                    ${prodotto.dataScadenza ? `
                    <div class="prodotto-info-item">
                        <span class="prodotto-info-label">Scadenza</span>
                        <span class="prodotto-info-value">${prodotto.dataScadenza}</span>
                    </div>` : ''}
                    ${prodotto.oreResidue !== undefined ? `
                    <div class="prodotto-info-item">
                        <span class="prodotto-info-label">Ore Residue</span>
                        <span class="prodotto-info-value">${prodotto.oreResidue}h</span>
                    </div>` : ''}
                    ${prodotto.importo ? `
                    <div class="prodotto-info-item">
                        <span class="prodotto-info-label">Importo</span>
                        <span class="prodotto-info-value">€ ${prodotto.importo}</span>
                    </div>` : ''}
                </div>
                ${prodotto.canRenew ? `
                <div class="prodotto-actions">
                    <button class="btn btn-sm btn-primary" onclick="renewProduct('${prodotto.id}', '${prodotto.tipo}')">
                        🔄 Rinnova
                    </button>
                </div>` : ''}
            </div>
        `;
    });
    
    contentDiv.innerHTML = html;
}

/**
 * Restituisce l'emoji per il tipo di prodotto
 */
function getEmojiForType(tipo) {
    const emojis = {
        'Pacchetto': '📦',
        'Canone': '💰',
        'Firma': '✍️'
    };
    return emojis[tipo] || '📄';
}

// =======================================================================
// === TIMESHEET CLIENTE ===
// =======================================================================

/**
 * Carica i timesheet non fatturati del cliente
 */
async function loadClienteTimesheet(clienteId) {
    try {
        const contentDiv = document.getElementById('cliente-timesheet-content');
        contentDiv.innerHTML = '<p class="text-muted">⏳ Caricamento timesheet...</p>';
        
        const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_cliente_timesheet&id=${encodeURIComponent(clienteId)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            displayClienteTimesheet(data.timesheet);
        } else {
            contentDiv.innerHTML = '<p class="empty-state">Errore caricamento timesheet</p>';
        }
        
    } catch (error) {
        console.error('Errore caricamento timesheet:', error);
        document.getElementById('cliente-timesheet-content').innerHTML = 
            '<p class="empty-state">Errore caricamento timesheet</p>';
    }
}

/**
 * Visualizza i timesheet del cliente
 */
function displayClienteTimesheet(timesheet) {
    const contentDiv = document.getElementById('cliente-timesheet-content');
    
    if (!timesheet || timesheet.length === 0) {
        contentDiv.innerHTML = '<p class="empty-state">Nessun timesheet da fatturare per questo cliente</p>';
        return;
    }
    
    let html = `
        <table class="timesheet-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Descrizione</th>
                    <th>Ore</th>
                    <th>Tipo</th>
                    <th>Modalità</th>
                    <th>Azioni</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    timesheet.forEach(ts => {
        html += `
            <tr>
                <td>${ts.data}</td>
                <td>${ts.descrizione}</td>
                <td>${ts.ore}h</td>
                <td>${ts.tipoIntervento}</td>
                <td>${ts.modEsecuzione}</td>
                <td class="actions-column">
                    <button class="timesheet-edit-btn" onclick="editTimesheet('${ts.id}')">
                        ✏️ Modifica
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    contentDiv.innerHTML = html;
}

/**
 * Modifica un timesheet (da implementare con modal)
 */
function editTimesheet(timesheetId) {
    // TODO: Implementare modal di modifica timesheet
    alert('Funzione di modifica timesheet in arrivo!');
}

/**
 * Rinnova un prodotto
 */
function renewProduct(productId, productType) {
    // TODO: Integrare con la funzione di rinnovo esistente
    alert('Funzione di rinnovo prodotto in arrivo!');
}

console.log('✅ Clienti module caricato');
