import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../constants/layout';
import { Card as CardModel } from '../types/card';
import { formatMoney } from '../utils/format';
import { Card } from './Card';

type Stage = 'keypad' | 'pay' | 'faceid' | 'check';

interface Props {
  card: CardModel;
  balance: number;
  weeklyLimit: number;
  /** Carta usata per pagare */
  payCard?: CardModel;
  onCancel: () => void;
  /** Chiamata a fine animazione, quando il pagamento è stato confermato */
  onConfirmed: (amount: number) => void;
}

/** In Expo Go il Face ID vero non è disponibile (iOS chiede il codice): usiamo la simulazione */
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const KEYS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', 'del']];
const QUICK = [10, 20, 50];
const HIDDEN_PAY = 640;

/** Anello che gira (scansione Face ID) */
const Spinner: React.FC = () => {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
    return () => cancelAnimation(rot);
  }, [rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return <Animated.View style={[styles.ring, style]} />;
};

/** Foglio "Add Money": tastierino, poi foglio di pagamento con conferma Face ID simulata */
export const AddMoneySheet: React.FC<Props> = ({ card, balance, weeklyLimit, payCard, onCancel, onConfirmed }) => {
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const [str, setStr] = useState('');
  const [stage, setStage] = useState<Stage>('keypad');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sheetY = useSharedValue(H);
  const payY = useSharedValue(HIDDEN_PAY);
  const dim = useSharedValue(0);

  const amount = parseFloat(str || '0');
  const canAdd = amount > 0;

  useEffect(() => {
    sheetY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, [sheetY]);

  const closeAll = (done: () => void) => {
    payY.value = withTiming(HIDDEN_PAY, { duration: 250 });
    dim.value = withTiming(0, { duration: 250 });
    sheetY.value = withTiming(H, { duration: 320 }, (finished) => {
      if (finished) runOnJS(done)();
    });
  };

  const onKey = (k: string) => {
    Haptics.selectionAsync();
    setStr((s) => {
      if (k === 'del') return s.slice(0, -1);
      if (k === '.') return s.includes('.') ? s : (s === '' ? '0' : s) + '.';
      if (s === '0') return k;
      const dec = s.split('.')[1];
      if (dec !== undefined && dec.length >= 2) return s;
      if (s.replace('.', '').length >= 7) return s;
      return s + k;
    });
  };

  const openPay = () => {
    if (!canAdd) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStage('pay');
    dim.value = withTiming(1, { duration: 250 });
    payY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
  };

  const closePay = () => {
    setStage('keypad');
    dim.value = withTiming(0, { duration: 250 });
    payY.value = withTiming(HIDDEN_PAY, { duration: 250 });
  };

  /** Chiusura con spunta di conferma, poi chiude i fogli e registra il pagamento */
  const finish = () => {
    setStage('check');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    timers.current.push(setTimeout(() => closeAll(() => onConfirmed(amount)), 700));
  };

  /**
   * Conferma con il vero Face ID (o Touch ID / codice se Face ID non c'è).
   * Se il dispositivo non ha biometria (es. simulatore) si usa la scansione simulata.
   */
  const confirm = async () => {
    if (stage !== 'pay') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const hasHardware = !IS_EXPO_GO && (await LocalAuthentication.hasHardwareAsync());
      const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
      if (hasHardware && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Confirm ${formatMoney(amount)}`,
          cancelLabel: 'Cancel',
        });
        if (result.success) finish();
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // annullato: restiamo sul foglio
        return;
      }
    } catch {
      // se la verifica fallisce per un errore tecnico, usiamo la simulazione
    }
    setStage('faceid');
    timers.current.push(setTimeout(finish, 1100));
  };

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const payStyle = useAnimatedStyle(() => ({ transform: [{ translateY: payY.value }] }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));

  const display = `${(str === '' ? '0' : str).replace('.', ',')} €`;

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.header}>
          <Pressable style={styles.pill} onPress={() => closeAll(onCancel)}>
            <Text allowFontScaling={false} style={styles.pillText}>Cancel</Text>
          </Pressable>
          <Text allowFontScaling={false} style={styles.headerTitle}>Add Money</Text>
          <Pressable style={[styles.pill, { opacity: canAdd ? 1 : 0.35 }]} onPress={openPay}>
            <Text allowFontScaling={false} style={styles.pillText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.center}>
          <Card card={{ ...card, trailingText: undefined }} width={176} style={{ height: 110 }} />
          <Text allowFontScaling={false} style={styles.amount}>{display}</Text>
          <Text allowFontScaling={false} style={styles.current}>Current Balance: {formatMoney(balance)}</Text>
        </View>

        <View style={[styles.keypad, { paddingBottom: insets.bottom }]}>
          <Text allowFontScaling={false} style={styles.limit}>Weekly Add Limit: {formatMoney(weeklyLimit)}</Text>
          <View style={styles.keyRow}>
            {QUICK.map((q, i) => (
              <Pressable key={q} style={[styles.quick, i < 2 && styles.keySep]} onPress={() => { Haptics.selectionAsync(); setStr(String(q)); }}>
                <Text allowFontScaling={false} style={styles.quickText}>{q} €</Text>
              </Pressable>
            ))}
          </View>
          {KEYS.map((row) => (
            <View key={row.join('')} style={styles.keyRow}>
              {row.map((k, i) => (
                <Pressable key={k} style={({ pressed }) => [styles.key, i < 2 && styles.keySep, pressed && { backgroundColor: COLORS.surface }]} onPress={() => onKey(k)}>
                  {k === 'del' ? (
                    <Ionicons name="backspace-outline" size={32} color={COLORS.text} />
                  ) : (
                    <Text allowFontScaling={false} style={styles.keyText}>{k}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {/* Sfondo scurito + indicazione del tasto laterale */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} pointerEvents={stage === 'keypad' ? 'none' : 'auto'}>
          <Text allowFontScaling={false} style={styles.double}>{'Double Click\nto Pay'}</Text>
          <View style={styles.sideBar} />
        </Animated.View>

        <Animated.View style={[styles.pay, { paddingBottom: insets.bottom + 20 }, payStyle]}>
          <View style={styles.payHeader}>
            <Text allowFontScaling={false} style={styles.payTitle}>Pay</Text>
            <Pressable onPress={closePay} hitSlop={12}>
              <Ionicons name="close" size={28} color={COLORS.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.payRow}>
            <View style={styles.thumbWrap}>
              {payCard?.image ? (
                <Image source={payCard.image} style={styles.thumb} resizeMode="cover" />
              ) : (
                <LinearGradient colors={[payCard?.gradient[0] ?? '#2F6DB5', payCard?.gradient[1] ?? '#14407A']} style={styles.thumb} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text allowFontScaling={false} style={styles.payName}>{payCard?.name ?? 'Card'}</Text>
              <Text allowFontScaling={false} style={styles.paySub}>Cardholder</Text>
            </View>
            <Text allowFontScaling={false} style={styles.payName}>{`•••• ${payCard?.last4 ?? '0000'}`}</Text>
          </View>
          <View style={[styles.payRow, { paddingVertical: 18, marginTop: 10 }]}>
            <Text allowFontScaling={false} style={[styles.payName, { flex: 1 }]}>Change Payment Method</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>
          <View style={styles.addTo}>
            <View>
              <Text allowFontScaling={false} style={styles.paySub}>{`Add to ${card.name}`}</Text>
              <Text allowFontScaling={false} style={styles.payAmount}>{formatMoney(amount)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.confirm} onPress={confirm}>
            <View style={styles.blueCircle}>
              <Ionicons name="phone-portrait-outline" size={22} color={COLORS.blue} />
            </View>
            <Text allowFontScaling={false} style={styles.confirmText}>Confirm with Side Button</Text>
          </Pressable>
        </Animated.View>

        {stage === 'faceid' || stage === 'check' ? (
          <View style={styles.faceBox}>
            <View style={styles.faceIcon}>
              {stage === 'faceid' ? <Spinner /> : <Ionicons name="checkmark-circle-outline" size={56} color="#FFF" />}
            </View>
            <Text allowFontScaling={false} style={styles.faceText}>Face ID</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { zIndex: 2000 },
  sheet: { position: 'absolute', top: 47, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.sheet, borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 },
  pill: { height: 44, minWidth: 70, paddingHorizontal: 20, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  pillText: { color: COLORS.text, fontSize: 18 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', paddingTop: 36 },
  amount: { color: COLORS.text, fontSize: 52, marginTop: 40 },
  current: { color: COLORS.textSecondary, fontSize: 18, marginTop: 20 },
  keypad: { backgroundColor: '#000' },
  limit: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 4 },
  keyRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2C2C2E' },
  key: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center' },
  quick: { flex: 1, height: 30, alignItems: 'center', justifyContent: 'center' },
  keySep: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#2C2C2E' },
  keyText: { color: COLORS.text, fontSize: 34 },
  quickText: { color: COLORS.text, fontSize: 16 },
  dim: { backgroundColor: 'rgba(0,0,0,0.55)' },
  double: { position: 'absolute', right: 22, top: 270, color: '#FFF', fontSize: 20, fontWeight: '600', textAlign: 'right' },
  sideBar: { position: 'absolute', right: 3, top: 260, width: 6, height: 107, borderRadius: 3, backgroundColor: '#FFF' },
  pay: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: COLORS.sheet, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 24 },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  payTitle: { color: COLORS.text, fontSize: 30, fontWeight: '600' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.pill, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  thumbWrap: { width: 44, height: 28, borderRadius: 4, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  payName: { color: COLORS.text, fontSize: 19 },
  paySub: { color: COLORS.textSecondary, fontSize: 16, marginTop: 2 },
  addTo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 18 },
  payAmount: { color: COLORS.text, fontSize: 32, fontWeight: '500', marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.2)' },
  confirm: { alignItems: 'center', paddingTop: 22, gap: 12 },
  blueCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: COLORS.blue, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: COLORS.textSecondary, fontSize: 18 },
  faceBox: { position: 'absolute', alignSelf: 'center', top: '38%', width: 112, height: 112, borderRadius: 24, backgroundColor: 'rgba(60,60,62,0.97)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  faceIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  faceText: { color: '#FFF', fontSize: 15 },
  ring: { width: 46, height: 46, borderRadius: 23, borderWidth: 4, borderColor: '#FFF', borderTopColor: 'transparent' },
});
