import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { Button, RarityBadge, TypeBadge } from '../components';
import { randomPour } from '../lib/flavor';
import { useStore } from '../store/useStore';
import { colors } from '../theme';
import { Bottle, WhiskeyType } from '../types';

const TYPE_FILTERS: (WhiskeyType | 'any')[] = [
  'any',
  'bourbon',
  'rye',
  'tennessee',
  'scotch',
  'irish',
  'japanese',
  'canadian',
];

export default function RandomPourScreen() {
  const bottles = useStore((s) => s.bottles);
  const track = useStore((s) => s.track);
  const [type, setType] = useState<WhiskeyType | 'any'>('any');
  const [openedOnly, setOpenedOnly] = useState(false);
  const [protectAllocated, setProtectAllocated] = useState(true);
  const [pick, setPick] = useState<Bottle | undefined>();
  const [rolled, setRolled] = useState(false);

  const roll = () => {
    setPick(randomPour(bottles, { type, openedOnly, protectAllocated }));
    setRolled(true);
    track('pour_rolled', { type, protectAllocated });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.title}>Random Pour</Text>
      <Text style={styles.subtitle}>Can't decide? Let the bar decide for you.</Text>

      <Text style={styles.label}>Style</Text>
      <View style={styles.chipRow}>
        {TYPE_FILTERS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Open bottles only</Text>
        <Switch
          value={openedOnly}
          onValueChange={setOpenedOnly}
          trackColor={{ true: colors.amber, false: colors.cardAlt }}
          thumbColor={colors.text}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.switchLabel}>Protect allocated bottles</Text>
          <Text style={styles.switchHint}>Keeps S and A tier out of the random pool</Text>
        </View>
        <Switch
          value={protectAllocated}
          onValueChange={setProtectAllocated}
          trackColor={{ true: colors.amber, false: colors.cardAlt }}
          thumbColor={colors.text}
        />
      </View>

      <Button title="🥃  Pour me something" onPress={roll} style={{ marginTop: 24 }} />

      {rolled && !pick && (
        <Text style={styles.noMatch}>
          Nothing in your bar matches those filters — loosen them up or add more bottles.
        </Text>
      )}

      {pick && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>TONIGHT'S POUR</Text>
          <View style={styles.resultHeader}>
            <Text style={styles.resultName}>{pick.name}</Text>
            <TypeBadge type={pick.type} />
            <RarityBadge rarity={pick.rarity} />
          </View>
          <Text style={styles.resultSub}>
            {pick.distillery} · {pick.proof} proof · {pick.opened ? 'already open' : 'crack it open'}
          </Text>
          <Text style={styles.resultNotes}>{pick.notes}</Text>
          <Button title="Roll again" variant="secondary" onPress={roll} style={{ marginTop: 16 }} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.textDim, marginTop: 4 },
  label: { color: colors.amberBright, marginTop: 20, marginBottom: 8, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  chipText: { color: colors.textDim, fontSize: 13 },
  chipTextActive: { color: '#1a120b', fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  switchLabel: { color: colors.text, fontSize: 16 },
  switchHint: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  noMatch: { color: colors.textDim, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  resultLabel: { color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  resultName: { color: colors.text, fontSize: 22, fontWeight: '800', flex: 1, marginRight: 8 },
  resultSub: { color: colors.amberBright, marginTop: 6 },
  resultNotes: { color: colors.textDim, marginTop: 10, lineHeight: 20 },
});
