// ========================================
// VENDITE TAB - JavaScript  
// Versione: 2.0 - Aggiunto supporto Fatturazione Canoni
// ========================================

const getAPIUrl = () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.APPS_SCRIPT_URL) {
        return CONFIG.APPS_SCRIPT_URL;
    }
    return 'https://script.google.com/macros/s/AKfycbxrpkmfBlraaYihYYtJB0uvg8K60sPM-9uLmybcqoiVM6rSabZe6QK_-00L9CGAFwdo/exec';
};

const API_URL = getAPIUrl();
let scadenzeData = null;

// Costanti fatturazione (sincronizzate con backend)
const CANONE_FATTURAZIONE = {
    DA_FATTURARE: 'Da fatturare',
    PROFORMATO: 'Proformato',
    FATTURATO: 'Fatturato'
};

function initVenditeTab() {
    loadVenditaClienti();
    loadScadenze();
    setVenditaDefaultDate();
}

function setVenditaDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('venditaDataInizio');
    if (dateInput) {
        dateInput.value = today;
    }
}

async function loadVenditaClienti() {
    try {
        const input = document.getElementById('venditaCliente');
        const datalist = document.getElementById('vendita_client_list');
        
        if (!input || !datalist) return;
        
        input.value = '';
        input.placeholder = 'Caricamento...';
        datalist.innerHTML = '';
        
        const response = await fetch(`${API_URL}?action=get_data`);
        const result = await response.json();
        
        if (!result || !result.clients) {
            throw new Error('Nessun dato clienti disponibile');
        }
        
        const clientsList = result.clients;
        
        if (clientsList.length > 0) {
            clientsList.sort((a, b) => {
                const nameA = (typeof a === 'string' ? a : (a.name || '')).toLowerCase();
                const nameB = (typeof b === 'string' ? b : (b.name || '')).toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
            datalist.innerHTML = '';
            
            clientsList.forEach(cliente => {
                const option = document.createElement('option');
                const clienteName = typeof cliente === 'string' ? cliente : (cliente.name || '');
                option.value = clienteName;
                datalist.appendChild(option);
            });
            
            input.placeholder = 'Cerca o seleziona cliente...';
        } else {
            input.placeholder = 'Nessun cliente disponibile';
        }
    } catch (error) {
        console.error('Errore caricamento clienti vendite:', error);
        const input = document.getElementById('venditaCliente');
        if (input) {
            input.placeholder = 'Errore caricamento';
        }
    }
}

async function loadScadenze() {
    const container = document.getElementById('scadenzeContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-scadenze">Caricamento scadenze...</div>';
    
    try {
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

function renderScadenze(data) {
    const container = document.getElementById('scadenzeContainer');
    if (!container) return;
    
    const canoniScaduti = data.tutti.filter(p => 
        p.tipoProdotto === 'CANONE' && 
        p.giorniMancanti < 0 && 
        (p.stato === 'ATTIVO' || p.stato === 'Attivo')
    );
    
    const altreScadenze = data.tutti.filter(p => 
        !(p.tipoProdotto === 'CANONE' && p.giorniMancanti < 0)
    );
    
    container.innerHTML = '';
    container.className = 'scadenze-list';
    
    // Sezione Canoni da Rinnovare (scaduti)
    if (canoniScaduti.length > 0) {
        const sezioneCanoni = document.createElement('div');
        sezioneCanoni.style.marginBottom = '30px';
        
        const titleCanoni = document.createElement('h3');
        titleCanoni.textContent = '🔴 Canoni da Rinnovare';
        titleCanoni.style.color = '#dc3545';
        titleCanoni.style.marginBottom = '15px';
        sezioneCanoni.appendChild(titleCanoni);
        
        canoniScaduti.forEach(canone => {
            const card = createScadenzaCard(canone, true);
            sezioneCanoni.appendChild(card);
        });
        
        container.appendChild(sezioneCanoni);
    }
    
    // Sezione Prossime Scadenze
    if (altreScadenze.length > 0) {
        const sezioneScadenze = document.createElement('div');
        
        const titleScadenze = document.createElement('h3');
        titleScadenze.textContent = '📅 Prossime Scadenze (90 giorni)';
        titleScadenze.style.color = '#007bff';
        titleScadenze.style.marginBottom = '15px';
        sezioneScadenze.appendChild(titleScadenze);
        
        altreScadenze.forEach(prodotto => {
            const card = createScadenzaCard(prodotto, false);
            sezioneScadenze.appendChild(card);
        });
        
        container.appendChild(sezioneScadenze);
    }
    
    if (canoniScaduti.length === 0 && altreScadenze.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div>Nessun prodotto in scadenza</div>
                <div style="font-size: 12px; margin-top: 8px; color: #999;">Prossimi 90 giorni</div>
            </div>
        `;
    }
}

function createScadenzaCard(prodotto, isCanoneScaduto = false) {
    const card = document.createElement('div');
    
    let urgenzaClass = 'bassa';
    if (isCanoneScaduto) {
        urgenzaClass = 'scaduto';
    } else {
        urgenzaClass = prodotto.urgenza === 'ALTA' ? 'urgente' : 
                       prodotto.urgenza === 'MEDIA' ? 'media' : 'bassa';
    }
    
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
    
    let giorniText = '';
    if (isCanoneScaduto) {
        const giorniPassati = Math.abs(prodotto.giorniMancanti);
        giorniText = `Scaduto da ${giorniPassati} giorni`;
    } else {
        giorniText = `${prodotto.giorniMancanti} giorni`;
    }
    
    // 🆕 Badge fatturazione per canoni
    let fatturazioneBadge = '';
    if (prodotto.tipoProdotto === 'CANONE' && prodotto.fatturazione) {
        const badgeClass = prodotto.fatturazione === CANONE_FATTURAZIONE.FATTURATO ? 'badge-success' :
                          prodotto.fatturazione === CANONE_FATTURAZIONE.PROFORMATO ? 'badge-info' :
                          'badge-warning';
        fatturazioneBadge = `<span class="badge ${badgeClass}">${prodotto.fatturazione}</span>`;
    }
    
    // 🆕 Pulsanti azione fatturazione
    let actionButtons = '';
    if (prodotto.tipoProdotto === 'CANONE') {
        if (prodotto.fatturazione === CANONE_FATTURAZIONE.DA_FATTURARE) {
            actionButtons = `
                <button class="btn-small btn-proforma" onclick="openProformaCanoneModal('${id}')">
                    📄 Proforma
                </button>
            `;
        } else if (prodotto.fatturazione === CANONE_FATTURAZIONE.PROFORMATO) {
            actionButtons = `
                <button class="btn-small btn-fattura" onclick="openFatturaCanoneModal('${id}')">
                    🧾 Fattura
                </button>
            `;
        }
    }
    
    card.innerHTML = `
        <div class="scadenza-info">
            <div class="scadenza-id">
                ${tipo}: ${id}
                <span class="scadenza-urgenza urgenza-${isCanoneScaduto ? 'scaduto' : prodotto.urgenza.toLowerCase()}">
                    ${giorniText}
                </span>
                ${fatturazioneBadge}
            </div>
            <div class="scadenza-cliente">${prodotto.nomeCliente}</div>
            <div class="scadenza-data">Scadenza: ${dataScadenza}${dettagli}</div>
        </div>
        <div class="scadenza-actions">
            ${actionButtons}
            <button class="btn-rinnova" onclick="openRinnovoModal('${id}', '${prodotto.tipoProdotto}')">
                Rinnova
            </button>
        </div>
    `;
    
    return card;
}

// =======================================================================
// === MODAL VENDITA ===
// =======================================================================

function openVenditaModal(tipo) {
    const modal = document.getElementById('venditaModal');
    const form = document.getElementById('venditaForm');
    
    if (!modal || !form) return;
    
    form.reset();
    setVenditaDefaultDate();
    
    const tipoInput = document.getElementById('tipoVendita');
    if (tipoInput) tipoInput.value = tipo;
    
    const modalTitle = document.getElementById('modalVenditaTitle');
    const tipoFirmaGroup = document.getElementById('venditaTipoFirmaGroup');
    const oreGroup = document.getElementById('venditaOreGroup');
    const oreInput = document.getElementById('venditaOreTotali');
    const durataGroup = document.getElementById('venditaDurataGroup');
    const durataLabel = document.getElementById('venditaDurataLabel');
    const durataInput = document.getElementById('venditaDurataAnni');
    const descrizioneGroup = document.getElementById('venditaDescrizioneGroup');
    const descrizioneLabel = document.getElementById('venditaDescrizioneLabel');
    const noteGroup = document.getElementById('venditaNoteGroup');
    
    if (tipo === 'pacchetto') {
        if (modalTitle) modalTitle.textContent = '📦 Nuovo Pacchetto Ore';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'none';
        if (oreGroup) oreGroup.style.display = 'block';
        if (oreInput) { oreInput.required = true; oreInput.value = ''; }
        if (durataGroup) durataGroup.style.display = 'none';
        if (descrizioneGroup) descrizioneGroup.style.display = 'block';
        if (descrizioneLabel) descrizioneLabel.textContent = 'Descrizione';
        if (noteGroup) noteGroup.style.display = 'none';
    } else if (tipo === 'canone') {
        if (modalTitle) modalTitle.textContent = '📅 Nuovo Canone';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'none';
        if (oreGroup) oreGroup.style.display = 'none';
        if (oreInput) oreInput.required = false;
        if (durataGroup) durataGroup.style.display = 'block';
        if (durataLabel) durataLabel.textContent = 'Durata (anni)';
        if (durataInput) durataInput.value = 1;
        if (descrizioneGroup) descrizioneGroup.style.display = 'block';
        if (descrizioneLabel) descrizioneLabel.textContent = 'Descrizione';
        if (noteGroup) noteGroup.style.display = 'none';
    } else if (tipo === 'firma') {
        if (modalTitle) modalTitle.textContent = '✍️ Nuova Firma Digitale';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'block';
        if (oreGroup) oreGroup.style.display = 'none';
        if (oreInput) oreInput.required = false;
        if (durataGroup) durataGroup.style.display = 'block';
        if (durataLabel) durataLabel.textContent = 'Durata (anni)';
        if (durataInput) durataInput.value = 3;
        if (descrizioneGroup) descrizioneGroup.style.display = 'none';
        if (noteGroup) noteGroup.style.display = 'block';
    }
    
    modal.classList.add('active');
}

function closeVenditaModal() {
    const modal = document.getElementById('venditaModal');
    if (modal) modal.classList.remove('active');
}

async function submitVendita(e) {
    e.preventDefault();
    
    const tipo = document.getElementById('tipoVendita').value;
    const cliente = document.getElementById('venditaCliente').value;
    const descrizione = document.getElementById('venditaDescrizione').value;
    const importo = document.getElementById('venditaImporto').value;
    const dataInizio = document.getElementById('venditaDataInizio').value;
    const durataAnni = document.getElementById('venditaDurataAnni').value;
    const oreTotali = document.getElementById('venditaOreTotali')?.value;
    
    if (!cliente || cliente.trim() === '' || cliente === 'Seleziona cliente...') {
        alert('⚠️ Seleziona un cliente');
        return;
    }
    
    if (!importo || importo <= 0) {
        alert('⚠️ Inserisci un importo valido');
        return;
    }
    
    if (tipo === 'pacchetto' && (!oreTotali || oreTotali <= 0)) {
        alert('⚠️ Inserisci il numero di ore del pacchetto');
        return;
    }
    
    const submitBtn = document.getElementById('venditaSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creazione in corso...';
    
    try {
        let action = '';
        const nomeCliente = cliente.trim();
        let params = `cliente=${encodeURIComponent(nomeCliente)}&cliente_nome=${encodeURIComponent(nomeCliente)}&importo=${importo}&data_inizio=${dataInizio}`;
        
        if (tipo === 'pacchetto') {
            action = 'insert_pacchetto';
            params += `&ore_totali=${oreTotali}&descrizione=${encodeURIComponent(descrizione)}`;
        } else if (tipo === 'canone') {
            action = 'insert_canone';
            params += `&descrizione=${encodeURIComponent(descrizione)}&durata_anni=${durataAnni}`;
        } else if (tipo === 'firma') {
            action = 'insert_firma';
            const tipoFirma = document.getElementById('venditaTipoFirma').value;
            const note = document.getElementById('venditaNote')?.value || '';
            params += `&tipo=${tipoFirma}&durata_anni=${durataAnni}&note=${encodeURIComponent(note)}`;
        }
        
        const response = await fetch(`${API_URL}?action=${action}&${params}`);
        const result = await response.json();
        
        if (result.success) {
            if (tipo === 'pacchetto') {
                closeVenditaModal();
                document.getElementById('venditaForm').reset();
                showProformaFromPacchettoModal(result);
                loadScadenze();
            } else {
                alert('✅ Vendita creata con successo!');
                closeVenditaModal();
                document.getElementById('venditaForm').reset();
                loadScadenze();
            }
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

// =======================================================================
// === 🆕 MODAL PROFORMA CANONE ===
// =======================================================================

function openProformaCanoneModal(canoneId) {
    const canone = scadenzeData?.tutti?.find(p => p.idCanone === canoneId);
    
    if (!canone) {
        alert('⚠️ Canone non trovato');
        return;
    }
    
    const modalHTML = `
        <div id="proformaCanoneModal" class="modal-vendite active">
            <div class="modal-content-vendite" style="max-width: 500px;">
                <div class="modal-header-vendite">
                    <span>📄 Emetti Proforma Canone</span>
                    <button class="modal-close-vendite" onclick="closeProformaCanoneModal()">✕</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="proforma-canone-id" value="${canoneId}">
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div><strong>ID:</strong> ${canoneId}</div>
                        <div><strong>Cliente:</strong> ${canone.nomeCliente}</div>
                        <div><strong>Importo:</strong> € ${parseFloat(canone.importo).toFixed(2)}</div>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Cliccando "Genera Proforma" il canone verrà marcato come <strong>Proformato</strong>.
                    </p>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button class="btn-secondary" onclick="closeProformaCanoneModal()">Annulla</button>
                        <button class="btn-primary" id="proforma-canone-submit" onclick="submitProformaCanone()">📄 Genera Proforma</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('proformaCanoneModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeProformaCanoneModal() {
    const modal = document.getElementById('proformaCanoneModal');
    if (modal) modal.remove();
}

async function submitProformaCanone() {
    const canoneId = document.getElementById('proforma-canone-id').value;
    const submitBtn = document.getElementById('proforma-canone-submit');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Elaborazione...';
    
    try {
        const url = `${API_URL}?action=update_fatturazione_canone&canone_id=${encodeURIComponent(canoneId)}&fatturazione=${encodeURIComponent(CANONE_FATTURAZIONE.PROFORMATO)}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Errore aggiornamento');
        }
        
        alert(`✅ Canone ${canoneId} marcato come Proformato`);
        closeProformaCanoneModal();
        loadScadenze();
        
    } catch (error) {
        console.error('Errore submitProformaCanone:', error);
        alert('❌ Errore: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '📄 Genera Proforma';
    }
}

// =======================================================================
// === 🆕 MODAL FATTURA CANONE ===
// =======================================================================

function openFatturaCanoneModal(canoneId) {
    const canone = scadenzeData?.tutti?.find(p => p.idCanone === canoneId);
    
    if (!canone) {
        alert('⚠️ Canone non trovato');
        return;
    }
    
    const oggi = new Date().toISOString().split('T')[0];
    
    const modalHTML = `
        <div id="fatturaCanoneModal" class="modal-vendite active">
            <div class="modal-content-vendite" style="max-width: 450px;">
                <div class="modal-header-vendite">
                    <span>🧾 Registra Fattura Canone</span>
                    <button class="modal-close-vendite" onclick="closeFatturaCanoneModal()">✕</button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="fattura-canone-id" value="${canoneId}">
                    
                    <div style="background: #e8f5e9; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                        <strong>${canoneId}</strong> - ${canone.nomeCliente}
                    </div>
                    
                    <div class="form-group">
                        <label>Numero Fattura *</label>
                        <input type="text" id="fattura-canone-numero" placeholder="Es. N.23/A" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <small style="color: #888;">Inserisci il numero fattura (es. N.23/A, 2026/001)</small>
                    </div>
                    
                    <div class="form-group" style="margin-top: 15px;">
                        <label>Data Fattura</label>
                        <input type="date" id="fattura-canone-data" value="${oggi}"
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button class="btn-secondary" onclick="closeFatturaCanoneModal()">Annulla</button>
                        <button class="btn-primary" id="fattura-canone-submit" onclick="submitFatturaCanone()">🧾 Salva Fattura</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('fatturaCanoneModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeFatturaCanoneModal() {
    const modal = document.getElementById('fatturaCanoneModal');
    if (modal) modal.remove();
}

async function submitFatturaCanone() {
    const canoneId = document.getElementById('fattura-canone-id').value;
    const numeroFattura = document.getElementById('fattura-canone-numero').value.trim();
    const dataFattura = document.getElementById('fattura-canone-data').value;
    
    if (!numeroFattura) {
        alert('⚠️ Inserisci il numero fattura');
        return;
    }
    
    const submitBtn = document.getElementById('fattura-canone-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Salvataggio...';
    
    try {
        // Formatta: "N.23/A del 15/01/2026"
        const dataFormatted = new Date(dataFattura).toLocaleDateString('it-IT');
        const nFatturaCompleto = `${numeroFattura} del ${dataFormatted}`;
        
        const url = `${API_URL}?action=set_canone_fatturato&canone_id=${encodeURIComponent(canoneId)}&n_fattura=${encodeURIComponent(nFatturaCompleto)}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Errore salvataggio');
        }
        
        alert(`✅ Fattura "${nFatturaCompleto}" registrata per canone ${canoneId}`);
        closeFatturaCanoneModal();
        loadScadenze();
        
    } catch (error) {
        console.error('Errore submitFatturaCanone:', error);
        alert('❌ Errore: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🧾 Salva Fattura';
    }
}

// =======================================================================
// === MODAL RINNOVO ===
// =======================================================================

function openRinnovoModal(id, tipo) {
    const modal = document.getElementById('rinnovoModal');
    if (!modal) return;
    
    const rinnovoIdInput = document.getElementById('rinnovoId');
    const rinnovoTipoInput = document.getElementById('rinnovoTipo');
    if (rinnovoIdInput) rinnovoIdInput.value = id;
    if (rinnovoTipoInput) rinnovoTipoInput.value = tipo;
    
    let prodotto = null;
    
    if (scadenzeData && scadenzeData.tutti) {
        prodotto = scadenzeData.tutti.find(p => {
            if (tipo === 'CANONE') return p.idCanone === id;
            else return p.idFirma === id;
        });
    }
    
    if (!prodotto && window.currentProdottoRinnovo) {
        prodotto = window.currentProdottoRinnovo;
    }
    
    if (!prodotto) {
        alert('⚠️ Prodotto non trovato');
        return;
    }
    
    const clienteNome = document.getElementById('rinnovoClienteNome');
    const dettagli = document.getElementById('rinnovoDettagli');
    const tipoFirmaGroup = document.getElementById('rinnovoTipoFirmaGroup');
    const descrizione = document.getElementById('rinnovoDescrizione');
    const tipoFirma = document.getElementById('rinnovoTipoFirma');
    const importo = document.getElementById('rinnovoImporto');
    const noteGroup = document.getElementById('rinnovoNoteGroup');
    
    if (clienteNome) clienteNome.textContent = prodotto.nomeCliente;
    
    const dataScadenza = new Date(prodotto.dataScadenza).toLocaleDateString('it-IT');
    let dettagliText = `${tipo === 'CANONE' ? 'Canone' : 'Firma'} • Scadenza: ${dataScadenza}`;
    
    if (tipo === 'CANONE') {
        if (descrizione) descrizione.value = prodotto.descrizione || '';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'none';
        if (noteGroup) noteGroup.style.display = 'none';
        if (prodotto.descrizione) dettagliText += ` • ${prodotto.descrizione}`;
    } else {
        if (tipoFirma) tipoFirma.value = prodotto.tipo || 'Token';
        if (tipoFirmaGroup) tipoFirmaGroup.style.display = 'block';
        if (noteGroup) noteGroup.style.display = 'block';
        dettagliText += ` • ${prodotto.tipo}`;
    }
    
    if (dettagli) dettagli.textContent = dettagliText;
    if (importo) importo.value = prodotto.importo || '';
    
    modal.classList.add('active');
}

function closeRinnovoModal() {
    const modal = document.getElementById('rinnovoModal');
    if (modal) modal.classList.remove('active');
}

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
            const note = document.getElementById('rinnovoNote')?.value || '';
            params = `firma_id=${encodeURIComponent(id)}&tipo=${tipoFirma}`;
            if (importo) params += `&importo=${importo}`;
            if (note) params += `&note=${encodeURIComponent(note)}`;
        }
        
        const response = await fetch(`${API_URL}?action=${action}&${params}`);
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Rinnovo completato con successo!');
            closeRinnovoModal();
            loadScadenze();
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

// =======================================================================
// === PROFORMA DA PACCHETTO ===
// =======================================================================

function showProformaFromPacchettoModal(pacchettoData) {
    const modalHTML = `
        <div id="proformaFromPacchettoModal" class="modal active">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>📄 Genera Proforma</h2>
                    <button class="close-btn" onclick="closeProformaFromPacchettoModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="info-banner" style="margin-bottom: 20px;">
                        ✅ Pacchetto <strong>${pacchettoData.id_pacchetto}</strong> creato con successo!
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div><strong>Cliente:</strong> ${pacchettoData.cliente}</div>
                        <div><strong>Ore:</strong> ${pacchettoData.ore_totali}h</div>
                        <div><strong>Importo:</strong> € ${pacchettoData.importo}</div>
                        <div><strong>Descrizione:</strong> ${pacchettoData.descrizione || '-'}</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="applicaQuotaPacchetto" style="margin-right: 10px;">
                            <span>Applica quota integrativa 4%</span>
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn-secondary" onclick="closeProformaFromPacchettoModal()">Salta</button>
                        <button class="btn-primary" onclick="generateProformaFromPacchetto('${pacchettoData.id_pacchetto}')">📄 Genera Proforma</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('proformaFromPacchettoModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeProformaFromPacchettoModal() {
    const modal = document.getElementById('proformaFromPacchettoModal');
    if (modal) modal.remove();
}

async function generateProformaFromPacchetto(idPacchetto) {
    const applicaQuota = document.getElementById('applicaQuotaPacchetto')?.checked || false;
    
    try {
        const response = await fetch(`${API_URL}?action=generate_proforma_pacchetto&id_pacchetto=${encodeURIComponent(idPacchetto)}&applica_quota=${applicaQuota}`);
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Proforma ${result.n_proforma} generata con successo!`);
            closeProformaFromPacchettoModal();
        } else {
            throw new Error(result.error || 'Errore generazione proforma');
        }
    } catch (error) {
        console.error('Errore generazione proforma pacchetto:', error);
        alert('❌ Errore: ' + error.message);
    }
}

// Esporta funzioni per uso globale
if (typeof window !== 'undefined') {
    window.initVenditeTab = initVenditeTab;
    window.openVenditaModal = openVenditaModal;
    window.closeVenditaModal = closeVenditaModal;
    window.submitVendita = submitVendita;
    window.openRinnovoModal = openRinnovoModal;
    window.closeRinnovoModal = closeRinnovoModal;
    window.submitRinnovo = submitRinnovo;
    window.loadScadenze = loadScadenze;
    window.openProformaCanoneModal = openProformaCanoneModal;
    window.closeProformaCanoneModal = closeProformaCanoneModal;
    window.submitProformaCanone = submitProformaCanone;
    window.openFatturaCanoneModal = openFatturaCanoneModal;
    window.closeFatturaCanoneModal = closeFatturaCanoneModal;
    window.submitFatturaCanone = submitFatturaCanone;
    window.closeProformaFromPacchettoModal = closeProformaFromPacchettoModal;
    window.generateProformaFromPacchetto = generateProformaFromPacchetto;
}
