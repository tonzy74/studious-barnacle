import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ScreenGradient } from '../components';
import {
  FEATURE_COPY,
  FREE_TRIAL_DAYS,
  PRO_FEATURES,
  PRO_PLANS,
  PRO_VALUE_LINE,
} from '../lib/monetization';
import { purchasePro, PURCHASES_READY, restorePurchases } from '../lib/purchases';
import { useStore } from '../store/useStore';
import { colors, gradients, radius, spacing, type as typo } from '../theme';

export default function PaywallScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const setPro = useStore((s) => s.setPro);
  const [plan, setPlan] = useState(PRO_PLANS.find((p) => p.best)?.id ?? PRO_PLANS[0].id);
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    const chosen = PRO_PLANS.find((p) => p.id === plan);
    if (!chosen) return;
    setBusy(true);
    try {
      const res = await purchasePro(chosen.packageId);
      if (res.pro) {
        setPro(true);
        Alert.alert('Welcome to Pro 🥃', res.message ?? 'All features unlocked.', [
          { text: 'Great', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Purchase failed', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      const res = await restorePurchases();
      if (res.pro) {
        setPro(true);
        Alert.alert('Restored', 'Your Pro access is active.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Nothing to restore', 'No previous purchase found.');
      }
    } catch (err) {
      Alert.alert('Restore failed', (err as Error).message);
    }
  };

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.close}>
          <Ionicons name="close" size={24} color={colors.textDim} />
        </TouchableOpacity>

        <LinearGradient colors={gradients.gold} style={styles.crown}>
          <Ionicons name="sparkles" size={30} color={colors.ink} />
        </LinearGradient>
        <Text style={styles.title}>Whiskey Vault Pro</Text>
        <Text style={styles.subtitle}>
          The AI-powered edge no other whiskey app has — start with a {FREE_TRIAL_DAYS}-day free
          trial.
        </Text>

        <View style={styles.benefits}>
          {PRO_FEATURES.map((f) => (
            <View key={f} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.amberBright} />
              <Text style={styles.benefitText}>{FEATURE_COPY[f]}</Text>
            </View>
          ))}
        </View>

        {/* Value anchor — reframe price against what the app saves a collector */}
        <View style={styles.valueLine}>
          <Ionicons name="pricetag" size={15} color={colors.amberBright} />
          <Text style={styles.valueText}>{PRO_VALUE_LINE}</Text>
        </View>

        {PRO_PLANS.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setPlan(p.id)}
            activeOpacity={0.85}
            style={[styles.plan, plan === p.id && styles.planActive]}
          >
            <View style={styles.radio}>
              {plan === p.id && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.planLabelRow}>
                <Text style={styles.planLabel}>{p.label}</Text>
                {p.badge && <Text style={styles.saveBadge}>{p.badge}</Text>}
                {p.best && <Text style={styles.bestTag}>BEST VALUE</Text>}
              </View>
              <Text style={styles.planSub}>{p.sub}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {p.anchor && <Text style={styles.anchor}>{p.anchor}</Text>}
              <Text style={styles.planPrice}>{p.price}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Risk-reversal — the trial does the heavy lifting on conversion */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="time-outline" size={15} color={colors.amber} />
            <Text style={styles.trustText}>{FREE_TRIAL_DAYS} days free</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="notifications-off-outline" size={15} color={colors.amber} />
            <Text style={styles.trustText}>Reminder before it bills</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="close-circle-outline" size={15} color={colors.amber} />
            <Text style={styles.trustText}>Cancel anytime</Text>
          </View>
        </View>

        <Button
          title={busy ? 'Processing…' : `Start ${FREE_TRIAL_DAYS}-day free trial`}
          icon="sparkles"
          onPress={buy}
          disabled={busy}
          style={{ marginTop: spacing.lg }}
        />
        <Text style={styles.thenPrice}>
          Then {PRO_PLANS.find((p) => p.id === plan)?.price}
          {plan === 'lifetime' ? '' : ' · cancel anytime in Settings'}
        </Text>
        <TouchableOpacity onPress={restore} style={{ marginTop: spacing.md }}>
          <Text style={styles.restore}>Restore purchases</Text>
        </TouchableOpacity>

        {!PURCHASES_READY && (
          <Text style={styles.devNote}>
            Developer build: purchases run in sandbox (no real charge). Real billing activates when
            RevenueCat is wired on your EAS build.
          </Text>
        )}
        <Text style={styles.legal}>
          Subscriptions auto-renew unless canceled at least 24h before the period ends; manage in
          your App Store account. Payment charged after any free trial.
        </Text>
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: 'flex-end', padding: 4 },
  crown: {
    width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: spacing.sm,
  },
  title: { ...typo.display, color: colors.text, textAlign: 'center', marginTop: spacing.md },
  subtitle: { color: colors.textDim, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20, paddingHorizontal: spacing.md },
  benefits: { marginTop: spacing.xl, gap: spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitText: { color: colors.text, fontSize: 14, flex: 1 },
  plan: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginTop: spacing.md,
  },
  planActive: { borderColor: colors.amber, backgroundColor: colors.cardAlt },
  valueLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valueText: { color: colors.text, fontSize: 12.5, fontWeight: '600', flex: 1 },
  planLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  saveBadge: {
    color: colors.ink,
    backgroundColor: colors.amberBright,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  anchor: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' },
  trustText: { color: colors.textDim, fontSize: 10.5, fontWeight: '600' },
  thenPrice: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: spacing.sm },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.amber,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.amber },
  planLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  bestTag: { color: colors.amberBright, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  planPrice: { color: colors.amberBright, fontSize: 15, fontWeight: '800' },
  restore: { color: colors.amber, textAlign: 'center', fontWeight: '600' },
  devNote: { color: colors.textFaint, fontSize: 11, marginTop: spacing.lg, lineHeight: 16, fontStyle: 'italic', textAlign: 'center' },
  legal: { color: colors.textFaint, fontSize: 10, marginTop: spacing.md, lineHeight: 15, textAlign: 'center' },
});
