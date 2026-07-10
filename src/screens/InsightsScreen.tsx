import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, ScreenGradient, ScreenHeader } from '../components';
import { ANALYTICS_URL } from '../config';
import { fetchFunnel } from '../lib/analyticsTransport';
import { computeFunnel, FunnelMetrics } from '../lib/funnel';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, radius, spacing, type as typo } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function InsightsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const events = useStore((s) => s.events);
  const [metrics, setMetrics] = useState<FunnelMetrics | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Server = aggregate across installs; local = just this device's events.
  const [source, setSource] = useState<'server' | 'local'>(ANALYTICS_URL ? 'server' : 'local');

  const load = async () => {
    setError('');
    if (ANALYTICS_URL) {
      setBusy(true);
      try {
        setMetrics(await fetchFunnel(ANALYTICS_URL));
        setSource('server');
      } catch (err) {
        // Fall back to on-device events if the backend is unreachable.
        setMetrics(computeFunnel(events));
        setSource('local');
        setError(`Backend unreachable — showing this device only. (${(err as Error).message})`);
      } finally {
        setBusy(false);
      }
    } else {
      setMetrics(computeFunnel(events));
      setSource('local');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tiles = metrics
    ? [
        { label: 'Installs', value: String(metrics.users), icon: 'people' as const },
        { label: 'Activated', value: `${metrics.activated} · ${pct(metrics.activationRate)}`, icon: 'rocket' as const },
        { label: 'Onboarded', value: String(metrics.onboarded), icon: 'flag' as const },
        { label: 'Paywall views', value: String(metrics.paywallViews), icon: 'card' as const },
        { label: 'Purchases', value: String(metrics.purchases), icon: 'cash' as const },
        { label: 'Paywall → Pro', value: pct(metrics.paywallConversion), icon: 'trending-up' as const },
        { label: 'Buyers / activated', value: pct(metrics.purchaseRate), icon: 'diamond' as const },
        { label: 'Sharers', value: String(metrics.sharers), icon: 'share-social' as const },
        { label: 'Bottles added', value: String(metrics.bottlesAdded), icon: 'wine' as const },
      ]
    : [];

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="OWNER TOOLS"
          title="Growth Insights"
          subtitle="Your acquisition → activation → revenue funnel. The metrics the growth levers are built to move."
          onBack={() => navigation.goBack()}
        />

        <View style={[styles.sourcePill, { borderColor: source === 'server' ? colors.success : colors.amber }]}>
          <Ionicons
            name={source === 'server' ? 'cloud-done' : 'phone-portrait'}
            size={13}
            color={source === 'server' ? colors.success : colors.amber}
          />
          <Text style={styles.sourceText}>
            {source === 'server' ? 'All installs (live backend)' : 'This device only (no backend configured)'}
          </Text>
        </View>

        {busy && <ActivityIndicator color={colors.amber} size="large" style={{ marginTop: spacing.xl }} />}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {metrics && (
          <View style={styles.grid}>
            {tiles.map((t) => (
              <Card key={t.label} style={styles.tile}>
                <Ionicons name={t.icon} size={18} color={colors.amberBright} />
                <Text style={styles.tileValue}>{t.value}</Text>
                <Text style={styles.tileLabel}>{t.label}</Text>
              </Card>
            ))}
          </View>
        )}

        <Button
          title={busy ? 'Refreshing…' : 'Refresh'}
          icon="refresh"
          variant="secondary"
          onPress={load}
          disabled={busy}
          style={{ marginTop: spacing.lg }}
        />

        {source === 'local' && !ANALYTICS_URL && (
          <Text style={styles.note}>
            Set EXPO_PUBLIC_ANALYTICS_URL and deploy server/analytics-service to see aggregate
            metrics across all installs (see docs/DEPLOY.md).
          </Text>
        )}
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  sourceText: { color: colors.textDim, fontSize: 11.5, fontWeight: '600' },
  error: { color: colors.danger, marginTop: spacing.md, lineHeight: 18, fontSize: 12.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  tile: { width: '31.5%', padding: spacing.md, gap: 4, minWidth: 96 },
  tileValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  tileLabel: { color: colors.textDim, fontSize: 10.5, fontWeight: '600' },
  note: { color: colors.textFaint, fontSize: 11.5, lineHeight: 17, marginTop: spacing.lg, fontStyle: 'italic' },
});
