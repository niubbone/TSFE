#!/usr/bin/env python3
"""
Script Aggiornamento Architettura - STATO ATTUALE PULITO
Versione: 2.0 - No note storiche, solo struttura reale
"""

import re
from pathlib import Path

# Solo correzioni STRUTTURALI, NO note "aggiornamento"
UPDATES = {
    'global_replacements': [
        # Correggi descrizioni cache
        ('Micro-cache System', 'CacheService Google'),
        ('Sistema di cache privata in memoria', 'Cache pubblica Google CacheService (5 minuti)'),
        
        # Correggi parametri API
        ('client_name, timesheet_ids', 'cliente, timesheet_ids'),
        ('&client_name=', '&cliente='),
        
        # Rimuovi riferimenti obsoleti
        ('_clientCache', ''),
        ('_getClientByName', 'getClientData'),
        ('invalidateClientCache', ''),
    ]
}

def process_file(input_path, output_path):
    """Processa singolo file HTML"""
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Applica sostituzioni
    for old, new in UPDATES['global_replacements']:
        content = content.replace(old, new)
    
    # Salva
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def main():
    input_dir = Path('/mnt/user-data/uploads')
    output_dir = Path('/mnt/user-data/outputs')
    
    files = ['arc_backend.html', 'arc_frontend.html', 'architecture.html', 'tech_sheet.html']
    
    print("="*70)
    print("AGGIORNAMENTO ARCHITETTURA - STATO ATTUALE PULITO")
    print("="*70)
    print()
    
    for filename in files:
        print(f"📝 {filename}")
        input_path = input_dir / filename
        output_path = output_dir / filename
        
        if not input_path.exists():
            print(f"  ❌ File non trovato")
            continue
        
        process_file(input_path, output_path)
        print(f"  ✅ Aggiornato")
    
    print()
    print("✅ COMPLETATO!")
    print()

if __name__ == '__main__':
    main()
