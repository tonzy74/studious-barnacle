import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Share, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Emblem, TypeIcon } from '../components';
import { nextMilestone, pourOfTheDay, streakAlive, tipOfTheDay } from '../lib/engagement';
import { scheduleStreakReminder } from '../lib/notifications';
import { fairPrice, formatUsd } from '../lib/pricing';
import { buildVaultShareText } from '../lib/share';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, gradients, radius, spacing, type as typo } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const jump = (name: string) => (navigation as unknown as { navigate: (n: string) => void }).navigate(name);
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const isPro = useStore((s) => s.isPro);
  const hideValues = useStore((s) => s.hideValues);
  const toggleHideValues = useStore((s) => s.toggleHideValues);
  const streak = useStore((s) => s.streak);
  const registerVisit = useStore((s) => s.registerVisit);
  const notifications = useStore((s) => s.notifications);

  // Habit loop: log the daily visit once when Home mounts, and refresh the
  // streak-save reminder so tonight's copy reflects the live streak count.
  useEffect(() => {
    registerVisit();
    if (notifications.enabled) {
      scheduleStreakReminder(useStore.getState().streak.streak, notifications.hour);
    }
  }, [registerVisit, notifications.enabled, notifications.hour]);

  const value = bottles.reduce(
    (sum, b) => sum + (fairPrice(b.msrp, b.secondary, b.rarity) ?? 0) * Math.max(1, b.quantity),
    0
  );
  const units = bottles.reduce((n, b) => n + Math.max(1, b.quantity), 0);
  const recentBottles = [...bottles].sort((a, b) => b.addedAt - a.addedAt).slice(0, 4);
  const pour = pourOfTheDay(bottles);
  const milestone = nextMilestone(bottles, value);
  const alive = streakAlive(streak);
  const tip = tipOfTheDay();

  const shareVault = () => {
    // Respect the hide-values toggle — never leak a dollar figure the user hid.
    Share.share({ message: buildVaultShareText(bottles, { includeValue: !hideValues }) }).catch(
      () => {}
    );
  };

  const ACTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; go: () => void }[] = [
    { label: 'Scan', icon: 'barcode-outline', go: () => jump('Scan') },
    { label: 'Add', icon: 'add-circle-outline', go: () => navigation.navigate('AddBottle', {}) },
    { label: 'Sommelier', icon: 'chatbubbles-outline', go: () => jump('Pair') },
    { label: 'Trade', icon: 'swap-horizontal', go: () => navigation.navigate('Trade') },
  ];

  return (
    <LinearGradient colors={gradients.screen} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Emblem size={44} />
            <View>
              <Text style={styles.eyebrow}>WHISKEY VAULT</Text>
              <Text style={styles.hello}>{greeting()}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {bottles.length > 0 && (
              <TouchableOpacity style={styles.iconBtn} onPress={shareVault} activeOpacity={0.8}>
                <Ionicons name="share-outline" size={20} color={colors.amberBright} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.8}>
              <Ionicons name="settings-outline" size={20} color={colors.amberBright} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Value hero */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Portfolio')}>
          <LinearGradient colors={gradients.hero} style={styles.hero}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>COLLECTION VALUE</Text>
              <TouchableOpacity onPress={toggleHideValues} hitSlop={10}>
                <Ionicons name={hideValues ? 'eye-off' : 'eye'} size={18} color={colors.amber} />
              </TouchableOpacity>
            </View>
            <Text style={styles.heroValue}>{hideValues ? '••••••' : formatUsd(value)}</Text>
            <Text style={styles.heroSub}>
              {units} bottle{units === 1 ? '' : 's'} · tap for portfolio
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Today: streak + a reason to pour tonight (daily variable reward) */}
        <View style={styles.todayRow}>
          <View style={[styles.streakChip, !alive && styles.streakCold]}>
            <Ionicons name="flame" size={18} color={alive ? colors.amberBright : colors.textFaint} />
            <Text style={[styles.streakNum, !alive && { color: colors.textFaint }]}>
              {streak.streak}
            </Text>
            <Text style={styles.streakLabel}>day{streak.streak === 1 ? '' : 's'}</Text>
          </View>
          {pour ? (
            <TouchableOpacity
              style={styles.pourCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BottleDetail', { id: pour.id })}
            >
              <Text style={styles.pourLabel}>TONIGHT'S POUR</Text>
              <Text style={styles.pourName} numberOfLines={1}>{pour.name}</Text>
              <Text style={styles.pourSub} numberOfLines={1}>
                {pour.opened ? 'Open now · pour it' : `${pour.distillery}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pourCard}>
              <Text style={styles.pourLabel}>TONIGHT'S POUR</Text>
              <Text style={styles.pourSub}>Add a bottle to get a nightly suggestion.</Text>
            </View>
          )}
        </View>

        {/* Next milestone — goal-gradient nudge toward the next badge */}
        {milestone && (
          <Card style={styles.milestone}>
            <View style={styles.milestoneTop}>
              <Ionicons name="trophy-outline" size={16} color={colors.amberBright} />
              <Text style={styles.milestoneLabel}>{milestone.label}</Text>
              <Text style={styles.milestoneCount}>
                {milestone.key === 'value'
                  ? `${Math.round(milestone.progress * 100)}%`
                  : `${milestone.current} / ${milestone.target}`}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.min(100, Math.round(milestone.progress * 100))}%` }]} />
            </View>
            <Text style={styles.milestoneReward}>Earns: {milestone.reward}</Text>
          </Card>
        )}

        {/* Quick actions */}
        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <TouchableOpacity key={a.label} style={styles.action} onPress={a.go} activeOpacity={0.85}>
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={22} color={colors.amberBright} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isPro && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Paywall')}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pro}>
              <Ionicons name="sparkles" size={20} color={colors.ink} />
              <Text style={styles.proText}>Go Pro — recommendations, analytics & alerts</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.ink} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recently added */}
        {recentBottles.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Recently added</Text>
              <TouchableOpacity onPress={() => jump('Bar')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentBottles.map((b) => (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('BottleDetail', { id: b.id })}
              >
                <Card style={styles.bottleRow}>
                  <TypeIcon type={b.type} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bottleName} numberOfLines={1}>{b.name}</Text>
                    <Text style={styles.bottleSub} numberOfLines={1}>
                      {b.distillery} · {b.proof} proof
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Discover shortcuts */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Discover</Text>
        </View>
        <View style={styles.discoverRow}>
          {[
            { label: 'For You', icon: 'sparkles' as const, go: () => navigation.navigate('Recommend') },
            { label: 'Releases', icon: 'calendar' as const, go: () => navigation.navigate('Releases') },
            { label: 'Journal', icon: 'book' as const, go: () => navigation.navigate('Journal') },
            { label: 'More', icon: 'grid' as const, go: () => jump('Explore') },
          ].map((d) => (
            <TouchableOpacity key={d.label} style={styles.discover} onPress={d.go} activeOpacity={0.85}>
              <Ionicons name={d.icon} size={20} color={colors.amberBright} />
              <Text style={styles.discoverLabel}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {bottles.length === 0 && (
          <Card style={{ marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="wine-outline" size={32} color={colors.amber} />
            <Text style={styles.emptyText}>Your vault is empty — scan or add your first bottle.</Text>
          </Card>
        )}

        {/* Daily micro-education — a small reason to linger and come back */}
        <Card style={styles.tipCard}>
          <View style={styles.tipHead}>
            <Ionicons name="bulb-outline" size={15} color={colors.amberBright} />
            <Text style={styles.tipTitle}>Whiskey wisdom</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  eyebrow: { ...typo.overline, color: colors.amberDeep },
  hello: { ...typo.display, color: colors.text, marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  hero: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderBright },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { ...typo.overline, color: colors.amber },
  heroValue: { color: colors.text, fontSize: 34, fontWeight: '800', marginTop: spacing.sm, letterSpacing: 0.3 },
  heroSub: { color: colors.textDim, marginTop: 4, fontSize: 13 },
  todayRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  streakChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderBright,
    minWidth: 78,
  },
  streakCold: { borderColor: colors.border },
  streakNum: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 2 },
  streakLabel: { color: colors.textDim, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  pourCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  pourLabel: { ...typo.overline, color: colors.amberDeep, fontSize: 9 },
  pourName: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 3 },
  pourSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  milestone: { marginTop: spacing.md, padding: spacing.md, gap: spacing.sm },
  milestoneTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  milestoneLabel: { color: colors.text, fontSize: 13.5, fontWeight: '700', flex: 1 },
  milestoneCount: { color: colors.amberBright, fontSize: 13, fontWeight: '800' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.amber },
  milestoneReward: { color: colors.textDim, fontSize: 11.5 },
  tipCard: { marginTop: spacing.lg, padding: spacing.md, gap: 6 },
  tipHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipTitle: { ...typo.overline, color: colors.amberDeep },
  tipText: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1, alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  pro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg },
  proText: { color: colors.ink, fontWeight: '700', flex: 1, fontSize: 13 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitle: { ...typo.heading, color: colors.text },
  seeAll: { color: colors.amber, fontWeight: '600', fontSize: 13 },
  bottleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm, padding: spacing.md },
  bottleName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  bottleSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  discoverRow: { flexDirection: 'row', gap: spacing.sm },
  discover: {
    flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md,
  },
  discoverLabel: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  emptyText: { color: colors.textDim, textAlign: 'center', lineHeight: 20 },
});
