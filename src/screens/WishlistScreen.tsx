import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ScreenGradient, ScreenHeader } from '../components';
import { hasPricingBackend } from '../config';
import { useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';
import { WishlistItem } from '../types';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const wishlist = useStore((s) => s.wishlist);
  const addWishlist = useStore((s) => s.addWishlist);
  const removeWishlist = useStore((s) => s.removeWishlist);
  const [input, setInput] = useState('');
  const [target, setTarget] = useState('');

  const add = () => {
    if (!input.trim()) return;
    const price = parseFloat(target);
    addWishlist({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.trim(),
      targetPrice: Number.isFinite(price) && price > 0 ? price : undefined,
      watchRelease: true,
      addedAt: Date.now(),
    });
    setInput('');
    setTarget('');
  };

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <Card style={styles.card}>
      <Ionicons name="heart" size={18} color={colors.amberBright} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.targetPrice ? `Alert under $${item.targetPrice}` : 'Watching for release'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeWishlist(item.id)} style={{ padding: 6 }}>
        <Ionicons name="close" size={18} color={colors.textFaint} />
      </TouchableOpacity>
    </Card>
  );

  return (
    <ScreenGradient>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md }}>
        <ScreenHeader eyebrow="THE CHASE" title="Hunt List" subtitle="Bottles you want — track them and set price targets." />

        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            value={input}
            onChangeText={setInput}
            placeholder="Bottle name"
            placeholderTextColor={colors.textFaint}
            onSubmitEditing={add}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            placeholder="$ target"
            placeholderTextColor={colors.textFaint}
          />
          <TouchableOpacity style={styles.addBtn} onPress={add} disabled={!input.trim()}>
            <Ionicons name="add" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {!hasPricingBackend() && (
          <Text style={styles.note}>
            Price-drop and release alerts activate once your pricing backend is connected. Until
            then this is your saved hunt list.
          </Text>
        )}

        {wishlist.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={40} color={colors.amber} />
            <Text style={styles.emptyText}>Nothing on the hunt yet. Add the bottles you're chasing.</Text>
          </View>
        ) : (
          <FlatList
            data={wishlist}
            keyExtractor={(w) => w.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 40 }}
          />
        )}
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },
  addBtn: {
    width: 48,
    borderRadius: radius.md,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { color: colors.textFaint, fontSize: 12, marginTop: spacing.md, lineHeight: 17, fontStyle: 'italic' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.textDim, textAlign: 'center', lineHeight: 20 },
});
