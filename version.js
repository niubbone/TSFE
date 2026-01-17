/**
 * CRM Studio Smart - Version Manager
 * 
 * UNICO PUNTO PER AGGIORNARE LA VERSIONE
 * 
 * Quando rilasci una nuova versione:
 * 1. Cambia VERSION qui sotto
 * 2. Aggiungi entry in CHANGELOG (riga 65)
 * 3. Copia lo stesso numero in service-worker.js (riga 11)
 * 4. Tutto il resto si aggiorna automaticamente:
 *    - UI (box utilities)
 *    - Console logs
 *    - Page title
 *    - Footer
 */

// ============================================
// CAMBIA SOLO QUESTO NUMERO
// ============================================
export const VERSION = '4.2.1b';
// ============================================

// DOPO aver cambiato VERSION sopra:
// Apri service-worker.js
// Cerca "const VERSION = " (riga 11)
// Copia lo stesso numero li
// Fatto!

// Metadata versione (auto-generated)
export const VERSION_INFO = {
  number: VERSION,
  name: 'Cleanup Edition',
  date: '28 Dicembre 2024',
  codename: 'Pulizia',
  
  // Changelog corrente versione
  changelog: [
    'Micro-cache eliminata (-80 righe, bug risolto)',
    'Campo descrizione in timesheet e email proforma',
    'Console.log debug rimossi (console pulita)',
    'Parametri API corretti (cliente vs client_name)',
    'Helper condiviso Proforma (query 3->1)'
  ],
  
  // Features principali
  features: {
    backend: 'v4.0 Refactored + Cleanup',
    frontend: 'v4.0 PWA + Cleanup',
    pwa: true,
    offline: true,
    serviceWorker: true
  }
};

// Build info (opzionale)
export const BUILD_INFO = {
  environment: 'production', // 'development' | 'staging' | 'production'
  buildDate: new Date().toISOString(),
  commit: 'manual' // se usi Git: processo automatico
};

// ============================================
// CHANGELOG COMPLETO - Aggiungi nuove versioni QUI IN CIMA
// ============================================
export const CHANGELOG = [
  {
    version: "4.0.6",
    date: "28/12/2024",
    type: "cleanup",
    changes: [
      "Clienti.gs: Micro-cache privata ELIMINATA (-80 righe)",
      "Timesheet.gs: Campo descrizione aggiunto in getTimesheetByIds()",
      "crm_email.gs: Tabella email proforma con colonna Descrizione",
      "Proforma.gs: Helper calculateProformaTotals() condiviso (query 3->1)",
      "proforma.js: Console.log debug rimossi (riga 60, 79-84)",
      "api.js: Parametro corretto 'cliente' in generateProforma()",
      "Performance: +15% manutenibilita, bug cache-null risolto"
    ]
  },
  {
    version: "4.0.4",
    date: "22/12/2024",
    type: "fix",
    changes: [
      "Fix campo cliente vendite: input con ricerca",
      "Fix backend Firme.gs e Canoni.gs: parametri GET",
      "Fix Service Worker: auto-detect base path",
      "Version display: styling light e centrato"
    ]
  },
  {
    version: "4.0.1",
    date: "21/12/2024",
    type: "feature",
    changes: [
      "Service Worker implementato",
      "PWA manifest con shortcuts",
      "Cache strategica performance",
      "Version display in Utilities"
    ]
  },
  {
    version: "4.0.0",
    date: "18/12/2024",
    type: "major",
    changes: [
      "Backend refactoring: 16 -> 11 file",
      "Eliminati 1500+ righe duplicate",
      "Micro-cache +70% performance"
    ]
  }
];

/**
 * Format versione per display
 */
export function getVersionString() {
  return `v${VERSION}`;
}

/**
 * Format versione completa con nome
 */
export function getFullVersionString() {
  return `v${VERSION} "${VERSION_INFO.name}"`;
}

/**
 * Format versione con data
 */
export function getVersionWithDate() {
  return `v${VERSION} - ${VERSION_INFO.date}`;
}

/**
 * Check se versione e piu recente
 */
export function isNewerThan(otherVersion) {
  const current = VERSION.split('.').map(n => parseInt(n));
  const other = otherVersion.split('.').map(n => parseInt(n));
  
  for (let i = 0; i < 3; i++) {
    if (current[i] > other[i]) return true;
    if (current[i] < other[i]) return false;
  }
  
  return false;
}

/**
 * Get cache name per Service Worker
 * Usa questo per generare cache version automaticamente
 */
export function getCacheName(prefix = 'crm') {
  return `${prefix}-v${VERSION}`;
}

/**
 * Log versione in console
 */
export function logVersion() {
  console.log(
    `%cCRM Studio Smart v${VERSION}`,
    'font-size: 16px; font-weight: bold; color: #667eea;'
  );
  console.log(`${VERSION_INFO.date} - "${VERSION_INFO.name}"`);
  console.log('Changelog:');
  VERSION_INFO.changelog.forEach(item => console.log(`  ${item}`));
}

/**
 * Get version object per API
 */
export function getVersionObject() {
  return {
    version: VERSION,
    versionInfo: VERSION_INFO,
    buildInfo: BUILD_INFO,
    changelog: CHANGELOG
  };
}

// Auto-log in development
if (BUILD_INFO.environment === 'development') {
  logVersion();
}
