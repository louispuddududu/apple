/**
 * Misure derivate dagli screenshot (riferimento: larghezza 390 pt, scala ~2.426 px/pt).
 */
export const COLORS = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: 'rgba(235,235,245,0.6)',
  pill: '#3A3A3C',
  sheet: '#2B2B2D',
  green: '#30D158',
  red: '#FF453A',
  blue: '#0A84FF',
} as const;

export const LAYOUT = {
  /** Margine orizzontale dell'header e della carta in primo piano */
  screenPadding: 16,
  /** Distanza dall'alto (sotto la status bar) a cui parte lo stack */
  stackTop: 197,
  /** Quanto sporge ogni carta dalla precedente nello stack */
  cardPeek: 47,
  /** Proporzioni carta frontale */
  cardWidthFront: 357,
  cardHeight: 220,
  cardRadius: 12,
  /** Restringimento (pt per lato) per ogni livello verso il fondo: effetto prospettiva */
  perspectiveInsetStep: 1.6,
  titleSize: 34,
  headerButtonSize: 33,
} as const;
