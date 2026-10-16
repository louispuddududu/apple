import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LAYOUT } from '../constants/layout';
import { Card as CardModel } from '../types/card';
import { Card } from './Card';

/** Pressione prolungata necessaria per iniziare a trascinare (ms) */
const LONG_PRESS_MS = 250;
/** Sporgenza extra (pt) mentre trascini: nel video lo stack si "apre" da ~47 a ~57 pt */
const SPREAD_EXTRA = 10;
/** Misurato nel video: tutto lo stack scende di ~0,126 pt per ogni pt di trascinamento (max ~20 pt) */
const PULL_RATIO = 0.126;
const PULL_MAX = 20;
/** Trascinamento (pt) oltre il quale lo stack è completamente "aperto" */
const SPREAD_DISTANCE = 60;
/** Molla del rilascio, stimata dal video: critica (senza rimbalzo), ~13 rad/s */
const SPRING = { damping: 26, stiffness: 170, mass: 1 };

const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
const hapticTick = () => Haptics.selectionAsync();

interface StackCardProps {
  card: CardModel;
  index: number;
  total: number;
  width: number;
  /** 0 = stack a riposo, 1 = stack "aperto" (durante il trascinamento) */
  spread: SharedValue<number>;
  /** Entità del trascinamento (pt, sempre positiva): sposta tutto lo stack verso il basso */
  pull: SharedValue<number>;
  onReorder: (from: number, to: number) => void;
  /** Tap su una carta */
  onPress: (id: string) => void;
}

/** Una carta dello stack: pressione prolungata + trascinamento verticale per riordinare. */
const StackCard: React.FC<StackCardProps> = ({ card, index, total, width, spread, pull, onReorder, onPress }) => {
  // Posizione (in "slot") della carta quando non viene trascinata: si anima quando l'ordine cambia
  const indexSV = useSharedValue(index);
  const dragging = useSharedValue(0);
  // Slot da cui è partito il trascinamento e slot attuale durante il trascinamento
  const startIndex = useSharedValue(index);
  const currentIndex = useSharedValue(index);
  // Spostamento verticale del dito
  const translation = useSharedValue(0);

  useEffect(() => {
    indexSV.value = withTiming(index, { duration: 220 });
  }, [index, indexSV]);

  // Tap breve: apre la carta
  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (success) runOnJS(onPress)(card.id);
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      dragging.value = 1;
      startIndex.value = index;
      currentIndex.value = index;
      translation.value = 0;
      runOnJS(hapticMedium)();
    })
    .onUpdate((e) => {
      translation.value = e.translationY;
      // Lo stack si apre e scende in proporzione al trascinamento (come nel video)
      const dist = Math.abs(e.translationY);
      pull.value = dist;
      spread.value = Math.min(1, dist / SPREAD_DISTANCE);
      // Slot sotto il dito (calcolato con la sporgenza "aperta")
      const raw = Math.round(startIndex.value + e.translationY / (LAYOUT.cardPeek + SPREAD_EXTRA));
      const target = Math.min(total - 1, Math.max(0, raw));
      if (target !== currentIndex.value) {
        // Riordino "live": le altre carte scorrono subito per fare spazio
        runOnJS(onReorder)(currentIndex.value, target);
        currentIndex.value = target;
        runOnJS(hapticTick)();
      }
    })
    .onFinalize(() => {
      if (dragging.value === 0) return; // il long press non era stato completato
      const peek = LAYOUT.cardPeek + spread.value * SPREAD_EXTRA;
      // Continuità visiva: la carta riparte dalla posizione in cui si trova il dito...
      indexSV.value = startIndex.value + translation.value / peek;
      // ...e si assesta con una molla nel suo slot finale
      indexSV.value = withSpring(currentIndex.value, SPRING);
      dragging.value = 0;
      translation.value = 0;
      spread.value = withSpring(0, SPRING); // lo stack si richiude
      pull.value = withSpring(0, SPRING);
      runOnJS(hapticLight)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    const peek = LAYOUT.cardPeek + spread.value * SPREAD_EXTRA;
    const y = dragging.value
      ? startIndex.value * peek + translation.value // segue il dito
      : indexSV.value * peek;
    return {
      transform: [{ translateY: y }],
      zIndex: dragging.value ? 200 : index,
    };
  });

  return (
    <GestureDetector gesture={Gesture.Race(tap, pan)}>
      <Animated.View style={[styles.slot, animatedStyle]}>
        <Card card={card} width={width} />
      </Animated.View>
    </GestureDetector>
  );
};

interface CardStackProps {
  cards: CardModel[];
  onReorder: (from: number, to: number) => void;
  onCardPress: (id: string) => void;
}

/**
 * Stack "a scaletta". Tieni premuta una carta e trascinala su/giù:
 * lo stack si apre leggermente, le altre carte si riordinano in tempo reale
 * e al rilascio la carta si assesta nel suo slot.
 */
export const CardStack: React.FC<CardStackProps> = ({ cards, onReorder, onCardPress }) => {
  const spread = useSharedValue(0);
  const pull = useSharedValue(0);
  const total = cards.length;
  const height = LAYOUT.cardPeek * (total - 1) + LAYOUT.cardHeight;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(PULL_MAX, pull.value * PULL_RATIO) }],
  }));

  return (
    <Animated.View style={[{ height }, containerStyle]}>
      {cards.map((card, i) => {
        // i = 0 è la carta in fondo, l'ultima è in primo piano
        const levelsFromFront = total - 1 - i;
        const width = LAYOUT.cardWidthFront - 2 * LAYOUT.perspectiveInsetStep * levelsFromFront;
        return (
          <StackCard
            key={card.id}
            card={card}
            index={i}
            total={total}
            width={width}
            spread={spread}
            pull={pull}
            onReorder={onReorder}
            onPress={onCardPress}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  slot: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
});
