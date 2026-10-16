import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AddMoneySheet } from '../components/AddMoneySheet';
import { Card } from '../components/Card';
import { NotificationBanner } from '../components/NotificationBanner';
import { TransactionDetail } from '../components/TransactionDetail';
import { COLORS, LAYOUT } from '../constants/layout';
import { Card as CardModel } from '../types/card';
import { Transaction } from '../types/transaction';
import { formatMoney, formatWeekday } from '../utils/format';
import { ensureNotificationPermission, sendLocalNotification } from '../utils/notify';

interface Props {
  card: CardModel;
  balance: number;
  transactions: Transaction[];
  payCard?: CardModel;
  weeklyLimit: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  /** Registra l'aggiunta di denaro e restituisce la transazione creata */
  onAddMoney: (amount: number) => Transaction;
}

/** Pagina del conto: carta, saldo con "Add Money" ed elenco transazioni */
export const AccountScreen: React.FC<Props> = ({ card, balance, transactions, payCard, weeklyLimit, onClose, onDelete, onAddMoney }) => {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const cardW = Math.min(LAYOUT.cardWidthFront, W - 2 * LAYOUT.screenPadding);

  const [adding, setAdding] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [banner, setBanner] = useState<{ title: string; body: string; amount: string } | null>(null);

  const progress = useSharedValue(0);
  // Chiede il permesso per le notifiche appena si apre il conto
  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const close = () => {
    progress.value = withTiming(0, { duration: 240 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };
  const rootStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 30 }],
  }));

  const openMenu = () =>
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

  const handleConfirmed = async (amount: number) => {
    setAdding(false);
    const tx = onAddMoney(amount);
    const ok = tx.status === 'accepted';
    const body = ok ? 'Money Added' : 'Payment Declined';
    const amountText = ok ? formatMoney(amount, true) : formatMoney(amount);
    // Notifica vera del sistema; se non è consentita mostriamo il banner interno all'app
    const sent = await sendLocalNotification(card.name, `${body} ${amountText}`);
    if (!sent) setBanner({ title: card.name, body, amount: amountText });
  };
  const hideBanner = useCallback(() => setBanner(null), []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: LAYOUT.screenPadding }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={close} hitSlop={12}>
            <Text allowFontScaling={false} style={styles.done}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.more} onPress={openMenu}>
            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={{ alignSelf: 'center', marginTop: 16 }}>
          <Card card={{ ...card, trailingText: undefined }} width={cardW} />
        </View>

        <View style={styles.balancePanel}>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.balanceLabel}>Balance</Text>
            <Text allowFontScaling={false} style={styles.balanceValue}>{formatMoney(balance)}</Text>
          </View>
          <TouchableOpacity style={styles.addPill} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAdding(true); }}>
            <Text allowFontScaling={false} style={styles.addPillText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txHeader}>
          <Text allowFontScaling={false} style={styles.txTitle}>Transactions</Text>
          <Ionicons name="search" size={26} color={COLORS.textSecondary} />
        </View>

        {transactions.length === 0 ? (
          <Text allowFontScaling={false} style={styles.empty}>No Transactions</Text>
        ) : (
          <View style={styles.list}>
            {transactions.map((t, i) => {
              const declined = t.status === 'declined';
              return (
                <TouchableOpacity key={t.id} activeOpacity={0.6} onPress={() => setSelectedTx(t)} style={[styles.txRow, i > 0 && styles.txSep]}>
                  <View style={[styles.txIcon, declined && { backgroundColor: COLORS.surfaceElevated }]}>
                    <Ionicons name={declined ? 'card' : t.kind === 'purchase' ? 'restaurant' : 'business'} size={20} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={styles.txName} numberOfLines={1}>{t.title}</Text>
                    {declined ? <Text allowFontScaling={false} style={[styles.txSub, { color: COLORS.red }]}>Declined</Text> : null}
                    <Text allowFontScaling={false} style={styles.txSub} numberOfLines={1}>{declined ? formatWeekday(t.date) : t.subtitle}</Text>
                    {!declined ? <Text allowFontScaling={false} style={styles.txSub}>{formatWeekday(t.date)}</Text> : null}
                  </View>
                  <Text allowFontScaling={false} style={[styles.txAmount, declined && styles.strike]}>{formatMoney(t.amount, true)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {selectedTx ? <TransactionDetail tx={selectedTx} onBack={() => setSelectedTx(null)} /> : null}
      {adding ? (
        <AddMoneySheet card={card} balance={balance} weeklyLimit={weeklyLimit} payCard={payCard} onCancel={() => setAdding(false)} onConfirmed={handleConfirmed} />
      ) : null}
      {banner ? <NotificationBanner title={banner.title} body={banner.body} amount={banner.amount} onHide={hideBanner} /> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.background, zIndex: 1000 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 36 },
  done: { color: COLORS.text, fontSize: 20, fontWeight: '600' },
  more: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: COLORS.text, alignItems: 'center', justifyContent: 'center' },
  balancePanel: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginTop: 24 },
  balanceLabel: { color: COLORS.textSecondary, fontSize: 16 },
  balanceValue: { color: COLORS.text, fontSize: 30, fontWeight: '700', marginTop: 4 },
  addPill: { backgroundColor: COLORS.pill, borderRadius: 18, paddingHorizontal: 22, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  addPillText: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 44, marginBottom: 14 },
  txTitle: { color: COLORS.text, fontSize: 26, fontWeight: '700' },
  empty: { color: COLORS.textSecondary, fontSize: 17, textAlign: 'center', marginTop: 24 },
  list: { backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  txSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.15)' },
  txIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  txName: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
  txSub: { color: COLORS.textSecondary, fontSize: 15 },
  txAmount: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  strike: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
});
