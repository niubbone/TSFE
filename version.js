/**
 * CRM Studio Smart - Version Manager
 * 
 * UNICO PUNTO PER AGGIORNARE LA VERSIONE
 */

export const VERSION = '4.0.6';

export const VERSION_INFO = {
  number: VERSION,
  name: 'Cleanup Edition',
  date: '28 Dicembre 2024',
  codename: 'Pulizia',
  changelog: [
    'Micro-cache eliminata (-80 righe, bug risolto)',
    'Campo descrizione in timesheet e email proforma',
    'Console.log debug rimossi',
    'Parametri API corretti (cliente vs client_name)',
    'Helper Proforma condiviso (query 3->1)'
  ]
};

export const CHANGELOG = [
  {
    version: "4.0.6",
    date: "28/12/2024",
    type: "cleanup",
    changes: [
      "Clienti.gs: Micro-cache privata ELIMINATA (-80 righe)",
      "Timesheet.gs: Campo descrizione aggiunto",
      "crm_email.gs: Colonna Descrizione in email",
      "Proforma.gs: Helper condiviso (query 3->1)",
      "proforma.js: Console.log debug rimossi",
      "api.js: Parametro 'cliente' corretto"
    ]
  },
  {
    version: "4.0.4",
    date: "22/12/2024",
    type: "fix",
    changes: [
      "Fix campo cliente vendite",
      "Fix Service Worker path detection"
    ]
  }
];
