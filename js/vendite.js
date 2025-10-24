// ========================================
// VENDITE TAB - JavaScript
// ========================================

let scadenzeData = null;

/**
 * Inizializza la tab Vendite
 * Chiamata quando l'utente clicca sulla tab
 */
function initVenditeTab() {
    loadVenditaClienti();
    loadScadenze();
    setVenditaDefaultDate();
}

/**
 * Imposta la data di default (oggi) nel form vendita
 */
function setVenditaDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('venditaDataInizio');
    if (dateInput) {
        dateInput.value = today;
    }
}

/**
 * Carica la lista clienti nel dropdown vendita
 */
async function loadVenditaClienti() {
    try {
        const select = document.getElementById('venditaCliente');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleziona cliente...</option>';
        
        // Usa la lista clienti già caricata globalmente
        if (typeof clientsList !== 'undefined' && clientsList.length > 0) {
            clientsList.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente;
                option.textContent = cliente;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">Errore caricamento clienti</option>';
        }
    } catch (error) {
        console.error('Errore caricamento clienti vendite:', error);
    }
}

/**
 * Carica le scadenze dal backend
 */
async function loadScadenze() {
    const container = document.getElementById('scadenzeContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-scadenze">Caricamento scadenze...</div>';
    
    try {
        // Usa l'API_URL globale già definito in index.html
        const response = await fetch(`${API_URL}?action=get_scadenze&giorni=90`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Errore sconosciuto');
        }
        
        scadenzeData = result.data;
        renderScadenze(scadenzeData);
        
    } catch (error) {
        console.error('Errore caricamento scadenze:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div>Errore caricamento scadenze</div>
                <div style="font-size: 12px; margin-top: 8px; color: #999;">${error.message}</div>
            </div>
        `;
    }
}

/**
 * Renderizza la lista scadenze
 */
function renderScadenze(data) {
    const container = document.getElementById('scadenzeContainer');
    if (!container) return;
    
    if (!data.tutti || data.tutti.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div>Nessun prodotto in scadenza</div>
                <div style="font-size: 12px; margin-top: 8px; color: #999;">Prossimi 90 giorni</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    container.className = 'scadenze-list';
    
    data.tutti.forEach(prodotto => {
        const card = createScadenzaCard(prodotto);
        container.appendChild(card);
    });
}

/**
 * Crea una card per una singola scadenza
 */
function createScadenzaCard(prodotto) {
    const card = document.createElement('div');
    const urgenzaClass = prodotto.urgenza === 'ALTA' ? 'urgente' : 
                         prodotto.urgenza === 'MEDIA' ? 'media' : 'bassa';
    
    card.className = `scadenza-card ${urgenzaClass}`;
    
    const id = prodotto.tipoProdotto === 'CANONE' ? prodotto.idCanone : prodotto.idFirma;
    const tipo = prodotto.tipoProdotto === 'CANONE' ? 'Canone' : 'Firma';
    const dataScadenza = new Date(prodotto.dataScadenza).toLocaleDateString('it-IT');
    
    let dettagli = '';
    if (prodotto.tipoProdotto === 'CANONE' && prodotto.descrizione) {
        dettagli = ` • ${prodotto.descrizione}`;
    } else if (prodotto.tipoProdotto === 'FIRMA') {
        dettagli = ` • ${prodotto.tipo}`;
    }
    
    card.innerHTML = `
        <div class="scadenza-info">
            <div class="scadenza-id">
                ${tipo}: ${id}
                <span class="scadenza-urgenza urgenza-${prodotto.urgenza.toLowerCase()}">
                    ${prodotto.giorniMancanti} giorni
                </span>
            </div>
            <div class="scadenza-cliente">${prodotto.nomeCliente}</div>
            <div class="scadenza-data">Scadenza: ${dataScadenza}${dettagli}</div>
        </div>
        <button class="btn-rinnova" onclick="openRinnovoModal('${id}', '${prodotto.tipoProdotto}')">
            Rinnova
        </button>
    `;
    
    return card;
}

/**
 * Apre il modal per nuova vendita
 * @param {string} tipo - 'pacchetto', 'canone' o 'firma'
 */
function openVenditaModal(tipo) {
    const modal = document.getElementById('venditaModal');
    const form = document.getElementById('venditaForm');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    setVenditaDefaultDate();
    
    // Imposta tipo
    const tipoInput = document.getElementById('tipoVendita');
    if (tipoInput) tipoInput.value = tipo;
    
    // Configura modal in base al tipo
    const modalTitle = document.getElementById('modalVenditaTitle');
    const tipoFirmaGroup = document.getElementById('venditaTipoFirmaGroup');
    const durataGroup = document.getElementById('venditaDurataGroup');
    const durataLabel = document.getElementById('venditaDurataLabel');
    const durataInput = document.getElementById('venditaDurataAnni');
    const descrizioneLabel = document.getElementById('venditaDescrizioneLabel');
    
    if (tipo === 'pacchetto') {
        if (modalTitle) modalTitle.textContent = '📦 Nuovo Pacchetto Ore';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'none';
        if (durataGroup) durataGroup.style.display = 'none';
        if (descrizioneLabel) descrizioneLabel.textContent = 'Descrizione';
    } else if (tipo === 'canone') {
        if (modalTitle) modalTitle.textContent = '📅 Nuovo Canone';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'none';
        if (durataGroup) durataGroup.style.display = 'block';
        if (durataLabel) durataLabel.textContent = 'Durata (anni)';
        if (durataInput) durataInput.value = 1;
        if (descrizioneLabel) descrizioneLabel.textContent = 'Descrizione';
    } else if (tipo === 'firma') {
        if (modalTitle) modalTitle.textContent = '✍️ Nuova Firma Digitale';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'block';
        if (durataGroup) durataGroup.style.display = 'block';
        if (durataLabel) durataLabel.textContent = 'Durata (anni)';
        if (durataInput) durataInput.value = 3;
        if (descrizioneLabel) descrizioneLabel.textContent = 'Note (opzionali)';
    }
    
    modal.classList.add('active');
}

/**
 * Chiude il modal vendita
 */
function closeVenditaModal() {
    const modal = document.getElementById('venditaModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Submit form vendita
 */
async function submitVendita(e) {
    e.preventDefault();
    
    const tipo = document.getElementById('tipoVendita').value;
    const cliente = document.getElementById('venditaCliente').value;
    const descrizione = document.getElementById('venditaDescrizione').value;
    const importo = document.getElementById('venditaImporto').value;
    const dataInizio = document.getElementById('venditaDataInizio').value;
    const durataAnni = document.getElementById('venditaDurataAnni').value;
    
    if (!cliente) {
        alert('⚠️ Seleziona un cliente');
        return;
    }
    
    if (!importo || importo <= 0) {
        alert('⚠️ Inserisci un importo valido');
        return;
    }
    
    const submitBtn = document.getElementById('venditaSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creazione in corso...';
    
    try {
        let action = '';
        let params = `cliente_nome=${encodeURIComponent(cliente)}&importo=${importo}&data_inizio=${dataInizio}`;
        
        if (tipo === 'canone') {
            action = 'insert_canone';
            params += `&descrizione=${encodeURIComponent(descrizione)}&durata_anni=${durataAnni}`;
        } else if (tipo === 'firma') {
            action = 'insert_firma';
            const tipoFirma = document.getElementById('venditaTipoFirma').value;
            params += `&tipo=${tipoFirma}&durata_anni=${durataAnni}`;
        } else if (tipo === 'pacchetto') {
            alert('⚠️ Funzionalità pacchetti in arrivo');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        const response = await fetch(`${API_URL}?action=${action}&${params}`);
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Vendita creata con successo!');
            closeVenditaModal();
            loadScadenze(); // Refresh lista scadenze
        } else {
            throw new Error(result.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore submit vendita:', error);
        alert('❌ Errore: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Apre il modal per rinnovo prodotto
 * @param {string} id - ID prodotto
 * @param {string} tipo - 'CANONE' o 'FIRMA'
 */
function openRinnovoModal(id, tipo) {
    const modal = document.getElementById('rinnovoModal');
    if (!modal) return;
    
    // Imposta valori hidden
    const rinnovoIdInput = document.getElementById('rinnovoId');
    const rinnovoTipoInput = document.getElementById('rinnovoTipo');
    if (rinnovoIdInput) rinnovoIdInput.value = id;
    if (rinnovoTipoInput) rinnovoTipoInput.value = tipo;
    
    // Trova il prodotto nei dati
    if (!scadenzeData || !scadenzeData.tutti) {
        alert('⚠️ Dati scadenze non disponibili');
        return;
    }
    
    const prodotto = scadenzeData.tutti.find(p => {
        if (tipo === 'CANONE') {
            return p.idCanone === id;
        } else {
            return p.idFirma === id;
        }
    });
    
    if (!prodotto) {
        alert('⚠️ Prodotto non trovato');
        return;
    }
    
    // Popola dati
    const clienteNome = document.getElementById('rinnovoClienteNome');
    const dettagli = document.getElementById('rinnovoDettagli');
    const tipoFirmaGroup = document.getElementById('rinnovoTipoFirmaGroup');
    const descrizione = document.getElementById('rinnovoDescrizione');
    const tipoFirma = document.getElementById('rinnovoTipoFirma');
    const importo = document.getElementById('rinnovoImporto');
    
    if (clienteNome) clienteNome.textContent = prodotto.nomeCliente;
    
    const dataScadenza = new Date(prodotto.dataScadenza).toLocaleDateString('it-IT');
    let dettagliText = `${tipo === 'CANONE' ? 'Canone' : 'Firma'} • Scadenza: ${dataScadenza}`;
    
    if (tipo === 'CANONE') {
        if (descrizione) descrizione.value = prodotto.descrizione || '';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'none';
        if (prodotto.descrizione) dettagliText += ` • ${prodotto.descrizione}`;
    } else {
        if (tipoFirma) tipoFirma.value = prodotto.tipo || 'Token';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'block';
        dettagliText += ` • ${prodotto.tipo}`;
    }
    
    if (dettagli) dettagli.textContent = dettagliText;
    if (importo) importo.value = prodotto.importo || '';
    
    modal.classList.add('active');
}

/**
 * Chiude il modal rinnovo
 */
function closeRinnovoModal() {
    const modal = document.getElementById('rinnovoModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Submit form rinnovo
 */
async function submitRinnovo(e) {
    e.preventDefault();
    
    const id = document.getElementById('rinnovoId').value;
    const tipo = document.getElementById('rinnovoTipo').value;
    const importo = document.getElementById('rinnovoImporto').value;
    
    const submitBtn = document.getElementById('rinnovoSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Rinnovo in corso...';
    
    try {
        let action = '';
        let params = '';
        
        if (tipo === 'CANONE') {
            action = 'rinnova_canone';
            const descrizione = document.getElementById('rinnovoDescrizione').value;
            params = `canone_id=${encodeURIComponent(id)}`;
            if (descrizione) params += `&descrizione=${encodeURIComponent(descrizione)}`;
            if (importo) params += `&importo=${importo}`;
        } else {
            action = 'rinnova_firma';
            const tipoFirma = document.getElementById('rinnovoTipoFirma').value;
            params = `firma_id=${encodeURIComponent(id)}&tipo=${tipoFirma}`;
            if (importo) params += `&importo=${importo}`;
        }
        
        const response = await fetch(`${API_URL}?action=${action}&${params}`);
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Rinnovo completato con successo!');
            closeRinnovoModal();
            loadScadenze(); // Refresh lista scadenze
        } else {
            throw new Error(result.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('Errore submit rinnovo:', error);
        alert('❌ Errore: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Event listeners per chiudere modal cliccando fuori
 */
document.addEventListener('DOMContentLoaded', function() {
    // Chiudi modal vendita
    const venditaModal = document.getElementById('venditaModal');
    if (venditaModal) {
        venditaModal.addEventListener('click', function(e) {
            if (e.target === venditaModal) {
                closeVenditaModal();
            }
        });
    }
    
    // Chiudi modal rinnovo
    const rinnovoModal = document.getElementById('rinnovoModal');
    if (rinnovoModal) {
        rinnovoModal.addEventListener('click', function(e) {
            if (e.target === rinnovoModal) {
                closeRinnovoModal();
            }
        });
    }
});
