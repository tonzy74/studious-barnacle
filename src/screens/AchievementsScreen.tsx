import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ScreenGradient, ScreenHeader } from '../components';
import { Achievement, computeAchievements, earnedCount } from '../lib/achievements';
import { useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const pours = useStore((s) => s.pours);
  const corrections = useStore((s) => s.corrections);

  const list = useMemo(
    () => computeAchievements({ bottles, pours, corrections }),
    [bottles, pours, corrections]
  );
  const earned = earnedCount(list);

  const renderBadge = (a: Achievement) => (
    <Card key={a.id} style={[styles.badge, !a.earned && styles.locked]}>
      <View style={[styles.medal, a.earned && styles.medalEarned]}>
        <Ionicons
          name={a.icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={a.earned ? colors.ink : colors.textFaint}
        />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {a.title}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {a.description}
      </Text>
      {!a.earned && a.goal > 1 && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round((a.current / a.goal) * 100)}%` }]} />
        </View>
      )}
      {a.earned && <Text style={styles.earnedTag}>EARNED</Text>}
    </Card>
  );

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow={`${earned} / ${list.length} UNLOCKED`}
          title="Achievements"
          subtitle="Milestones across your collection and tasting journey."
          onBack={() => navigation.goBack()}
        />
        <View style={styles.grid}>{list.map(renderBadge)}</View>
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  badge: { width: '47%', alignItems: 'center', padding: spacing.md },
  locked: { opacity: 0.6 },
  medal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  medalEarned: { backgroundColor: colors.amber, borderColor: colors.amberBright },
  title: { color: colors.text, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  desc: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 3, lineHeight: 15 },
  track: {
    width: '100%',
    height: 5,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fill: { height: 5, backgroundColor: colors.amber, borderRadius: 3 },
  earnedTag: { color: colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: spacing.sm },
});
