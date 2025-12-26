/**
 * TabLoader - Caricatore dinamico tab
 * Versione MINIMAL per POC
 * 
 * Usage:
 *   const loader = new TabLoader();
 *   loader.init();
 *   await loader.show('utilities');
 */
class TabLoader {
    constructor() {
        this.cache = new Map();
        this.currentTab = null;
        this.container = null;
    }
    
    /**
     * Inizializza il loader
     * @returns {boolean} true se init success
     */
    init() {
        this.container = document.getElementById('tab-container');
        if (!this.container) {
            console.error('❌ TabLoader: tab-container not found');
            return false;
        }
        console.log('✅ TabLoader initialized');
        return true;
    }
    
    /**
     * Carica una tab (con cache)
     * @param {string} tabName - Nome tab (es: 'utilities')
     * @returns {Promise<string>} HTML content
     */
    async load(tabName) {
        console.log(`📥 Loading tab: ${tabName}`);
        
        // Check cache
        if (this.cache.has(tabName)) {
            console.log(`✅ From cache: ${tabName}`);
            return this.cache.get(tabName);
        }
        
        // Fetch from server
        try {
            const response = await fetch(`tabs/${tabName}.html`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            console.log(`✅ Loaded ${tabName}: ${html.length} chars`);
            
            // Save to cache
            this.cache.set(tabName, html);
            return html;
            
        } catch (error) {
            console.error(`❌ Failed to load ${tabName}:`, error);
            throw error;
        }
    }
    
    /**
     * Mostra una tab (load + inject DOM)
     * @param {string} tabName - Nome tab da mostrare
     */
    async show(tabName) {
        if (this.currentTab === tabName) {
            console.log(`ℹ️ Tab ${tabName} already active`);
            return;
        }
        
        // Loading indicator
        this.container.innerHTML = '<div class="loading" style="padding: 40px; text-align: center; font-size: 18px;">⏳ Caricamento...</div>';
        
        try {
            // Load HTML
            const html = await this.load(tabName);
            
            // Inject in DOM
            this.container.innerHTML = html;
            this.currentTab = tabName;
            
            console.log(`✅ Showing tab: ${tabName}`);
            
            // Dispatch event for listeners
            window.dispatchEvent(new CustomEvent('tab-loaded', {
                detail: { tab: tabName }
            }));
            
        } catch (error) {
            // Error UI
            this.container.innerHTML = `
                <div class="error" style="padding: 40px; text-align: center; color: #dc3545;">
                    <h3>❌ Errore Caricamento Tab</h3>
                    <p style="margin: 20px 0;">${error.message}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                        🔄 Ricarica Pagina
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Preload tutte le tab (opzionale - per performance)
     */
    async preloadAll() {
        const tabs = ['timesheet', 'clienti', 'vendite', 'proforma', 'utilities'];
        console.log('📦 Preloading all tabs...');
        
        try {
            await Promise.all(tabs.map(tab => this.load(tab)));
            console.log('✅ All tabs preloaded');
        } catch (error) {
            console.warn('⚠️ Preload failed:', error);
        }
    }
}

// Export globale
window.TabLoader = TabLoader;
