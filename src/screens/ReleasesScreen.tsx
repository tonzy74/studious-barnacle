import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, ProLock, RarityBadge, ScreenGradient, ScreenHeader } from '../components';
import { ReleaseCategory, UpcomingRelease, upcomingReleases } from '../lib/claude';
import { diag } from '../lib/diagnostics';
import { aiEnabled, isQuotaError } from '../lib/aiClient';
import { FAST_MODEL } from '../lib/models';
import { buildCalendar } from '../lib/releaseCalendar';
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
  const cache = useStore((s) => s.releasesCache);
  const setReleasesCache = useStore((s) => s.setReleasesCache);
  const { locked, goPro } = useProGate('ai-releases');
  // Show cached releases instantly; only hit the API when asked or stale.
  const [releases, setReleases] = useState<UpcomingRelease[] | undefined>(cache?.items);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!aiEnabled(apiKey) || busy) return;
    setBusy(true);
    setError('');
    try {
      // Text-only task → use the fast model so it isn't stuck waiting on Opus.
      const r = await upcomingReleases(apiKey, FAST_MODEL);
      diag.info('releases', `loaded ${r.length} releases (fast model)`);
      setReleases(r);
      setReleasesCache(r);
    } catch (err) {
      diag.error('releases', err, 'fast model');
      if (isQuotaError(err)) {
        navigation.navigate('Paywall');
        return;
      }
      setError(`Couldn't load releases: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // Only auto-fetch when there's nothing cached; otherwise show cache and
    // let the user refresh. Cache older than 14 days refreshes in background —
    // as does any cache whose windows still name a year that's already passed
    // (e.g. an old "Fall 2024" result), so the calendar never looks stale.
    const currentYear = new Date().getFullYear();
    const hasPastYear = (cache?.items ?? []).some((r) => {
      const m = r.window.match(/\b(?:19|20)\d{2}\b/);
      return m ? parseInt(m[0], 10) < currentYear : false;
    });
    const stale = !cache || Date.now() - cache.at > 14 * 86_400_000 || hasPastYear;
    if (aiEnabled(apiKey) && !locked && stale) load();
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

  if (!aiEnabled(apiKey)) {
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
          eyebrow="RELEASE CALENDAR"
          title="Releases to Watch"
          subtitle="Upcoming and annual American whiskey drops, laid out on a timeline by their expected window."
          onBack={() => navigation.goBack()}
        />

        {busy && !releases && (
          <View style={[styles.center, { paddingTop: spacing.xxl }]}>
            <ActivityIndicator color={colors.amber} size="large" />
            <Text style={styles.emptyText}>Consulting the release calendar…</Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        {releases &&
          buildCalendar(releases).map((group) => (
            <View key={group.key} style={styles.group}>
              {/* Calendar section header — a month/season on the timeline. */}
              <View style={styles.monthHeader}>
                <View style={styles.monthBadge}>
                  <Ionicons name="calendar-outline" size={13} color={colors.amberBright} />
                  <Text style={styles.monthText}>{group.label}</Text>
                </View>
                <View style={styles.monthRule} />
                <Text style={styles.monthCount}>
                  {group.releases.length} drop{group.releases.length === 1 ? '' : 's'}
                </Text>
              </View>

              {group.releases.map((r) => {
                const meta = CATEGORY_META[r.category];
                return (
                  <View key={`${r.name}-${r.window}`} style={styles.timelineRow}>
                    {/* The timeline rail + node running down the left edge. */}
                    <View style={styles.rail}>
                      <View style={styles.node} />
                      <View style={styles.line} />
                    </View>
                    <Card style={styles.card}>
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
                  </View>
                );
              })}
            </View>
          ))}

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
  group: { marginTop: spacing.lg },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderBright,
  },
  monthText: { color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  monthRule: { flex: 1, height: 1, backgroundColor: colors.border },
  monthCount: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
  timelineRow: { flexDirection: 'row' },
  rail: { width: 22, alignItems: 'center' },
  node: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginTop: spacing.md,
    backgroundColor: colors.amber,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  card: { flex: 1, marginBottom: spacing.md, padding: spacing.md },
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
