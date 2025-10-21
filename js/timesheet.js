// =======================================================================
// === TIMESHEET - GESTIONE TAB TIMESHEET ===
// =======================================================================

import { getClientsAndConfig, addClient, getLastWarning } from './api.js';
import { getTodayDate, showNotification } from './utils.js';

/**
 * Inizializza il tab timesheet
 */
export async function initTimesheet() {
  await loadFormData();
  setupFormSubmit();
  setTodayDate();
  setupSelectFocus();
}

/**
 * Carica dati clienti e configurazioni
 */
async function loadFormData() {
  const submitButton = document.getElementById('submit-btn');
  const infoBox = document.getElementById('info-box');
  
  submitButton.value = "Caricamento dati...";
  submitButton.disabled = true;
  infoBox.innerHTML = '<p>⏳ Caricamento dati dal foglio Google...</p>';

  try {
    const data = await getClientsAndConfig();
    
    window.clients = data.clients;
    window.config = data.config;
    
    populateFormFields();
    populateProformaClients();
    showNotification('info-box', '✅ Dati caricati. Compila il form e clicca "Salva Timesheet"', 'success');
  } catch (error) {
    console.error("Errore caricamento dati:", error);
    showNotification('info-box', '❌ Errore nel caricamento dei dati. Ricarica la pagina.', 'error');
  } finally {
    submitButton.value = "Salva Timesheet";
    submitButton.disabled = false;
  }
}

/**
 * Popola i campi del form con clienti e configurazioni
 */
function populateFormFields() {
  // Popola datalist clienti
  const clientDatalist = document.getElementById('client_list');
  clientDatalist.innerHTML = '';
  window.clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.name;
    clientDatalist.appendChild(option);
  });

  // Popola select con configurazioni
  const selectDataMap = {
    'tipo_intervento': window.config.tipoIntervento || [],
    'mod_esecuzione': window.config.modEsecuzione || [],
    'mod_addebito': window.config.modAddebito || []
  };

  for (const id in selectDataMap) {
    const select = document.getElementById(id);
    const options = selectDataMap[id];
    
    if (options && Array.isArray(options) && options.length > 0) {
      select.innerHTML = '';
      
      const placeholder = document.createElement('option');
      placeholder.value = "";
      const placeholderText = id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      placeholder.textContent = `Seleziona ${placeholderText}`;
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);

      options.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
      });
    } else {
      console.warn(`Configurazione vuota per: ${id}`);
    }
  }
}

/**
 * Popola select clienti per proforma
 */
function populateProformaClients() {
  const clientSelect = document.getElementById('proforma_client_select');
  if (!clientSelect) return;
  
  clientSelect.innerHTML = '<option value="">Seleziona Cliente</option>';
  
  window.clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.name;
    option.textContent = client.name;
    clientSelect.appendChild(option);
  });
}

/**
 * Setup submit del form timesheet
 */
function setupFormSubmit() {
  const form = document.getElementById('timesheet-form');
  form.addEventListener('submit', handleFormSubmit);
}

/**
 * Gestisce il submit del form
 */
