/**
 * CRM Studio Smart - Version Manager
 * 
 * 🎯 UNICO PUNTO PER AGGIORNARE LA VERSIONE
 * 
 * Quando rilasci una nuova versione:
 * 1. Cambia VERSION qui sotto
 * 2. Aggiungi entry in CHANGELOG (riga 59)
 * 3. Copia lo stesso numero in service-worker.js (riga 11)
 * 4. Tutto il resto si aggiorna automaticamente:
 *    - UI (box utilities)
 *    - Console logs
 *    - Page title
 *    - Footer
 */

// ============================================
// 🔢 CAMBIA SOLO QUESTO NUMERO
// ============================================
export const VERSION = '4.0.5';
// ============================================

// DOPO aver cambiato VERSION sopra:
// → Apri service-worker.js
// → Cerca "const VERSION = " (riga 11)
// → Copia lo stesso numero lì
// → Fatto! ✨

// Metadata versione (auto-generated)
export const VERSION_INFO = {
  number: VERSION,
  name: 'PWA Edition',
  date: '22 Dicembre 2025',
  codename: 'Natale',
  
  // Changelog corrente versione
  changelog: [
    '✅ Backend refactored (Phase 1)',
    '✅ Service Worker implementato',
    '✅ PWA offline-first',
    '✅ Cache intelligente +10x velocità',
    '✅ Auto-update notification'
  ],
  
  // Features principali
  features: {
    backend: 'v4.0 Refactored',
    frontend: 'v4.0 (v4.1 in development)',
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
// 📋 CHANGELOG COMPLETO - Aggiungi nuove versioni QUI IN CIMA
// ============================================
export const CHANGELOG = [
  {
    version: "4.0.4",
    date: "22/12/2025",
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
    date: "21/12/2025",
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
    date: "18/12/2025",
    type: "update",
    changes: [
      "Backend refactoring: 16 → 11 file",
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
 * Check se versione è più recente
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
    `%c🚀 CRM Studio Smart v${VERSION}`,
    'font-size: 16px; font-weight: bold; color: #667eea;'
  );
  console.log(`📅 ${VERSION_INFO.date} - "${VERSION_INFO.name}"`);
  console.log('✨ Changelog:');
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
