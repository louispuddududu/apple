import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, LAYOUT } from '../constants/layout';
import { Card as CardModel, CardKind } from '../types/card';
import { Card } from './Card';

const KIND_LABEL: Record<CardKind, string> = {
  credit: 'Carta di credito',
  debit: 'Carta di debito',
  loyalty: 'Carta fedeltà',
  ticket: 'Biglietto',
  balance: 'Saldo',
};

interface CardDetailProps {
  card: CardModel;
  onClose: () => void;
  onDelete: (id: string) => void;
}

/** Vista carta aperta: sfondo sfocato, carta con effetto lucentezza, dettagli e QR code. */
export const CardDetail: React.FC<CardDetailProps> = ({ card, onClose, onDelete }) => {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const cardW = Math.min(LAYOUT.cardWidthFront, screenW - 2 * LAYOUT.screenPadding);

  const progress = useSharedValue(0); // 0 chiusa, 1 aperta
  const drag = useSharedValue(0); // swipe verso il basso
  const tilt = useSharedValue(0); // inclinazione laterale del telefono (-1..1)

  // Apertura animata
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  // Lucentezza: l'accelerometro sposta il riflesso (assente su simulatore/web: ignoriamo l'errore)
  useEffect(() => {
    try {
      Accelerometer.setUpdateInterval(33);
      const sub = Accelerometer.addListener(({ x }) => {
        tilt.value = withTiming(Math.max(-1, Math.min(1, x * 2)), { duration: 80 });
      });
      return () => sub.remove();
    } catch {
      return undefined;
    }
  }, [tilt]);

  /** Chiude con animazione, poi avvisa la schermata */
  const close = () => {
    progress.value = withTiming(0, { duration: 240 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const openMenu = () => {
    Alert.alert(card.name, undefined, [
      {
        text: 'Rimuovi carta',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Rimuovere la carta?', `${card.name} verrà eliminata dal wallet.`, [
            { text: 'Annulla', style: 'cancel' },
            { text: 'Rimuovi', style: 'destructive', onPress: () => onDelete(card.id) },
          ]),
      },
      { text: 'Annulla', style: 'cancel' },
    ]);
  };

  // Swipe giù per chiudere
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      drag.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        runOnJS(close)();
      }
    })
    .onFinalize(() => {
      drag.value = withSpring(0, { damping: 26, stiffness: 170 });
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * (1 - Math.min(1, drag.value / 600)),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - progress.value) * 40 + drag.value },
      { scale: 0.96 + 0.04 * progress.value },
    ],
  }));
  const glareStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tilt.value * cardW * 0.9 }, { rotate: '20deg' }],
  }));

  const showQr = card.kind !== 'credit' && card.kind !== 'debit';

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.content, { paddingTop: insets.top + 12 }, contentStyle]}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.circle} onPress={close}>
              <Ionicons name="chevron-down" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circle} onPress={openMenu}>
              <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={{ width: cardW, height: LAYOUT.cardHeight, alignSelf: 'center' }}>
            <Card card={card} width={cardW} />
            {/* Riflesso che segue l'inclinazione */}
            <View style={styles.glareClip} pointerEvents="none">
              <Animated.View style={[styles.glare, glareStyle]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </View>

          <View style={styles.panel}>
            <Row label="Nome" value={card.name} />
            <Row label="Tipo" value={KIND_LABEL[card.kind]} />
            {card.last4 ? <Row label="Numero" value={`•••• ${card.last4}`} /> : null}
            {card.trailingText ? <Row label="Saldo" value={card.trailingText} /> : null}
            {showQr ? (
              <View style={styles.qrBox}>
                <QRCode value={`wallet:${card.id}:${card.name}`} size={150} backgroundColor="#FFFFFF" color="#000000" />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text allowFontScaling={false} style={styles.rowLabel}>{label}</Text>
    <Text allowFontScaling={false} style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: { zIndex: 1000 },
  content: { flex: 1, paddingHorizontal: LAYOUT.screenPadding },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  circle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  glareClip: { ...StyleSheet.absoluteFillObject, borderRadius: LAYOUT.cardRadius, overflow: 'hidden' },
  glare: { position: 'absolute', top: -60, bottom: -60, left: '30%', width: '35%' },
  panel: { marginTop: 24, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: COLORS.textSecondary, fontSize: 16 },
  rowValue: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  qrBox: { alignSelf: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, marginTop: 8 },
});
