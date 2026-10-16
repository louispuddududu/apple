/** Una transazione di un conto (es. "Account" o "Cash") */
export interface Transaction {
  id: string;
  title: string;
  /** Es. nome della carta usata per il pagamento */
  subtitle: string;
  amount: number;
  /** Timestamp in millisecondi */
  date: number;
  status: 'accepted' | 'declined';
  kind: 'added' | 'purchase';
}
