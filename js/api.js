// =======================================================================
// === API - CHIAMATE AL BACKEND ===
// =======================================================================
import { CONFIG } from './config.js';

/**
 * Carica clienti e configurazioni dal backend
 */
export async function getClientsAndConfig() {
  const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_data`;
  
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Errore HTTP: Status ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.detail || data.error);
  }
  
  return {
    clients: data.clients || [],
    config: data.config || {}
  };
}

/**
 * Aggiunge un nuovo cliente
 */
export async function addClient(clientName, clientEmail = '') {
  const url = `${CONFIG.APPS_SCRIPT_URL}?action=add_client&client_name=${encodeURIComponent(clientName)}&client_email=${encodeURIComponent(clientEmail)}`;
  
  const response = await fetch(url, { method: 'GET' });
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Impossibile aggiungere il cliente');
  }
  
  return data;
}

/**
 * Carica timesheet da fatturare per un cliente
 */
export async function getTimesheetDaFatturare(clientName) {
  const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_timesheet_da_fatturare&client_name=${encodeURIComponent(clientName)}`;
  
  const response = await fetch(url, { method: 'GET' });
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Impossibile caricare i timesheet');
  }
  
  // ✅ FIX: Backend restituisce data.data dopo refactoring
  return data.data || data.timesheet || [];
}

/**
 * Genera e invia proforma
 */
export async function generateProforma(clientName, timesheetIds, causale, applicaQuota) {
  const timesheetIdsStr = timesheetIds.join(',');
  const url = `${CONFIG.APPS_SCRIPT_URL}?action=generate_proforma&client_name=${encodeURIComponent(clientName)}&timesheet_ids=${timesheetIdsStr}&causale=${encodeURIComponent(causale)}&applica_quota=${applicaQuota}`;
  
  const response = await fetch(url, { method: 'GET' });
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Errore durante la generazione della proforma');
  }
  
  return data;
}

/**
 * Recupera l'ultimo warning generato dal backend
 */
export async function getLastWarning() {
  const url = `${CONFIG.APPS_SCRIPT_URL}?action=get_last_warning`;
  
  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    
    if (data.success && data.warning) {
      return data.warning;
    }
    return null;
  } catch (error) {
    console.error('Errore recupero warning:', error);
    return null;
  }
}

/**
 * Invia timesheet al backend (usato dal form submit via iframe)
 * Questa funzione non usa fetch perché il form usa action POST con target iframe
 */
export function setupTimesheetFormSubmit() {
  // Il form usa già il metodo POST con iframe hidden
  // Non serve modificare, manteniamo la logica esistente
  return true;
}
