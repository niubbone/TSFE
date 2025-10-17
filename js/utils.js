// =======================================================================
// === UTILITY FUNCTIONS ===
// =======================================================================

/**
 * Formatta una data nel formato italiano
 */
export function formatDate(date, locale = 'it-IT') {
  if (!date) return 'Data non valida';
  
  try {
    // Se è già in formato dd/MM/yyyy
    if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return date;
    }
    
    // Se è in formato ISO YYYY-MM-DD
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = date.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    // Prova a parsare come Date
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString(locale);
    }
  } catch(e) {
    console.error('Errore formattazione data:', e);
  }
  
  return 'Data non valida';
}

/**
 * Formatta un importo in valuta
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return `€ ${num.toFixed(2)}`;
}

/**
 * Mostra una notifica inline
 */
export function showNotification(elementId, message, type = 'info') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const colors = {
    info: { bg: '#e7f3ff', text: '#1976D2' },
    success: { bg: '#d4edda', text: '#155724' },
    error: { bg: '#f8d7da', text: '#721c24' },
    warning: { bg: '#fff3cd', text: '#856404' }
  };
  
  const color = colors[type] || colors.info;
  
  element.innerHTML = `<p style="color: ${color.text}; background: ${color.bg}; padding: 15px !important; border-radius: 4px;">${message}</p>`;
}

/**
 * Ritardo asincrono
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Capitalizza la prima lettera
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Ottiene la data odierna in formato YYYY-MM-DD
 */
export function getTodayDate() {
  return new Date().toISOString().substring(0, 10);
}
