import { ImageSourcePropType } from 'react-native';

/** Tipo di carta gestita dall'app */
export type CardKind = 'credit' | 'debit' | 'loyalty' | 'ticket' | 'balance';

/** Modello dati di una carta nel wallet */
export interface Card {
  id: string;
  kind: CardKind;
  /** Nome mostrato sulla carta */
  name: string;
  /** Solo ultime 4 cifre: non salviamo mai il numero completo */
  last4?: string;
  /** Testo a destra nell'intestazione (es. saldo) */
  trailingText?: string;
  /** Colori del gradiente, dall'alto-sinistra al basso-destra */
  gradient: readonly [string, string];
  /** Colore del testo sulla carta */
  textColor: string;
  /** Immagine della carta (es. require('../../assets/cards/mia.png')): sostituisce il design disegnato */
  image?: ImageSourcePropType;
  /** Scritta piccola sopra il marchio in basso a destra (es. "DEBIT") */
  label?: string;
  /** Marchio generico in basso a destra */
  network?: string;
  /** Mostra chip e simbolo contactless */
  chip?: boolean;
  /** Texture a righe orizzontali (effetto metallo spazzolato) */
  brushed?: boolean;
  /** Cornice interna decorativa (carta "oro") */
  frame?: boolean;
  /** Emblema circolare grande al centro (carta saldo) */
  emblem?: boolean;
}
