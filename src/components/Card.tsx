import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LAYOUT } from '../constants/layout';
import { Card as CardModel } from '../types/card';

interface CardProps {
  card: CardModel;
  /** Larghezza della carta (cambia per l'effetto prospettiva) */
  width: number;
  style?: ViewStyle;
}

type Colors = readonly [string, string, ...string[]];
type Locs = readonly [number, number, ...number[]];

/** Righe orizzontali chiare/scure alternate: effetto metallo spazzolato */
const BRUSH_STEPS = 28;
const BRUSH_COLORS = Array.from({ length: BRUSH_STEPS }, (_, i) =>
  i % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)',
) as unknown as Colors;
const BRUSH_LOCS = Array.from({ length: BRUSH_STEPS }, (_, i) => i / (BRUSH_STEPS - 1)) as unknown as Locs;

/** Chip dorato con le classiche linee di contatto */
const Chip: React.FC = () => (
  <LinearGradient colors={['#EAD9A0', '#B8A15F']} style={styles.chip}>
    <View style={[styles.chipLine, { top: 9, left: 0, right: 0, height: 1 }]} />
    <View style={[styles.chipLine, { top: 19, left: 0, right: 0, height: 1 }]} />
    <View style={[styles.chipLine, { top: 0, bottom: 0, left: 13, width: 1 }]} />
    <View style={[styles.chipLine, { top: 0, bottom: 0, left: 27, width: 1 }]} />
  </LinearGradient>
);

/** Singola carta: intestazione in alto (visibile anche nello stack), dettagli in basso. */
export const Card: React.FC<CardProps> = ({ card, width, style }) => {
  const color = card.textColor;

  // Carta con immagine propria: la mostriamo così com'è (testi e grafica sono già nell'immagine)
  if (card.image) {
    return (
      <View style={[styles.shadow, { width, height: LAYOUT.cardHeight }, style]}>
        <Image source={card.image} resizeMode="cover" style={styles.image} />
        {/* Il saldo è dinamico: lo disegniamo sopra l'immagine (che non deve contenerlo) */}
        {card.kind === 'balance' && card.trailingText ? (
          <Text allowFontScaling={false} style={[styles.imageTrailing, { color: card.textColor }]}>{card.trailingText}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.shadow, { width, height: LAYOUT.cardHeight }, style]}>
      <LinearGradient
        colors={[card.gradient[0], card.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {card.brushed ? (
          <LinearGradient colors={BRUSH_COLORS} locations={BRUSH_LOCS} style={StyleSheet.absoluteFill} pointerEvents="none" />
        ) : null}
        {/* Riflesso diagonale leggero */}
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {card.frame ? <View style={[styles.frame, { borderColor: 'rgba(43,36,16,0.45)' }]} pointerEvents="none" /> : null}
        {card.emblem ? (
          <LinearGradient colors={['#D77BFF', '#7A3FF2']} style={styles.emblem} pointerEvents="none" />
        ) : null}

        <View style={styles.header}>
          <Text allowFontScaling={false} style={[styles.name, { color }]}>{card.name}</Text>
          {card.trailingText ? (
            <Text allowFontScaling={false} style={[styles.trailing, { color }]}>{card.trailingText}</Text>
          ) : null}
        </View>

        {card.chip ? (
          <View style={styles.chipRow}>
            <Chip />
            <Ionicons name="wifi" size={20} color={color} style={styles.contactless} />
          </View>
        ) : null}

        {card.last4 || card.network ? (
          <View style={styles.footer}>
            <Text allowFontScaling={false} style={[styles.last4, { color }]}>
              {card.last4 ? `•••• ${card.last4}` : ''}
            </Text>
            <View style={styles.networkBox}>
              {card.label ? (
                <Text allowFontScaling={false} style={[styles.label, { color }]}>{card.label}</Text>
              ) : null}
              {card.network ? (
                <Text allowFontScaling={false} style={[styles.network, { color }]}>{card.network}</Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // Ombra soffice verso l'alto: separa le carte sovrapposte
  shadow: {
    borderRadius: LAYOUT.cardRadius,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  image: { flex: 1, borderRadius: LAYOUT.cardRadius, width: '100%', height: '100%' },
  imageTrailing: { position: 'absolute', top: 16, right: 16, fontSize: 19, fontWeight: '700' },
  card: { flex: 1, borderRadius: LAYOUT.cardRadius, padding: 16, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '700' },
  trailing: { fontSize: 19, fontWeight: '700' },
  chipRow: { position: 'absolute', left: 16, top: 92, flexDirection: 'row', alignItems: 'center' },
  chip: { width: 40, height: 30, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.25)' },
  chipLine: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.25)' },
  contactless: { marginLeft: 10, transform: [{ rotate: '90deg' }] },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  last4: { fontSize: 15, fontWeight: '500' },
  networkBox: { alignItems: 'flex-end' },
  label: { fontSize: 12, fontStyle: 'italic', fontWeight: '500', letterSpacing: 0.5 },
  network: { fontSize: 28, fontStyle: 'italic', fontWeight: '900', letterSpacing: 1 },
  frame: { position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderWidth: 2, borderRadius: 10 },
  emblem: { position: 'absolute', width: 96, height: 96, borderRadius: 48, alignSelf: 'center', top: 96 },
});
