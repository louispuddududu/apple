/** Formatta un importo in stile italiano: 1.234,50 € (con segno + opzionale) */
export function formatMoney(n: number, withSign = false): string {
  const abs = Math.abs(n);
  const [int, dec] = abs.toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = n < 0 ? '-' : withSign && n > 0 ? '+' : '';
  return `${sign}${grouped},${dec} €`;
}

/** Giorno della settimana esteso (es. "Wednesday") */
export const formatWeekday = (t: number): string =>
  new Date(t).toLocaleDateString('en-US', { weekday: 'long' });

/** Data e ora brevi (es. "10/14/26, 10:24 PM") */
export const formatDateTime = (t: number): string =>
  new Date(t).toLocaleString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
