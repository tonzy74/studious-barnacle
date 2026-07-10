import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ScreenGradient, ScreenHeader } from '../components';
import { lineupProgress } from '../lib/lineups';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, radius, spacing, type as typo } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LineupsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const wishlist = useStore((s) => s.wishlist);
  const addWishlist = useStore((s) => s.addWishlist);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const lineups = lineupProgress(bottles);
  const onList = (name: string) =>
    added.has(name) || wishlist.some((w) => w.name.toLowerCase() === name.toLowerCase());

  const hunt = (name: string, distillery: string) => {
    addWishlist({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      distillery,
      watchRelease: true,
      addedAt: Date.now(),
    });
    setAdded((prev) => new Set(prev).add(name));
  };

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="COMPLETE THE SET"
          title="Your Lineups"
          subtitle="Iconic sets you've started. Add the missing bottles to your hunt list and finish the collection."
          onBack={() => navigation.goBack()}
        />

        {lineups.length === 0 && (
          <Card style={{ marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="albums-outline" size={30} color={colors.amber} />
            <Text style={styles.empty}>
              Start collecting from a distillery's lineup — E.H. Taylor, Weller, Four Roses, Old
              Forester Whiskey Row — and we'll track your progress here.
            </Text>
          </Card>
        )}

        {lineups.map((lu) => (
          <Card key={lu.name} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{lu.name}</Text>
                <Text style={styles.sub}>{lu.distillery}</Text>
              </View>
              <Text style={styles.count}>
                {lu.owned}/{lu.total}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(lu.progress * 100)}%` }]} />
            </View>

            <Text style={styles.missingLabel}>Still hunting</Text>
            {lu.missing.map((m) => (
              <View key={m} style={styles.missingRow}>
                <Text style={styles.missingName}>{m}</Text>
                <TouchableOpacity
                  style={[styles.huntBtn, onList(m) && styles.huntBtnDone]}
                  onPress={() => hunt(m, lu.distillery)}
                  disabled={onList(m)}
                >
                  <Ionicons
                    name={onList(m) ? 'checkmark' : 'heart-outline'}
                    size={14}
                    color={onList(m) ? colors.success : colors.ink}
                  />
                  <Text style={[styles.huntText, onList(m) && { color: colors.success }]}>
                    {onList(m) ? 'On list' : 'Hunt'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textDim, textAlign: 'center', lineHeight: 20 },
  card: { marginTop: spacing.lg, padding: spacing.md, gap: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sub: { color: colors.amberBright, fontSize: 12.5, marginTop: 2 },
  count: { color: colors.text, fontSize: 18, fontWeight: '900' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.amber },
  missingLabel: { ...typo.overline, color: colors.amberDeep, marginTop: spacing.sm },
  missingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  missingName: { color: colors.text, fontSize: 14, flex: 1, marginRight: spacing.sm },
  huntBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.amber,
  },
  huntBtnDone: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.success },
  huntText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
});
