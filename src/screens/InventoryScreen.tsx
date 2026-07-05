import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, RarityBadge, ScreenGradient, StatTile, TypeBadge, TypeIcon } from '../components';
import { fairPrice, formatUsd } from '../lib/pricing';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, radius, spacing, type as typo } from '../theme';
import { Bottle } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function InventoryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const hideValues = useStore((s) => s.hideValues);
  const toggleHideValues = useStore((s) => s.toggleHideValues);
  const collectionValue = bottles.reduce((sum, b) => {
    const fair = fairPrice(b.msrp, b.secondary, b.rarity);
    return sum + (fair ?? 0) * Math.max(1, b.quantity);
  }, 0);
  const openCount = bottles.filter((b) => b.opened).length;

  const renderItem = ({ item }: { item: Bottle }) => {
    const fair = fairPrice(item.msrp, item.secondary, item.rarity);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BottleDetail', { id: item.id })}
      >
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <TypeIcon type={item.type} size={44} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={styles.cardHeader}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <RarityBadge rarity={item.rarity} size={26} />
              </View>
              <Text style={styles.sub} numberOfLines={1}>
                {item.distillery} · {item.proof} proof
                {item.quantity > 1 ? ` · x${item.quantity}` : ''}
              </Text>
              <View style={styles.metaRow}>
                <TypeBadge type={item.type} />
                <View style={styles.openChip}>
                  <Ionicons
                    name={item.opened ? 'ellipse-outline' : 'lock-closed'}
                    size={10}
                    color={item.opened ? colors.textDim : colors.success}
                  />
                  <Text style={styles.openChipText}>{item.opened ? 'Open' : 'Sealed'}</Text>
                </View>
                {fair !== undefined && (
                  <Text style={styles.value}>{hideValues ? '•••' : formatUsd(fair)}</Text>
                )}
              </View>
            </View>
          </View>
          {(item.batch || item.pickName || item.barrelNo) && (
            <Text style={styles.variant} numberOfLines={1}>
              {[
                item.batch ? `Batch ${item.batch}` : '',
                item.barrelNo ? `Barrel #${item.barrelNo}` : '',
                item.pickName ? `${item.pickName} pick` : '',
              ]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenGradient style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={styles.eyebrow}>WHISKEY VAULT</Text>
          <Text style={styles.title}>My Bar</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Explore')}
            style={styles.gearButton}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={20} color={colors.amberBright} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.gearButton}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color={colors.amberBright} />
          </TouchableOpacity>
        </View>
      </View>

      {bottles.length > 0 && (
        <View style={styles.statsRow}>
          <StatTile label="Bottles" value={String(bottles.length)} icon="wine" />
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={toggleHideValues}>
            <StatTile
              label={hideValues ? 'Value · tap to show' : 'Est. Value'}
              value={hideValues ? '••••' : collectionValue > 0 ? formatUsd(collectionValue) : '—'}
              icon={hideValues ? 'eye-off' : 'eye'}
            />
          </TouchableOpacity>
          <StatTile label="Open" value={String(openCount)} icon="ellipse-outline" />
        </View>
      )}

      {bottles.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyGlyph}>
            <Ionicons name="wine-outline" size={44} color={colors.amber} />
          </View>
          <Text style={styles.emptyTitle}>Your bar is empty</Text>
          <Text style={styles.emptyText}>
            Scan a bottle's barcode or snap your whole shelf to start building your collection.
          </Text>
          <Button
            title="Bulk add from a shelf photo"
            icon="camera"
            onPress={() => navigation.navigate('BulkAdd')}
            style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
          />
          <Button
            title="Add a bottle manually"
            icon="add"
            variant="secondary"
            onPress={() => navigation.navigate('AddBottle', {})}
            style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={bottles}
            keyExtractor={(b) => b.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: spacing.xs }}
          />
          <View style={[styles.fabWrap, { bottom: spacing.lg }]}>
            <Button
              title="Bulk add"
              icon="camera"
              onPress={() => navigation.navigate('BulkAdd')}
              style={{ flex: 1 }}
            />
            <Button
              title="Add"
              icon="add"
              variant="secondary"
              onPress={() => navigation.navigate('AddBottle', {})}
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  eyebrow: { ...typo.overline, color: colors.amberDeep },
  title: { ...typo.display, color: colors.text, marginTop: 2 },
  gearButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  card: { marginBottom: spacing.md, padding: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  sub: { color: colors.textDim, marginTop: 3, fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  openChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  openChipText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  value: { color: colors.amberBright, fontSize: 13, fontWeight: '800', marginLeft: 'auto' },
  variant: {
    color: colors.amber,
    marginTop: spacing.sm,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyGlyph: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typo.title, color: colors.text },
  emptyText: { color: colors.textDim, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  fabWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
});