function handleFormSubmit(event) {
  const submitButton = document.getElementById('submit-btn');
  const infoBox = document.getElementById('info-box');
  
  submitButton.value = "Salvataggio in corso...";
  submitButton.disabled = true;
  infoBox.innerHTML = '<p>⏳ Invio dati a Google Sheets...</p>';
  
  const iframe = document.getElementById('hidden_iframe');
  
  iframe.onload = async function() {
    try {
      // Attendi un attimo che il backend completi il salvataggio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recupera eventuali warning dal backend
      const warningMessage = await getLastWarning();
      
      submitButton.value = "Salva Timesheet";
      submitButton.disabled = false;
      
      if (warningMessage) {
        // Determina il tipo di alert in base al contenuto
        let alertType = 'warning';
        let alertDuration = 12000; // Default 12 secondi
        
        if (warningMessage.includes('TERMINATO')) {
          alertType = 'terminated';
          alertDuration = 15000; // 15 secondi per TERMINATO
        } else if (warningMessage.includes('OVER')) {
          alertType = 'over';
          alertDuration = 20000; // 20 secondi per OVER (critico)
        } else if (warningMessage.includes('SCADUTO')) {
          alertType = 'expired';
          alertDuration = 15000; // 15 secondi per SCADUTO
        }
        
        // Stili diversi per tipo di alert
        const alertStyles = {
          warning: 'background: #fff3cd; border-left: 5px solid #ffc107; color: #856404;',
          terminated: 'background: #d1ecf1; border-left: 5px solid #17a2b8; color: #0c5460;',
          over: 'background: #f8d7da; border-left: 5px solid #dc3545; color: #721c24;',
          expired: 'background: #f8d7da; border-left: 5px solid #fd7e14; color: #721c24;'
        };
        
        // Sostituisci il marcatore |||BREAK||| con doppio a capo per visualizzazione
        const displayMessage = warningMessage.replace(/\|\|\|BREAK\|\|\|/g, '\n\n');
        
        infoBox.innerHTML = `
          <div class="alert-box" style="${alertStyles[alertType]} padding: 20px !important; margin-bottom: 15px !important; border-radius: 8px; font-size: 15px; line-height: 1.6;">
            <strong style="display: block; margin-bottom: 10px; font-size: 16px;">
              ${alertType === 'over' ? '🚨 ALERT CRITICO' : 
                alertType === 'terminated' ? '✅ PACCHETTO COMPLETATO' : 
                alertType === 'expired' ? '⏰ ATTENZIONE' : 
                '⚠️ ATTENZIONE'}
            </strong>
            <div style="white-space: pre-line;">${displayMessage}</div>
          </div>
          <p style="color: #155724; background: #d4edda; padding: 15px !important; border-radius: 4px;">✅ Timesheet salvato</p>
        `;
        
        // Nascondi alert dopo il tempo specificato
        setTimeout(function() {
          const alertBox = document.querySelector('.alert-box');
          if (alertBox) {
            alertBox.style.transition = 'opacity 0.5s ease';
            alertBox.style.opacity = '0';
            setTimeout(() => alertBox.remove(), 500);
          }
          infoBox.innerHTML = '<p>✅ Pronto per un nuovo inserimento</p>';
        }, alertDuration);
        
      } else {
        showNotification('info-box', '✅ Timesheet salvato con successo!', 'success');
      }
      
      const currentDate = document.getElementById('date').value;
      document.getElementById('timesheet-form').reset();
      document.getElementById('date').value = currentDate;
      document.getElementById('send_email').checked = true;
      
    } catch (e) {
      console.error('Errore gestione submit:', e);
      submitButton.value = "Salva Timesheet";
      submitButton.disabled = false;
      showNotification('info-box', '✅ Timesheet salvato', 'success');
      
      const currentDate = document.getElementById('date').value;
      document.getElementById('timesheet-form').reset();
      document.getElementById('date').value = currentDate;
      document.getElementById('send_email').checked = true;
      
      setTimeout(function() {
        infoBox.innerHTML = '<p>✅ Pronto per un nuovo inserimento</p>';
      }, 5000);
    }
  };
}

/**
 * Imposta la data odierna nel campo data
 */
function setTodayDate() {
  const dateInput = document.getElementById('date');
  if (dateInput) {
    dateInput.value = getTodayDate();
  }
}

/**
 * Setup focus/blur per nascondere placeholder nei select
 */
function setupSelectFocus() {
  document.querySelectorAll('select').forEach(select => {
    select.addEventListener('focus', function() {
      const defaultOption = this.querySelector('option[value=""]');
      if (defaultOption) {
        defaultOption.style.display = 'none';
      }
    });
    select.addEventListener('blur', function() {
      const defaultOption = this.querySelector('option[value=""]');
      if (defaultOption && this.value === '') {
        defaultOption.style.display = 'block';
      }
    });
  });
}

/**
 * Apre il modal per aggiungere un nuovo cliente
 */
export function openAddClientModal() {
  document.getElementById('add-client-modal').style.display = 'flex';
}

/**
 * Chiude il modal aggiungi cliente
 */
export function closeAddClientModal() {
  document.getElementById('add-client-modal').style.display = 'none';
  document.getElementById('new-client-name').value = '';
  document.getElementById('new-client-email').value = '';
}

/**
 * Salva un nuovo cliente
 */
export async function saveNewClient() {
  const clientName = document.getElementById('new-client-name').value.trim();
  const clientEmail = document.getElementById('new-client-email').value.trim();
  
  if (!clientName) {
    alert('Inserisci il nome del cliente');
    return;
  }
  
  const saveBtn = document.querySelector('.btn-save');
  saveBtn.textContent = 'Salvataggio...';
  saveBtn.disabled = true;
  
  try {
    await addClient(clientName, clientEmail);
    await loadFormData();
    document.getElementById('client').value = clientName;
    closeAddClientModal();
    showNotification('info-box', '✅ Cliente aggiunto con successo!', 'success');
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore: ' + error.message);
  } finally {
    saveBtn.textContent = 'Salva';
    saveBtn.disabled = false;
  }
}
