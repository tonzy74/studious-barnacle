import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, RarityBadge, TypeBadge } from '../components';
import { matchCollection } from '../lib/flavor';
import { useStore } from '../store/useStore';
import { colors } from '../theme';

function percentColor(p: number): string {
  if (p >= 90) return colors.success;
  if (p >= 75) return colors.amber;
  return colors.textDim;
}

export default function MatchScreen() {
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.title}>Guest Match</Text>
      <Text style={styles.subtitle}>
        Enter the bourbons or whiskeys someone loves, and see how each bottle in your bar matches
        their taste.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="e.g. Blanton's, Eagle Rare, Weller…"
          placeholderTextColor={colors.textDim}
          onSubmitEditing={addFavorite}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addFavorite} disabled={!input.trim()}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chipWrap}>
        {favorites.map((f, i) => (
          <TouchableOpacity key={`${f}-${i}`} style={styles.chip} onPress={() => removeFavorite(i)}>
            <Text style={styles.chipText}>{f}  ✕</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Find matches in my bar"
        onPress={() => {
          setComputed(true);
          track('match_computed', { count: favorites.length });
        }}
        disabled={favorites.length === 0 || bottles.length === 0}
        style={{ marginTop: 12 }}
      />
      {bottles.length === 0 && (
        <Text style={styles.hint}>Add some bottles to your bar first.</Text>
      )}

      {match && (
        <View style={{ marginTop: 20 }}>
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
            <View key={bottle.id} style={styles.resultCard}>
              <View style={styles.resultTop}>
                <Text style={[styles.percent, { color: percentColor(percent) }]}>{percent}%</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resultName}>{bottle.name}</Text>
                  <Text style={styles.resultSub}>
                    {bottle.distillery} · {bottle.proof} proof
                  </Text>
                </View>
                <TypeBadge type={bottle.type} />
                <RarityBadge rarity={bottle.rarity} />
              </View>
              <View style={styles.percentTrack}>
                <View
                  style={[
                    styles.percentFill,
                    { width: `${percent}%`, backgroundColor: percentColor(percent) },
                  ]}
                />
              </View>
            </View>
          ))}

          {match.results.length === 0 && match.recognized.length > 0 && (
            <Text style={styles.hint}>Your bar is empty — nothing to match against.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.textDim, marginTop: 4, lineHeight: 20 },
  inputRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: colors.amber,
    width: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#1a120b', fontSize: 24, fontWeight: '800' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.amberBright, fontSize: 13 },
  hint: { color: colors.textDim, marginTop: 10, fontSize: 13 },
  metaText: { color: colors.textDim, fontSize: 12, marginBottom: 10, lineHeight: 17 },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTop: { flexDirection: 'row', alignItems: 'center' },
  percent: { fontSize: 22, fontWeight: '800', width: 64 },
  resultName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  resultSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  percentTrack: {
    height: 6,
    backgroundColor: colors.cardAlt,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  percentFill: { height: 6, borderRadius: 3 },
});
