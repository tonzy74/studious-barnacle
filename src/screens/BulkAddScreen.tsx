import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, RarityBadge, TypeBadge } from '../components';
import { IdentifiedBottle, identifyBottlesFromPhoto } from '../lib/claude';
import { findWhiskeyByName, scaleProfileForProof } from '../lib/flavor';
import { buildLearnedRecord } from '../lib/library';
import { RootStackParamList } from '../navigation';
import { newBottleId, useStore } from '../store/useStore';
import { colors } from '../theme';
import { WhiskeyRecord } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ReviewItem {
  identified: IdentifiedBottle;
  match?: WhiskeyRecord;
  selected: boolean;
}

const CONFIDENCE_COLORS = { high: colors.success, medium: colors.amber, low: colors.danger };

export default function BulkAddScreen() {
  const navigation = useNavigation<Nav>();
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const learned = useStore((s) => s.learned);
  const addBottle = useStore((s) => s.addBottle);
  const learnRecord = useStore((s) => s.learnRecord);
  const track = useStore((s) => s.track);

  const [busy, setBusy] = useState<'idle' | 'analyzing' | 'adding'>('idle');
  const [items, setItems] = useState<ReviewItem[] | undefined>();
  const [error, setError] = useState('');

  const analyze = async (fromCamera: boolean) => {
    setError('');
    const picker = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Camera access is needed to photograph your shelf.');
        return;
      }
    }
    const result = await picker({
      mediaTypes: ['images'],
      quality: 0.4,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    setBusy('analyzing');
    try {
      const identified = await identifyBottlesFromPhoto(
        apiKey,
        result.assets[0].base64,
        result.assets[0].mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
        model
      );
      if (identified.length === 0) {
        setError('No whiskey bottles identified — try a closer shot with labels facing the camera.');
        setItems(undefined);
      } else {
        setItems(
          identified.map((b) => ({
            identified: b,
            match: findWhiskeyByName(`${b.name} ${b.distillery}`, learned),
            // Low-confidence reads start unchecked so a blurry guess
            // doesn't slip into the collection unnoticed.
            selected: b.confidence !== 'low',
          }))
        );
      }
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 401
          ? 'API key rejected — check it in Settings.'
          : `Analysis failed: ${(err as Error).message}`
      );
    } finally {
      setBusy('idle');
    }
  };

  const toggle = (index: number) =>
    setItems((prev) => prev?.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it)));

  const addSelected = async () => {
    if (!items) return;
    const chosen = items.filter((i) => i.selected);
    setBusy('adding');
    let matchedCount = 0;
    for (const item of chosen) {
      const { identified, match } = item;
      const proof = identified.proof ?? match?.proof ?? 80;
      if (match) {
        matchedCount++;
        addBottle({
          id: newBottleId(),
          name: match.name,
          distillery: match.distillery,
          type: match.type,
          proof,
          refId: match.id,
          flavor: scaleProfileForProof(match.flavor, match.proof, proof),
          flavorSource: 'db',
          notes: match.notes,
          rarity: match.rarity,
          msrp: match.msrp,
          secondary: match.secondary,
          opened: false,
          quantity: 1,
          addedAt: Date.now(),
        });
      } else {
        // Unknown bottling: style-typical profile now, taught to the learned
        // library; it can be AI-profiled or hand-tuned from its detail page.
        const record = await buildLearnedRecord({
          name: identified.name,
          brand: identified.distillery || undefined,
          type: identified.type,
          proof,
        });
        learnRecord(record);
        addBottle({
          id: newBottleId(),
          name: record.name,
          distillery: record.distillery,
          type: record.type,
          proof,
          refId: record.id,
          flavor: record.flavor,
          flavorSource: 'default',
          notes: record.notes,
          rarity: record.rarity,
          msrp: record.msrp,
          secondary: record.secondary,
          opened: false,
          quantity: 1,
          addedAt: Date.now(),
        });
      }
    }
    track('bulk_add_completed', { count: chosen.length, matched: matchedCount });
    setBusy('idle');
    Alert.alert('Added to your bar', `${chosen.length} bottle${chosen.length === 1 ? '' : 's'} added.`, [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  if (!apiKey) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.title}>Shelf scanning needs AI</Text>
        <Text style={styles.help}>
          Bulk add reads bottle labels with the AI sommelier. Add your Anthropic API key in
          Settings to enable it.
        </Text>
        <Button
          title="Open Settings"
          onPress={() => navigation.navigate('Settings')}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {!items && (
        <>
          <Text style={styles.title}>Add your whole shelf at once</Text>
          <Text style={styles.help}>
            Take a photo of your bar with labels facing the camera (or pick an existing photo).
            The AI identifies every bottle; you review and confirm before anything is added.
            For big collections, several photos of 10–15 bottles each beat one wide shot.
          </Text>
          <Button
            title="📸 Photograph my shelf"
            onPress={() => analyze(true)}
            disabled={busy !== 'idle'}
            style={{ marginTop: 20 }}
          />
          <Button
            title="Choose from photo library"
            variant="secondary"
            onPress={() => analyze(false)}
            disabled={busy !== 'idle'}
            style={{ marginTop: 10 }}
          />
        </>
      )}

      {busy === 'analyzing' && (
        <View style={[styles.center, { marginTop: 32 }]}>
          <ActivityIndicator color={colors.amber} size="large" />
          <Text style={styles.help}>Reading labels… this takes a few seconds.</Text>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {items && (
        <>
          <Text style={styles.title}>
            Found {items.length} bottle{items.length === 1 ? '' : 's'}
          </Text>
          <Text style={styles.help}>
            Tap to include/exclude. ✓ database match uses professional tasting profiles; others
            get a style profile you can refine later. Low-confidence reads start unchecked.
          </Text>

          {items.map((item, index) => (
            <TouchableOpacity
              key={`${item.identified.name}-${index}`}
              style={[styles.card, item.selected && styles.cardSelected]}
              onPress={() => toggle(index)}
            >
              <View style={styles.cardRow}>
                <Text style={styles.check}>{item.selected ? '☑' : '☐'}</Text>
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                  <Text style={styles.name}>{item.match?.name ?? item.identified.name}</Text>
                  <Text style={styles.sub}>
                    {item.match
                      ? `✓ Matched: ${item.match.distillery}`
                      : item.identified.distillery || 'Unknown distillery'}
                    {item.identified.proof ? ` · ${item.identified.proof} proof` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={styles.badgeRow}>
                    <TypeBadge type={(item.match ?? item.identified).type} />
                    <RarityBadge rarity={item.match?.rarity} />
                  </View>
                  <Text
                    style={[styles.confidence, { color: CONFIDENCE_COLORS[item.identified.confidence] }]}
                  >
                    {item.identified.confidence} confidence
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <Button
            title={
              busy === 'adding'
                ? 'Adding…'
                : `Add ${items.filter((i) => i.selected).length} bottles to my bar`
            }
            onPress={addSelected}
            disabled={busy !== 'idle' || items.every((i) => !i.selected)}
            style={{ marginTop: 16 }}
          />
          <Button
            title="Scan a different photo"
            variant="secondary"
            onPress={() => setItems(undefined)}
            disabled={busy !== 'idle'}
            style={{ marginTop: 10 }}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  help: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 8 },
  error: { color: colors.danger, marginTop: 14, lineHeight: 19 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 10,
    opacity: 0.65,
  },
  cardSelected: { opacity: 1, borderColor: colors.amber },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  check: { color: colors.amber, fontSize: 20 },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 3 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  confidence: { fontSize: 11, fontWeight: '700' },
});
