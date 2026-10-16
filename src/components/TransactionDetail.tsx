import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, LAYOUT } from '../constants/layout';
import { Transaction } from '../types/transaction';
import { formatDateTime, formatMoney } from '../utils/format';

interface Props {
  tx: Transaction;
  onBack: () => void;
}

/** Pagina di dettaglio di una transazione */
export const TransactionDetail: React.FC<Props> = ({ tx, onBack }) => {
  const insets = useSafeAreaInsets();
  const accepted = tx.status === 'accepted';
  const signed = tx.kind === 'added' ? formatMoney(tx.amount, true) : formatMoney(-tx.amount);

  return (
    <View style={[StyleSheet.absoluteFill, styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          <Text allowFontScaling={false} style={styles.backText} numberOfLines={1}>{tx.title}</Text>
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.navTitle}>Transaction</Text>
      </View>

      <Text allowFontScaling={false} adjustsFontSizeToFit numberOfLines={1} style={styles.amount}>{signed}</Text>
      <Text allowFontScaling={false} style={styles.title}>{tx.title}</Text>
      <Text allowFontScaling={false} style={styles.date}>{formatDateTime(tx.date)}</Text>

      <View style={styles.panel}>
        <View style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>Status: </Text>
          <Text allowFontScaling={false} style={[styles.value, { color: accepted ? COLORS.green : COLORS.red }]}>
            {accepted ? 'Accepted' : 'Declined'}
          </Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>Card: </Text>
          <Text allowFontScaling={false} style={styles.value}>{tx.subtitle}</Text>
        </View>
        <View style={styles.sep} />
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text allowFontScaling={false} style={styles.label}>Total</Text>
          <Text allowFontScaling={false} style={styles.value}>{signed}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text allowFontScaling={false} style={styles.value}>Contact {tx.title}</Text>
          <Ionicons name="call" size={24} color={COLORS.text} />
        </View>
        <View style={styles.sep} />
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text allowFontScaling={false} style={[styles.value, { flex: 1 }]}>Report Incorrect Merchant Info</Text>
          <Ionicons name="alert-circle-outline" size={28} color={COLORS.text} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.background, paddingHorizontal: LAYOUT.screenPadding, zIndex: 100 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  back: {
    flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 12, borderRadius: 22,
    backgroundColor: COLORS.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)', maxWidth: '60%',
  },
  backText: { color: COLORS.text, fontSize: 17, marginLeft: 4 },
  navTitle: { color: COLORS.text, fontSize: 17, fontWeight: '600' },
  amount: { color: COLORS.text, fontSize: 56, fontWeight: '800', textAlign: 'center', marginTop: 36 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '600', textAlign: 'center', marginTop: 18 },
  date: { color: COLORS.textSecondary, fontSize: 18, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  panel: { backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 16, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },
  label: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  value: { color: COLORS.text, fontSize: 20 },
});
