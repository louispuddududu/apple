import { Card } from '../types/card';

/** Carte di esempio (design originali, nessun marchio reale). Ordine: dal fondo al fronte. */
export const MOCK_CARDS: Card[] = [
  { id: '1', kind: 'balance', name: 'Account', trailingText: '248,00 €', gradient: ['#FFFFFF', '#EDEDF2'], textColor: '#000000', emblem: true, image: require('../../assets/cards/carta1.png') },
  { id: '2', kind: 'balance', name: 'Cash', trailingText: '0,00 €', gradient: ['#1C1C1E', '#2C2C2E'], textColor: '#FFFFFF', image: require('../../assets/cards/carta2.png') },
  { id: '3', kind: 'credit', name: 'Student', last4: '4821', gradient: ['#1AA6E0', '#1E5FA8'], textColor: '#FFFFFF', chip: true, network: 'PAY', label: 'CREDIT', image: require('../../assets/cards/carta3.png') },
  { id: '4', kind: 'credit', name: 'GOLD', last4: '1007', gradient: ['#CDB872', '#9A8540'], textColor: '#2B2410', frame: true, chip: true, network: 'PAY', label: 'CREDIT', image: require('../../assets/cards/carta4.png') },
  { id: '5', kind: 'credit', name: 'MILES', last4: '3390', gradient: ['#1B2A4A', '#0E1830'], textColor: '#FFFFFF', chip: true, network: 'PAY', label: 'SIGNATURE', image: require('../../assets/cards/carta5.png') },
  { id: '6', kind: 'debit', name: 'BANK', last4: '6213', gradient: ['#2F6DB5', '#14407A'], textColor: '#FFFFFF', brushed: true, network: 'PAY', label: 'DEBIT', image: require('../../assets/cards/carta6.png') },
];
