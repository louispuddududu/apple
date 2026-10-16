import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CardDetail } from '../components/CardDetail';
import { CardStack } from '../components/CardStack';
import { COLORS, LAYOUT } from '../constants/layout';
import { Card } from '../types/card';
import { Transaction } from '../types/transaction';
import { formatMoney } from '../utils/format';
import { MOCK_CARDS } from '../utils/mockCards';
import { AccountScreen } from './AccountScreen';

/** Limite settimanale per l'aggiunta di denaro (€) */
const WEEKLY_LIMIT = 10000;
const WEEK_MS = 7 * 24 * 3600 * 1000;

interface Account {
  balance: number;
  transactions: Transaction[];
}

/** Ogni carta di tipo "balance" parte con 0 € e nessuna transazione */
const initialAccounts = (cards: Card[]): Record<string, Account> =>
  Object.fromEntries(cards.filter((c) => c.kind === 'balance').map((c) => [c.id, { balance: 0, transactions: [] }]));

/** Home del wallet: header con titolo e pulsanti + stack di carte riordinabile. */
export const WalletHomeScreen: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(MOCK_CARDS);
  const [accounts, setAccounts] = useState<Record<string, Account>>(() => initialAccounts(MOCK_CARDS));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cards.find((c) => c.id === selectedId) ?? null;

  // Il saldo mostrato sulle carte "balance" viene dallo stato dei conti
  const viewCards = useMemo(
    () => cards.map((c) => (c.kind === 'balance' ? { ...c, trailingText: formatMoney(accounts[c.id]?.balance ?? 0) } : c)),
    [cards, accounts],
  );
  const payCard = cards.find((c) => c.kind === 'credit' || c.kind === 'debit');

  const handleAdd = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  /** Sposta una carta da una posizione all'altra dello stack */
  const handleReorder = useCallback((from: number, to: number) => {
    setCards((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  /** Rimuove una carta e chiude il dettaglio */
  const handleDelete = useCallback((id: string) => {
    setSelectedId(null);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  /** Aggiunge denaro: accettato se non supera il limite settimanale, altrimenti rifiutato */
  const addMoney = (cardId: string, amount: number): Transaction => {
    const now = Date.now();
    const acc = accounts[cardId] ?? { balance: 0, transactions: [] };
    const used = acc.transactions
      .filter((t) => t.kind === 'added' && t.status === 'accepted' && t.date >= now - WEEK_MS)
      .reduce((sum, t) => sum + t.amount, 0);
    const accepted = used + amount <= WEEKLY_LIMIT;
    const tx: Transaction = {
      id: String(now), title: 'Added to Balance', subtitle: payCard?.name ?? 'Card',
      amount, date: now, status: accepted ? 'accepted' : 'declined', kind: 'added',
    };
    setAccounts((prev) => {
      const cur = prev[cardId] ?? { balance: 0, transactions: [] };
      return { ...prev, [cardId]: { balance: cur.balance + (accepted ? amount : 0), transactions: [tx, ...cur.transactions] } };
    });
    return tx;
  };

  const selectedView = viewCards.find((c) => c.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text allowFontScaling={false} style={styles.title}>Wallet</Text>
          <View style={styles.buttons}>
            <View style={[styles.circle, styles.outline]}>
              <Ionicons name="cube-outline" size={20} color={COLORS.text} />
            </View>
            <TouchableOpacity style={[styles.circle, styles.filled]} onPress={handleAdd}>
              <Ionicons name="add" size={26} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.stackWrap}>
          <CardStack cards={viewCards} onReorder={handleReorder} onCardPress={setSelectedId} />
        </View>
      </SafeAreaView>
      {selected && selectedView ? (
        selected.kind === 'balance' ? (
          <AccountScreen
            card={selected}
            balance={accounts[selected.id]?.balance ?? 0}
            transactions={accounts[selected.id]?.transactions ?? []}
            payCard={payCard}
            weeklyLimit={WEEKLY_LIMIT}
            onClose={() => setSelectedId(null)}
            onDelete={handleDelete}
            onAddMoney={(amount) => addMoney(selected.id, amount)}
          />
        ) : (
          <CardDetail card={selectedView} onClose={() => setSelectedId(null)} onDelete={handleDelete} />
        )
      ) : null}
    </View>
  );
};

const S = LAYOUT.headerButtonSize;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Altezza fissa: il titolo non cambia posizione se cambia il font
  header: {
    height: 41, marginTop: 70,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPadding,
  },
  title: { color: COLORS.text, fontSize: LAYOUT.titleSize, lineHeight: 41, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 16 },
  circle: { width: S, height: S, borderRadius: S / 2, alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 2, borderColor: COLORS.text },
  filled: { backgroundColor: COLORS.text },
  stackWrap: { marginTop: 39, paddingHorizontal: LAYOUT.screenPadding },
});
