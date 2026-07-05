import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ProLock, RarityBadge, ScreenGradient, ScreenHeader, TypeBadge, TypeIcon } from '../components';
import { formatUsd, fairPrice } from '../lib/pricing';
import { recommendBottles, Recommendation } from '../lib/recommend';
import { useProGate } from '../useProGate';
import { useStore } from '../store/useStore';
import { colors, spacing } from '../theme';

export default function RecommendScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const learned = useStore((s) => s.learned);
  const addWishlist = useStore((s) => s.addWishlist);
  const { locked, goPro } = useProGate('recommendations');

  const recs = useMemo(() => recommendBottles(bottles, learned, 20), [bottles, learned]);

  const addToHunt = (r: Recommendation) =>
    addWishlist({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: r.record.name,
      distillery: r.record.distillery,
      watchRelease: true,
      addedAt: Date.now(),
    });

  const renderItem = ({ item }: { item: Recommendation }) => {
    const price = fairPrice(item.record.msrp, item.record.secondary, item.record.rarity);
    return (
      <Card style={styles.card}>
        <TypeIcon type={item.record.type} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.record.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item.record.distillery} · {item.record.proof} proof
            {price !== undefined ? ` · ${formatUsd(price)}` : ''}
          </Text>
          <View style={styles.badges}>
            <TypeBadge type={item.record.type} />
            <RarityBadge rarity={item.record.rarity} size={22} />
            <Text style={styles.match}>{item.match}% match</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => addToHunt(item)} style={styles.add}>
          <Ionicons name="heart-outline" size={20} color={colors.amberBright} />
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <ScreenGradient>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md }}>
        <ScreenHeader
          eyebrow="MATCHED TO YOU"
          title="For You"
          subtitle="Bottles you don't own yet, ranked against your collection's flavor profile."
          onBack={() => navigation.goBack()}
        />
        {locked ? (
          <ProLock
            title="Personalized recommendations are a Pro feature"
            benefits={[
              'Bottles matched to your exact palate',
              'Ranked against your whole collection',
              'Plus the full AI suite',
            ]}
            onUpgrade={goPro}
          />
        ) : recs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={40} color={colors.amber} />
            <Text style={styles.emptyText}>
              Add a few bottles to your bar and we'll learn your palate and recommend what to try
              next.
            </Text>
          </View>
        ) : (
          <FlatList
            data={recs}
            keyExtractor={(r) => r.record.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: spacing.xs, paddingBottom: 40 }}
          />
        )}
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  match: { color: colors.amberBright, fontSize: 12, fontWeight: '800' },
  add: { padding: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.textDim, textAlign: 'center', lineHeight: 20 },
});
