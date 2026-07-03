import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button, FlavorBars, TypeBadge } from '../components';
import { FLAVOR_AXES, FLAVOR_LABELS } from '../data/whiskeyDatabase';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors } from '../theme';
import { FlavorSource } from '../types';

type Route = RouteProp<RootStackParamList, 'BottleDetail'>;

const SOURCE_LABELS: Record<FlavorSource, string> = {
  db: 'Profile from the reference database (aggregated professional reviews).',
  ai: 'Profile estimated by AI from professional-review knowledge.',
  default: 'Style-typical estimate — this bottle isn\'t in the reference database.',
  user: 'Profile customized by you.',
};

export default function BottleDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const bottle = useStore((s) => s.bottles.find((b) => b.id === params.id));
  const updateBottle = useStore((s) => s.updateBottle);
  const removeBottle = useStore((s) => s.removeBottle);
  const [editing, setEditing] = useState(false);

  if (!bottle) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textDim }}>Bottle not found.</Text>
      </View>
    );
  }

  const variantLine = [
    bottle.batch ? `Batch ${bottle.batch}` : '',
    bottle.barrelNo ? `Barrel #${bottle.barrelNo}` : '',
    bottle.pickName ? `${bottle.pickName} pick` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const nudge = (axis: (typeof FLAVOR_AXES)[number], delta: number) => {
    const next = Math.round(Math.min(10, Math.max(0, bottle.flavor[axis] + delta)) * 10) / 10;
    updateBottle(bottle.id, {
      flavor: { ...bottle.flavor, [axis]: next },
      flavorSource: 'user',
    });
  };

  const confirmDelete = () => {
    Alert.alert('Remove bottle', `Remove ${bottle.name} from your bar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeBottle(bottle.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{bottle.name}</Text>
        <TypeBadge type={bottle.type} />
      </View>
      <Text style={styles.sub}>
        {bottle.distillery} · {bottle.proof} proof
        {bottle.barcode ? ` · UPC ${bottle.barcode}` : ''}
      </Text>
      {!!variantLine && <Text style={styles.variant}>{variantLine}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasting notes</Text>
        <Text style={styles.notes}>{bottle.notes || 'No notes yet.'}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flavor profile</Text>
          <TouchableOpacity onPress={() => setEditing((e) => !e)}>
            <Text style={styles.editToggle}>{editing ? 'Done' : 'Adjust'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View>
            {FLAVOR_AXES.map((axis) => (
              <View key={axis} style={styles.editRow}>
                <Text style={styles.editLabel}>{FLAVOR_LABELS[axis]}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => nudge(axis, -0.5)}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.editValue}>{bottle.flavor[axis].toFixed(1)}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => nudge(axis, 0.5)}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.estimate}>
              Adjust to how this bottle actually tastes to you — picks and batches vary. Matching
              uses your adjusted values.
            </Text>
          </View>
        ) : (
          <>
            <FlavorBars profile={bottle.flavor} />
            <Text style={styles.estimate}>{SOURCE_LABELS[bottle.flavorSource ?? (bottle.refId ? 'db' : 'default')]}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.row}>
          <Button
            title={bottle.opened ? 'Mark sealed' : 'Mark opened'}
            variant="secondary"
            onPress={() => updateBottle(bottle.id, { opened: !bottle.opened })}
            style={{ flex: 1 }}
          />
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <Button
            title="−"
            variant="secondary"
            onPress={() => updateBottle(bottle.id, { quantity: Math.max(0, bottle.quantity - 1) })}
            style={{ flex: 1 }}
          />
          <Text style={styles.qty}>{bottle.quantity} in stock</Text>
          <Button
            title="+"
            variant="secondary"
            onPress={() => updateBottle(bottle.id, { quantity: bottle.quantity + 1 })}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <Button
        title="Remove from bar"
        variant="danger"
        onPress={confirmDelete}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', flex: 1, marginRight: 10 },
  sub: { color: colors.amberBright, marginTop: 6 },
  variant: { color: colors.amber, marginTop: 4, fontWeight: '700', fontSize: 13 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  editToggle: { color: colors.amber, fontWeight: '700' },
  notes: { color: colors.textDim, lineHeight: 20 },
  estimate: { color: colors.textDim, fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  editRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  editLabel: { color: colors.textDim, flex: 1, fontSize: 14 },
  stepBtn: {
    backgroundColor: colors.cardAlt,
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepText: { color: colors.amber, fontSize: 18, fontWeight: '800' },
  editValue: { color: colors.text, width: 44, textAlign: 'center', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qty: { color: colors.text, fontWeight: '700', paddingHorizontal: 8 },
});
