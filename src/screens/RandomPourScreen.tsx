import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Chip,
  RarityBadge,
  ScreenGradient,
  ScreenHeader,
  TypeBadge,
  TypeIcon,
} from '../components';
import { randomPour } from '../lib/flavor';
import { useStore } from '../store/useStore';
import { colors, gradients, radius, spacing, type as typo } from '../theme';
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
  const insets = useSafeAreaInsets();
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
          eyebrow="THE VAULT DECIDES"
          title="Random Pour"
          subtitle="Can't decide? Let the bar choose your dram."
        />

        <Text style={styles.label}>Style</Text>
        <View style={styles.chipRow}>
          {TYPE_FILTERS.map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>

        <Card style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Open bottles only</Text>
            <Switch
              value={openedOnly}
              onValueChange={setOpenedOnly}
              trackColor={{ true: colors.amber, false: colors.cardAlt }}
              thumbColor={colors.text}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
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
        </Card>

        <Button
          title="Pour me something"
          icon="dice"
          onPress={roll}
          style={{ marginTop: spacing.xl }}
        />

        {rolled && !pick && (
          <Text style={styles.noMatch}>
            Nothing in your bar matches those filters — loosen them up or add more bottles.
          </Text>
        )}

        {pick && (
          <LinearGradient colors={gradients.hero} style={styles.resultCard}>
            <Text style={styles.resultLabel}>TONIGHT'S POUR</Text>
            <View style={styles.resultTop}>
              <TypeIcon type={pick.type} size={48} />
              <View style={styles.resultBadges}>
                <TypeBadge type={pick.type} />
                <RarityBadge rarity={pick.rarity} size={30} />
              </View>
            </View>
            <Text style={styles.resultName}>{pick.name}</Text>
            <Text style={styles.resultSub}>
              {pick.distillery} · {pick.proof} proof ·{' '}
              {pick.opened ? 'already open' : 'crack it open'}
            </Text>
            <Text style={styles.resultNotes}>{pick.notes}</Text>
            <Button
              title="Roll again"
              icon="refresh"
              variant="secondary"
              onPress={roll}
              style={{ marginTop: spacing.lg }}
            />
          </LinearGradient>
        )}
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.amberBright, marginBottom: spacing.sm, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  switchHint: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  noMatch: { color: colors.textDim, textAlign: 'center', marginTop: spacing.xl, lineHeight: 20 },
  resultCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.amberDeep,
  },
  resultLabel: { ...typo.overline, color: colors.amber, letterSpacing: 2 },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resultBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resultName: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.md },
  resultSub: { color: colors.amberBright, marginTop: 6, fontSize: 13.5 },
  resultNotes: { color: colors.textDim, marginTop: spacing.md, lineHeight: 20 },
});
