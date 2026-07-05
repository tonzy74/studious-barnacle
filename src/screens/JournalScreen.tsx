import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, ScreenGradient, ScreenHeader, StatTile } from '../components';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';
import { Pour } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function ratingColor(r?: number): string {
  if (r === undefined) return colors.textDim;
  if (r >= 85) return colors.success;
  if (r >= 60) return colors.amberBright;
  return colors.textDim;
}

export default function JournalScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const pours = useStore((s) => s.pours);
  const removePour = useStore((s) => s.removePour);

  const rated = pours.filter((p) => typeof p.rating === 'number');
  const avg =
    rated.length > 0 ? Math.round(rated.reduce((a, p) => a + (p.rating ?? 0), 0) / rated.length) : 0;

  const renderItem = ({ item }: { item: Pour }) => (
    <Card style={styles.card}>
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.thumb} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.date}>{new Date(item.at).toLocaleDateString()}</Text>
        {!!item.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </View>
      {item.rating !== undefined && (
        <Text style={[styles.rating, { color: ratingColor(item.rating) }]}>{item.rating}</Text>
      )}
      <TouchableOpacity onPress={() => removePour(item.id)} style={styles.del}>
        <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
      </TouchableOpacity>
    </Card>
  );

  return (
    <ScreenGradient>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md }}>
        <ScreenHeader eyebrow="EVERY DRAM" title="Tasting Journal" />
        {pours.length > 0 && (
          <View style={styles.stats}>
            <StatTile label="Pours" value={String(pours.length)} icon="book" />
            <StatTile label="Avg score" value={rated.length ? `${avg}` : '—'} icon="star-half" />
            <StatTile
              label="Top score"
              value={rated.length ? `${Math.max(...rated.map((p) => p.rating ?? 0))}` : '—'}
              icon="ribbon"
            />
          </View>
        )}

        {pours.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={40} color={colors.amber} />
            <Text style={styles.emptyText}>
              No pours logged yet. Log what you drink to build your palate history.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pours}
            keyExtractor={(p) => p.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: spacing.xs }}
          />
        )}

        <View style={styles.fab}>
          <Button title="Log a pour" icon="add" onPress={() => navigation.navigate('LogPour', {})} />
        </View>
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  thumb: { width: 40, height: 52, borderRadius: 6, backgroundColor: colors.bgElevated },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  date: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  notes: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  rating: { fontSize: 22, fontWeight: '800', marginLeft: spacing.sm },
  del: { padding: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.textDim, textAlign: 'center', lineHeight: 20 },
  fab: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
});
