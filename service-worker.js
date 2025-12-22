/**
 * Service Worker - CRM Studio Smart
 * 
 * ⚠️ VERSIONE: Cambia solo in version.js, poi aggiorna manualmente qui sotto
 * 
 * Strategia di caching:
 * - Static assets (HTML, CSS, JS): Cache-first
 * - API calls: Network-first con fallback cache
 * - Immagini: Cache-first con update in background
 */

// ============================================
// 🔢 VERSIONE - Copia da version.js quando aggiorni
// ============================================
const VERSION = '4.0.1';
// ============================================

const CACHE_VERSION = `crm-v${VERSION}`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Files da cachare all'installazione
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  
  // CSS
  '/css/main.css',
  '/css/clienti.css',
  '/css/forms.css',
  '/css/modals.css',
  '/css/proforma-list.css',
  '/css/tables.css',
  '/css/tabs.css',
  '/css/utilities.css',
  '/css/vendite.css',
  '/css/vendite-scaduti.css',
  
  // JavaScript
  '/js/api.js',
  '/js/clienti.js',
  '/js/config.js',
  '/js/main.js',
  '/js/proforma-list.js',
  '/js/proforma.js',
  '/js/timesheet.js',
  '/js/utilities.js',
  '/js/utils.js',
  '/js/vendite.js'
];

// API endpoint da cachare (per offline fallback)
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxrpkmfBlraaYihYYtJB0uvg8K60sPM-9uLmybcqoiVM6rSabZe6QK_-00L9CGAFwdo/exec';

/**
 * INSTALL - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static cache complete');
        // Force activation immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

/**
 * ACTIVATE - Cleanup old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName.startsWith('crm-') && cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Cleanup complete');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * FETCH - Intercept network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API REQUESTS - Network first, fallback to cache
  if (url.origin === new URL(API_BASE_URL).origin) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // STATIC ASSETS - Cache first, fallback to network
  if (STATIC_FILES.some(file => url.pathname === file || url.pathname.endsWith(file))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // OTHER REQUESTS - Network first with cache fallback
  event.respondWith(handleRuntimeRequest(request));
});

/**
 * Handle API requests
 * Strategy: Network-first con fallback cache (per offline)
 */
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Se successo, aggiorna cache
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, using cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Add header to indicate offline mode
      const headers = new Headers(cachedResponse.headers);
      headers.append('X-Offline-Response', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Nessuna cache disponibile
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - nessuna cache disponibile',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle static assets
 * Strategy: Cache-first (instant load)
 */
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background (stale-while-revalidate)
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    }).catch(() => {
      // Network failed, but we have cache - no problem
    });
    
    return cachedResponse;
  }
  
  // Cache miss - fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    throw error;
  }
}

/**
 * Handle runtime requests
 * Strategy: Network-first with cache fallback
 */
async function handleRuntimeRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Try cache fallback
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available
    throw error;
  }
}

/**
 * SYNC - Background sync per operazioni offline
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

/**
 * Sync offline data quando torna online
 */
async function syncOfflineData() {
  // TODO: Implementare sync delle operazioni fatte offline
  // Es: timesheet inseriti offline da sincronizzare
  console.log('[SW] Syncing offline data...');
}

/**
 * MESSAGE - Comunicazione con main thread
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker loaded');
