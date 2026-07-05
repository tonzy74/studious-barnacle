import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, ProLock, RarityBadge, ScreenGradient, ScreenHeader } from '../components';
import { ReleaseCategory, UpcomingRelease, upcomingReleases } from '../lib/claude';
import { RootStackParamList } from '../navigation';
import { useProGate } from '../useProGate';
import { useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_META: Record<ReleaseCategory, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  annual: { label: 'Annual', icon: 'repeat' },
  limited: { label: 'Limited', icon: 'star' },
  seasonal: { label: 'Seasonal', icon: 'leaf' },
  core: { label: 'Core', icon: 'cube' },
  other: { label: 'Release', icon: 'pricetag' },
};

export default function ReleasesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const { locked, goPro } = useProGate('ai-releases');
  const [releases, setReleases] = useState<UpcomingRelease[] | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!apiKey || busy) return;
    setBusy(true);
    setError('');
    try {
      setReleases(await upcomingReleases(apiKey, model));
    } catch (err) {
      setError(`Couldn't load releases: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (apiKey && !locked) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (locked) {
    return (
      <ScreenGradient>
        <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, flex: 1, justifyContent: 'center' }}>
          <ProLock
            title="Releases to Watch is a Pro feature"
            benefits={['AI radar for allocated & seasonal drops', 'Know what to chase before it lands', 'Plus the full AI suite']}
            onUpgrade={goPro}
          />
        </View>
      </ScreenGradient>
    );
  }

  if (!apiKey) {
    return (
      <ScreenGradient>
        <View style={styles.center}>
          <View style={styles.glyph}>
            <Ionicons name="calendar" size={40} color={colors.amber} />
          </View>
          <Text style={styles.emptyTitle}>Releases to Watch</Text>
          <Text style={styles.emptyText}>
            AI-curated upcoming and annual releases need your Anthropic API key. Add it in Settings.
          </Text>
          <Button
            title="Open Settings"
            icon="settings-outline"
            onPress={() => navigation.navigate('Settings')}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </ScreenGradient>
    );
  }

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="ON THE HORIZON"
          title="Releases to Watch"
          subtitle="Notable upcoming and annual American whiskey releases collectors chase."
        />

        {busy && !releases && (
          <View style={[styles.center, { paddingTop: spacing.xxl }]}>
            <ActivityIndicator color={colors.amber} size="large" />
            <Text style={styles.emptyText}>Consulting the release calendar…</Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        {releases?.map((r) => {
          const meta = CATEGORY_META[r.category];
          return (
            <Card key={`${r.name}-${r.window}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={styles.name}>{r.name}</Text>
                  <Text style={styles.distillery}>{r.distillery}</Text>
                </View>
                <RarityBadge rarity={r.rarity} size={26} />
              </View>
              <View style={styles.metaRow}>
                <View style={styles.chip}>
                  <Ionicons name={meta.icon} size={12} color={colors.amberBright} />
                  <Text style={styles.chipText}>{meta.label}</Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="time-outline" size={12} color={colors.textDim} />
                  <Text style={styles.chipText}>{r.window}</Text>
                </View>
              </View>
              <Text style={styles.note}>{r.note}</Text>
            </Card>
          );
        })}

        {releases && (
          <>
            <Button
              title={busy ? 'Refreshing…' : 'Refresh'}
              icon="refresh"
              variant="secondary"
              onPress={load}
              disabled={busy}
              style={{ marginTop: spacing.md }}
            />
            <Text style={styles.disclaimer}>
              Windows are approximate — release dates, allocations, and prices vary by market and
              are set by the producers. This list is AI-generated from known release programs, not a
              guarantee.
            </Text>
          </>
        )}
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  glyph: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  emptyText: { color: colors.textDim, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  error: { color: colors.danger, marginTop: spacing.md },
  card: { marginBottom: spacing.md, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  distillery: { color: colors.amberBright, fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  note: { color: colors.textDim, marginTop: spacing.md, lineHeight: 19, fontSize: 13.5 },
  disclaimer: {
    color: colors.textFaint,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});
