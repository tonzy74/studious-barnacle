import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, RarityBadge, ScreenGradient, ScreenHeader, TypeBadge } from '../components';
import { matchCollection } from '../lib/flavor';
import { useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';

function percentColor(p: number): string {
  if (p >= 90) return colors.success;
  if (p >= 75) return colors.amberBright;
  return colors.textDim;
}

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const learned = useStore((s) => s.learned);
  const track = useStore((s) => s.track);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [computed, setComputed] = useState(false);

  const addFavorite = () => {
    const v = input.trim();
    if (!v) return;
    setFavorites((f) => [...f, v]);
    setInput('');
    setComputed(false);
  };

  const removeFavorite = (i: number) => {
    setFavorites((f) => f.filter((_, idx) => idx !== i));
    setComputed(false);
  };

  const match = useMemo(
    () => (computed ? matchCollection(favorites, bottles, learned) : undefined),
    [computed, favorites, bottles, learned]
  );

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.md,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="HOST LIKE A PRO"
          title="Guest Match"
          subtitle="Enter what a guest loves, and see how each bottle in your bar suits their palate."
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="e.g. Blanton's, Eagle Rare, Weller…"
            placeholderTextColor={colors.textFaint}
            onSubmitEditing={addFavorite}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, !input.trim() && { opacity: 0.5 }]}
            onPress={addFavorite}
            disabled={!input.trim()}
          >
            <Ionicons name="add" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.chipWrap}>
          {favorites.map((f, i) => (
            <TouchableOpacity
              key={`${f}-${i}`}
              style={styles.favChip}
              onPress={() => removeFavorite(i)}
              activeOpacity={0.8}
            >
              <Text style={styles.favChipText}>{f}</Text>
              <Ionicons name="close" size={13} color={colors.amberBright} />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Find matches in my bar"
          icon="sparkles"
          onPress={() => {
            setComputed(true);
            track('match_computed', { count: favorites.length });
          }}
          disabled={favorites.length === 0 || bottles.length === 0}
          style={{ marginTop: spacing.md }}
        />
        {bottles.length === 0 && <Text style={styles.hint}>Add some bottles to your bar first.</Text>}

        {match && (
          <View style={{ marginTop: spacing.xl }}>
            {match.recognized.length > 0 && (
              <Text style={styles.metaText}>
                Taste profile built from: {match.recognized.map((r) => r.name).join(', ')}
              </Text>
            )}
            {match.unrecognized.length > 0 && (
              <Text style={[styles.metaText, { color: colors.danger }]}>
                Not in the reference database (ignored): {match.unrecognized.join(', ')}
              </Text>
            )}

            {match.results.map(({ bottle, percent }) => (
              <Card key={bottle.id} style={styles.resultCard}>
                <View style={styles.resultTop}>
                  <Text style={[styles.percent, { color: percentColor(percent) }]}>{percent}%</Text>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {bottle.name}
                    </Text>
                    <Text style={styles.resultSub}>
                      {bottle.distillery} · {bottle.proof} proof
                    </Text>
                  </View>
                  <TypeBadge type={bottle.type} />
                  <RarityBadge rarity={bottle.rarity} size={24} />
                </View>
                <View style={styles.percentTrack}>
                  <View
                    style={[
                      styles.percentFill,
                      { width: `${percent}%`, backgroundColor: percentColor(percent) },
                    ]}
                  />
                </View>
              </Card>
            ))}

            {match.results.length === 0 && match.recognized.length > 0 && (
              <Text style={styles.hint}>Your bar is empty — nothing to match against.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', marginTop: spacing.xs, gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: colors.amber,
    width: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  favChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderBright,
  },
  favChipText: { color: colors.amberBright, fontSize: 13, fontWeight: '600' },
  hint: { color: colors.textDim, marginTop: spacing.md, fontSize: 13 },
  metaText: { color: colors.textDim, fontSize: 12, marginBottom: spacing.md, lineHeight: 17 },
  resultCard: { padding: spacing.md, marginBottom: spacing.md },
  resultTop: { flexDirection: 'row', alignItems: 'center' },
  percent: { fontSize: 22, fontWeight: '800', width: 58 },
  resultName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  resultSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  percentTrack: {
    height: 7,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  percentFill: { height: 7, borderRadius: 4 },
});
