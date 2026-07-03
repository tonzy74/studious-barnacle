import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, FlavorBars, TypeBadge } from '../components';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors } from '../theme';

type Route = RouteProp<RootStackParamList, 'BottleDetail'>;

export default function BottleDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const bottle = useStore((s) => s.bottles.find((b) => b.id === params.id));
  const updateBottle = useStore((s) => s.updateBottle);
  const removeBottle = useStore((s) => s.removeBottle);

  if (!bottle) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textDim }}>Bottle not found.</Text>
      </View>
    );
  }

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasting notes</Text>
        <Text style={styles.notes}>{bottle.notes || 'No notes yet.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flavor profile</Text>
        <FlavorBars profile={bottle.flavor} />
        {!bottle.refId && (
          <Text style={styles.estimate}>
            Estimated from style — this bottle isn't in the reference database.
          </Text>
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
            onPress={() =>
              updateBottle(bottle.id, { quantity: Math.max(0, bottle.quantity - 1) })
            }
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

      <Button title="Remove from bar" variant="danger" onPress={confirmDelete} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', flex: 1, marginRight: 10 },
  sub: { color: colors.amberBright, marginTop: 6 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.text, fontWeight: '700', marginBottom: 8, fontSize: 15 },
  notes: { color: colors.textDim, lineHeight: 20 },
  estimate: { color: colors.textDim, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qty: { color: colors.text, fontWeight: '700', paddingHorizontal: 8 },
});
