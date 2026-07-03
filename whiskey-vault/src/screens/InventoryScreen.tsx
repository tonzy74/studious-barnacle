import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button, TypeBadge } from '../components';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors } from '../theme';
import { Bottle } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function InventoryScreen() {
  const navigation = useNavigation<Nav>();
  const bottles = useStore((s) => s.bottles);

  const renderItem = ({ item }: { item: Bottle }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BottleDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <TypeBadge type={item.type} />
      </View>
      <Text style={styles.sub}>
        {item.distillery} · {item.proof} proof · {item.opened ? 'Open' : 'Sealed'}
        {item.quantity > 1 ? ` · x${item.quantity}` : ''}
      </Text>
      <Text style={styles.notes} numberOfLines={2}>
        {item.notes}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Bar</Text>
          <Text style={styles.count}>
            {bottles.length} bottle{bottles.length === 1 ? '' : 's'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settings}>⚙︎</Text>
        </TouchableOpacity>
      </View>

      {bottles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your bar is empty</Text>
          <Text style={styles.emptyText}>
            Scan a bottle's barcode or add one manually to start building your collection.
          </Text>
          <Button
            title="Add a bottle manually"
            onPress={() => navigation.navigate('AddBottle', {})}
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={bottles}
            keyExtractor={(b) => b.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 90 }}
          />
          <View style={styles.fabWrap}>
            <Button title="+ Add manually" onPress={() => navigation.navigate('AddBottle', {})} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  count: { color: colors.textDim, marginTop: 2 },
  settings: { color: colors.textDim, fontSize: 26 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  sub: { color: colors.amberBright, marginTop: 4, fontSize: 13 },
  notes: { color: colors.textDim, marginTop: 6, fontSize: 13, lineHeight: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  emptyText: { color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  fabWrap: { position: 'absolute', bottom: 16, left: 16, right: 16 },
});
