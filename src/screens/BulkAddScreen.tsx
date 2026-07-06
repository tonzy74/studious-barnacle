import { Ionicons } from '@expo/vector-icons';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, Chip, RarityBadge, ScreenGradient, TypeBadge } from '../components';
import { IdentifiedBottle, identifyBottlesFromPhoto } from '../lib/claude';
import { applyCorrections, correctionKey } from '../lib/corrections';
import { diag } from '../lib/diagnostics';
import { findWhiskeyByName, scaleProfileForProof } from '../lib/flavor';
import { cropBottle } from '../lib/images';
import { buildLearnedRecord } from '../lib/library';
import { useProGate } from '../useProGate';
import { RootStackParamList } from '../navigation';
import { newBottleId, useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';
import { WhiskeyRecord, WhiskeyType } from '../types';

const TYPES: WhiskeyType[] = [
  'bourbon',
  'rye',
  'tennessee',
  'scotch',
  'irish',
  'japanese',
  'canadian',
  'other',
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ReviewItem {
  /** What the AI read (after auto-corrections) — kept to learn from edits. */
  original: IdentifiedBottle;
  /** Current identity, editable by the user. */
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
  const corrections = useStore((s) => s.corrections);
  const addBottle = useStore((s) => s.addBottle);
  const learnRecord = useStore((s) => s.learnRecord);
  const recordCorrection = useStore((s) => s.recordCorrection);
  const track = useStore((s) => s.track);

  const { requirePro } = useProGate('ai-bulk-add');
  const [busy, setBusy] = useState<'idle' | 'analyzing' | 'adding'>('idle');
  const [items, setItems] = useState<ReviewItem[] | undefined>();
  // The source shelf photo, kept so we can crop each bottle out on add.
  const [photo, setPhoto] = useState<{ uri: string; w: number; h: number } | undefined>();
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const analyze = async (fromCamera: boolean) => {
    if (requirePro()) return;
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
    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;
    // Remember the full shot so we can crop each identified bottle out of it.
    setPhoto({ uri: asset.uri, w: asset.width, h: asset.height });

    setBusy('analyzing');
    try {
      const identified = await identifyBottlesFromPhoto(
        apiKey,
        asset.base64,
        asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
        model
      );
      diag.info('bulk-add', `identified ${identified.length} bottles (model ${model})`);
      if (identified.length === 0) {
        setError('No whiskey bottles identified — try a closer shot with labels facing the camera.');
        setItems(undefined);
      } else {
        // Self-improvement: auto-apply the user's past corrections before
        // showing results, so we stop repeating known misreads.
        const corrected = applyCorrections(identified, corrections);
        setItems(
          corrected.map((b) => ({
            original: b,
            identified: b,
            match: findWhiskeyByName(`${b.name} ${b.distillery}`, learned),
            // Low-confidence reads start unchecked so a blurry guess
            // doesn't slip into the collection unnoticed.
            selected: b.confidence !== 'low',
          }))
        );
      }
    } catch (err) {
      diag.error('bulk-add', err, `model ${model}`);
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

  /** Apply a user edit to an item and re-match it against the library. */
  const updateItem = (index: number, patch: Partial<IdentifiedBottle>) =>
    setItems((prev) =>
      prev?.map((it, i) => {
        if (i !== index) return it;
        const identified = { ...it.identified, ...patch };
        return {
          ...it,
          identified,
          match: findWhiskeyByName(`${identified.name} ${identified.distillery}`, learned),
          // A user edit is a verified read.
          selected: true,
        };
      })
    );

  const addSelected = async () => {
    if (!items) return;
    const chosen = items.filter((i) => i.selected);
    setBusy('adding');
    let matchedCount = 0;
    for (const item of chosen) {
      const { identified, match, original } = item;
      // Self-improvement: if the user changed the AI's read, remember the fix
      // so the same misread is auto-corrected next time.
      if (
        correctionKey(original.name, original.distillery) !==
        correctionKey(identified.name, identified.distillery)
      ) {
        recordCorrection(
          { name: original.name, distillery: original.distillery },
          {
            name: identified.name,
            distillery: identified.distillery,
            type: identified.type,
            proof: identified.proof,
          }
        );
      }
      const proof = identified.proof ?? match?.proof ?? 80;
      const id = newBottleId();
      // Trim this bottle out of the shelf photo and save it to the entry.
      const imageUrl = photo
        ? await cropBottle(id, photo.uri, photo.w, photo.h, identified.box)
        : undefined;
      if (match) {
        matchedCount++;
        addBottle({
          id,
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
          opened: identified.opened ?? false,
          quantity: 1,
          imageUrl,
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
          id,
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
          opened: identified.opened ?? false,
          quantity: 1,
          imageUrl,
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
    <ScreenGradient>
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
            title="Photograph my shelf"
            icon="camera"
            onPress={() => analyze(true)}
            disabled={busy !== 'idle'}
            style={{ marginTop: 20 }}
          />
          <Button
            title="Choose from photo library"
            icon="images"
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
            Tap to include/exclude, or ✎ to fix a wrong read — any bottle, regardless of
            confidence. Your fixes are remembered and auto-applied next time.
          </Text>

          {items.map((item, index) => (
            <View
              key={`${index}`}
              style={[styles.card, item.selected && styles.cardSelected]}
            >
              <View style={styles.cardRow}>
                <TouchableOpacity onPress={() => toggle(index)}>
                  <Ionicons
                    name={item.selected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.selected ? colors.amberBright : colors.textFaint}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, marginHorizontal: 8 }}
                  onPress={() => toggle(index)}
                >
                  <Text style={styles.name}>{item.match?.name ?? item.identified.name}</Text>
                  <Text style={styles.sub}>
                    {item.match
                      ? `✓ Matched: ${item.match.distillery}`
                      : item.identified.distillery || 'Unknown distillery'}
                    {item.identified.proof ? ` · ${item.identified.proof} proof` : ''}
                  </Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                  onPress={() => setEditing(editing === index ? null : index)}
                  style={styles.editBtn}
                >
                  <Ionicons
                    name={editing === index ? 'checkmark' : 'pencil'}
                    size={16}
                    color={colors.amberBright}
                  />
                </TouchableOpacity>
              </View>

              {editing === index && (
                <View style={styles.editPanel}>
                  <Text style={styles.editLabel}>Name</Text>
                  <TextInput
                    style={styles.editInput}
                    defaultValue={item.identified.name}
                    onEndEditing={(e) => updateItem(index, { name: e.nativeEvent.text.trim() })}
                    placeholder="Bottle name"
                    placeholderTextColor={colors.textFaint}
                  />
                  <Text style={styles.editLabel}>Distillery</Text>
                  <TextInput
                    style={styles.editInput}
                    defaultValue={item.identified.distillery}
                    onEndEditing={(e) => updateItem(index, { distillery: e.nativeEvent.text.trim() })}
                    placeholder="Distillery"
                    placeholderTextColor={colors.textFaint}
                  />
                  <Text style={styles.editLabel}>Proof</Text>
                  <TextInput
                    style={styles.editInput}
                    defaultValue={item.identified.proof ? String(item.identified.proof) : ''}
                    keyboardType="decimal-pad"
                    onEndEditing={(e) => {
                      const v = parseFloat(e.nativeEvent.text);
                      updateItem(index, { proof: Number.isFinite(v) ? v : undefined });
                    }}
                    placeholder="e.g. 100"
                    placeholderTextColor={colors.textFaint}
                  />
                  <Text style={styles.editLabel}>Type</Text>
                  <View style={styles.typeRow}>
                    {TYPES.map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        active={item.identified.type === t}
                        onPress={() => updateItem(index, { type: t })}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}

          <Button
            title={
              busy === 'adding'
                ? 'Adding…'
                : `Add ${items.filter((i) => i.selected).length} bottles to my bar`
            }
            icon="add-circle"
            onPress={addSelected}
            disabled={busy !== 'idle' || items.every((i) => !i.selected)}
            style={{ marginTop: 16 }}
          />
          <Button
            title="Scan a different photo"
            icon="refresh"
            variant="secondary"
            onPress={() => {
              setItems(undefined);
              setPhoto(undefined);
            }}
            disabled={busy !== 'idle'}
            style={{ marginTop: 10 }}
          />
        </>
      )}
    </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
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
  editBtn: {
    marginLeft: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPanel: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  editLabel: { color: colors.amberBright, fontSize: 12, fontWeight: '600', marginTop: 6 },
  editInput: {
    backgroundColor: colors.bgElevated,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});
