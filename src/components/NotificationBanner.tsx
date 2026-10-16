import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface Props {
  title: string;
  body: string;
  amount: string;
  onHide: () => void;
}

/** Notifica in stile iOS che scende dall'alto e sparisce da sola dopo ~3,5 s */
export const NotificationBanner: React.FC<Props> = ({ title, body, amount, onHide }) => {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(-180);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    y.value = withTiming(0, { duration: 350 });
    const t = setTimeout(() => {
      y.value = withTiming(-180, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onHide)();
      });
    }, 3500);
    return () => clearTimeout(t);
  }, [y, onHide]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View style={[styles.banner, { top: insets.top + 4 }, style]} pointerEvents="none">
      <LinearGradient colors={['#4CD964', '#1FA83A']} style={styles.icon}>
        <Ionicons name="wallet" size={22} color="#FFF" />
      </LinearGradient>
      <View style={styles.texts}>
        <View style={styles.row}>
          <Text allowFontScaling={false} style={styles.title}>{title}</Text>
          <Text allowFontScaling={false} style={styles.time}>now</Text>
        </View>
        <Text allowFontScaling={false} style={styles.body}>{body}</Text>
        <Text allowFontScaling={false} style={styles.body}>{amount}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', left: 8, right: 8, zIndex: 3000, flexDirection: 'row', gap: 12,
    padding: 14, borderRadius: 24, backgroundColor: 'rgba(58,58,60,0.97)',
  },
  icon: { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  time: { color: 'rgba(235,235,245,0.6)', fontSize: 14 },
  body: { color: '#FFF', fontSize: 15 },
});
