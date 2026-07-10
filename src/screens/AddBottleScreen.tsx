import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, Chip } from '../components';
import { diag } from '../lib/diagnostics';
import { WHISKEY_DB } from '../data/whiskeyDatabase';
import { EstimatedProfile, estimateFlavorProfile } from '../lib/claude';
import {
  defaultProfileFor,
  findWhiskeyByName,
  findWhiskeyCandidates,
  scaleProfileForProof,
} from '../lib/flavor';
import { buildLearnedRecord } from '../lib/library';
import { crossedCollectionThreshold } from '../lib/paywallEngine';
import { useContextualPaywall } from '../useContextualPaywall';
import { RootStackParamList } from '../navigation';
import { newBottleId, useStore } from '../store/useStore';
import { colors } from '../theme';
import { WhiskeyRecord, WhiskeyType } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddBottle'>;

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

export default function AddBottleScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const addBottle = useStore((s) => s.addBottle);
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const learned = useStore((s) => s.learned);
  const learnRecord = useStore((s) => s.learnRecord);
  const track = useStore((s) => s.track);
  const { maybePrompt } = useContextualPaywall();

  const prefillRef = params.refId
    ? [...WHISKEY_DB, ...learned].find((r) => r.id === params.refId)
    : undefined;

  const imageUrl = prefillRef?.imageUrl ?? params.imageUrl;
  const [name, setName] = useState(prefillRef?.name ?? params.name ?? '');
  const [distillery, setDistillery] = useState(prefillRef?.distillery ?? params.brand ?? '');
  const [type, setType] = useState<WhiskeyType>(prefillRef?.type ?? 'bourbon');
  const [proof, setProof] = useState(prefillRef ? String(prefillRef.proof) : '');
  const [notes, setNotes] = useState(prefillRef?.notes ?? '');
  const [opened, setOpened] = useState(params.opened ?? false);
  const [pricePaid, setPricePaid] = useState('');
  const [batch, setBatch] = useState('');
  const [pickName, setPickName] = useState('');
  const [barrelNo, setBarrelNo] = useState('');
  const [estimate, setEstimate] = useState<EstimatedProfile | undefined>();
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  // Live-match the typed name against the reference DB so known bottles pick
  // up professional tasting notes and a real flavor profile automatically.
  // We keep the full ranked list so the user can correct a wrong guess by
  // picking a different candidate ("what else it could be").
  const candidates = useMemo(
    () => (name.trim().length >= 3 ? findWhiskeyCandidates(name, learned) : []),
    [name, learned]
  );
  const dbMatch = prefillRef ?? candidates[0]?.record;
  const matched = !!dbMatch && dbMatch.name === name;
  // Alternate bottlings other than the one currently applied.
  const alternates = candidates.filter((c) => c.record.id !== dbMatch?.id).slice(0, 5);

  const applyMatch = (record: WhiskeyRecord | undefined = dbMatch) => {
    if (!record) return;
    setName(record.name);
    setDistillery(record.distillery);
    setType(record.type);
    setProof(String(record.proof));
    setNotes(record.notes);
    setEstimate(undefined);
  };

  const runEstimate = async () => {
    if (!name.trim() || estimating) return;
    setEstimating(true);
    setEstimateError('');
    try {
      const result = await estimateFlavorProfile(
        apiKey,
        {
          name: name.trim(),
          distillery: distillery.trim() || undefined,
          type,
          proof: parseFloat(proof) || undefined,
        },
        model
      );
      setEstimate(result);
      if (!notes.trim() && result.notes) setNotes(result.notes);
    } catch (err) {
      diag.error('ai-profile', err, name.trim());
      setEstimateError(`Estimation failed: ${(err as Error).message}`);
    } finally {
      setEstimating(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return;
    const enteredProof = parseFloat(proof) || 80;

    let flavor;
    let flavorSource: 'db' | 'ai' | 'default';
    if (matched && dbMatch) {
      // Store picks and batches often run at a different proof than the base
      // bottling — scale the reference profile to the proof on the label.
      flavor = scaleProfileForProof(dbMatch.flavor, dbMatch.proof, enteredProof);
      flavorSource = 'db';
    } else if (estimate) {
      flavor = estimate.flavor;
      flavorSource = 'ai';
    } else {
      flavor = defaultProfileFor(type);
      flavorSource = 'default';
    }

    addBottle({
      id: newBottleId(),
      name: name.trim(),
      distillery: distillery.trim() || 'Unknown',
      type,
      proof: enteredProof,
      barcode: params.barcode,
      refId: matched ? dbMatch?.id : undefined,
      imageUrl: dbMatch?.imageUrl ?? imageUrl,
      flavor,
      flavorSource,
      notes: notes.trim() || (matched ? (dbMatch?.notes ?? '') : (estimate?.notes ?? '')),
      batch: batch.trim() || undefined,
      pickName: pickName.trim() || undefined,
      barrelNo: barrelNo.trim() || undefined,
      pricePaid: pricePaid.trim() ? parseFloat(pricePaid) || undefined : undefined,
      rarity: matched ? dbMatch?.rarity : estimate?.rarity,
      msrp: matched ? dbMatch?.msrp : estimate?.msrp,
      secondary: matched ? dbMatch?.secondary : estimate?.secondary,
      opened,
      quantity: 1,
      addedAt: Date.now(),
    });
    track('bottle_added', {
      type,
      rarity: (matched ? dbMatch?.rarity : estimate?.rarity) ?? 'C',
      flavorSource,
      matched,
    });

    // Self-improving library: a manual add of an unknown bottle teaches the
    // library, so it's searchable/matchable next time (with its barcode).
    if (!matched) {
      // No API key passed — we reuse the estimate we already have (below)
      // instead of re-calling the API.
      const record = await buildLearnedRecord({
        name: name.trim(),
        brand: distillery.trim() || undefined,
        type,
        proof: enteredProof,
        barcode: params.barcode,
      });
      if (estimate) {
        record.flavor = estimate.flavor;
        record.notes = estimate.notes || record.notes;
        if (estimate.rarity) record.rarity = estimate.rarity;
        if (estimate.msrp !== undefined) record.msrp = estimate.msrp;
        if (estimate.secondary !== undefined) record.secondary = estimate.secondary;
      }
      learnRecord(record);
    } else if (matched && dbMatch && params.barcode && !dbMatch.barcodes?.includes(params.barcode)) {
      // Learn new barcode → known bottling mappings too.
      learnRecord({
        ...dbMatch,
        id: dbMatch.learned ? dbMatch.id : `learned-${dbMatch.id}`,
        barcodes: [...new Set([...(dbMatch.barcodes ?? []), params.barcode])],
        learned: true,
      });
    }

    // Investment moment: crossing 5/15/40 bottles is when a collector feels the
    // vault is worth protecting. If the frequency-capped engine agrees, show Pro
    // instead of just dismissing; otherwise return as usual.
    const after = useStore.getState().bottles.length;
    if (crossedCollectionThreshold(after - 1, after) && maybePrompt('collection-grew')) return;
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {params.barcode && <Text style={styles.barcode}>Scanned barcode: {params.barcode}</Text>}

        {imageUrl && (
          <View style={styles.refImageWrap}>
            <Image source={{ uri: imageUrl }} style={styles.refImage} resizeMode="contain" />
            <Text style={styles.refImageCaption}>
              Reference photo — compare it to your bottle before saving.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setEstimate(undefined);
          }}
          placeholder="e.g. Eagle Rare 10 Year"
          placeholderTextColor={colors.textDim}
        />

        {dbMatch && !matched && (
          <TouchableOpacity style={styles.matchBanner} onPress={() => applyMatch()}>
            <Text style={styles.matchText}>
              Best match: {dbMatch.name} — tap to use its tasting profile
            </Text>
          </TouchableOpacity>
        )}

        {matched && (
          <Text style={styles.sourceNote}>
            ✓ Matched to reference database{' '}
            {proof && parseFloat(proof) !== dbMatch?.proof
              ? '(profile will be scaled to your proof)'
              : ''}
          </Text>
        )}

        {alternates.length > 0 && (
          <View style={styles.alternatesBox}>
            <Text style={styles.alternatesTitle}>Not the right bottle? Pick the correct one:</Text>
            {alternates.map((c) => (
              <TouchableOpacity
                key={c.record.id}
                style={styles.alternateRow}
                onPress={() => applyMatch(c.record)}
              >
                <Text style={styles.alternateName}>{c.record.name}</Text>
                <Text style={styles.alternateMeta}>
                  {c.record.distillery} · {c.record.proof} proof
                  {c.record.rarity ? ` · ${c.record.rarity}-tier` : ''}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.alternatesHint}>
              …or just edit the fields below — anything you type is saved as-is.
            </Text>
          </View>
        )}

        {!dbMatch && name.trim().length >= 4 && (
          <View style={styles.estimateBox}>
            <Text style={styles.estimateTitle}>Not in the reference database</Text>
            {estimate ? (
              <Text style={styles.sourceNote}>
                {estimate.known
                  ? '✨ AI profile ready — Claude recognized this bottling.'
                  : '✨ AI estimate ready — Claude estimated from style (it didn\'t know this exact bottle).'}
              </Text>
            ) : apiKey ? (
              <>
                <Text style={styles.estimateText}>
                  Ask the AI sommelier to build its flavor profile from professional reviews, or
                  save with a style-typical profile.
                </Text>
                <Button
                  title={estimating ? 'Estimating…' : '✨ Estimate profile with AI'}
                  variant="secondary"
                  onPress={runEstimate}
                  disabled={estimating}
                  style={{ marginTop: 10 }}
                />
                {estimating && <ActivityIndicator color={colors.amber} style={{ marginTop: 8 }} />}
                {!!estimateError && <Text style={styles.errorText}>{estimateError}</Text>}
              </>
            ) : (
              <Text style={styles.estimateText}>
                It will get a style-typical profile — you can fine-tune it on the bottle page, or
                add an API key in Settings to enable AI profiling.
              </Text>
            )}
          </View>
        )}

        <Text style={styles.label}>Distillery</Text>
        <TextInput
          style={styles.input}
          value={distillery}
          onChangeText={setDistillery}
          placeholder="e.g. Buffalo Trace"
          placeholderTextColor={colors.textDim}
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />
          ))}
        </View>

        <Text style={styles.label}>
          Status{params.opened !== undefined ? ' (AI guessed from the photo — confirm)' : ''}
        </Text>
        <View style={styles.typeRow}>
          <Chip label="Sealed" active={!opened} onPress={() => setOpened(false)} />
          <Chip label="Opened" active={opened} onPress={() => setOpened(true)} />
        </View>

        <Text style={styles.label}>Proof</Text>
        <TextInput
          style={styles.input}
          value={proof}
          onChangeText={setProof}
          keyboardType="decimal-pad"
          placeholder="e.g. 90 — use the proof on YOUR label for picks/batches"
          placeholderTextColor={colors.textDim}
        />

        <Text style={styles.label}>Price you paid (optional)</Text>
        <TextInput
          style={styles.input}
          value={pricePaid}
          onChangeText={setPricePaid}
          keyboardType="decimal-pad"
          placeholder="e.g. 64.99 — used for gain/loss, never for trade value"
          placeholderTextColor={colors.textDim}
        />

        <Text style={styles.section}>Batch / store pick (optional)</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Batch</Text>
            <TextInput
              style={styles.input}
              value={batch}
              onChangeText={setBatch}
              placeholder="C923"
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Barrel #</Text>
            <TextInput
              style={styles.input}
              value={barrelNo}
              onChangeText={setBarrelNo}
              placeholder="1234"
              placeholderTextColor={colors.textDim}
            />
          </View>
        </View>
        <Text style={styles.label}>Picked by</Text>
        <TextInput
          style={styles.input}
          value={pickName}
          onChangeText={setPickName}
          placeholder="e.g. Total Wine, r/bourbon, your whiskey club"
          placeholderTextColor={colors.textDim}
        />

        <Text style={styles.label}>Tasting notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Auto-filled for known bottles, or write your own"
          placeholderTextColor={colors.textDim}
        />

        <Button
          title="Add to my bar"
          icon="add-circle"
          onPress={save}
          disabled={!name.trim()}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  barcode: { color: colors.textDim, marginBottom: 12, fontSize: 13 },
  refImageWrap: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  refImage: { width: 120, height: 160, borderRadius: 8, backgroundColor: colors.bgElevated },
  refImageCaption: { color: colors.textDim, fontSize: 12, marginTop: 8, textAlign: 'center' },
  label: { color: colors.amberBright, marginTop: 14, marginBottom: 6, fontWeight: '600' },
  section: {
    color: colors.text,
    marginTop: 22,
    fontWeight: '800',
    fontSize: 15,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  matchBanner: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.amber,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  matchText: { color: colors.amberBright, fontSize: 13 },
  sourceNote: { color: colors.success, fontSize: 13, marginTop: 8 },
  alternatesBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alternatesTitle: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  alternateRow: {
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  alternateName: { color: colors.amberBright, fontSize: 14, fontWeight: '600' },
  alternateMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  alternatesHint: { color: colors.textDim, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  estimateBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  estimateTitle: { color: colors.text, fontWeight: '700' },
  estimateText: { color: colors.textDim, fontSize: 13, marginTop: 6, lineHeight: 18 },
  errorText: { color: colors.danger, fontSize: 13, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  typeChipText: { color: colors.textDim, fontSize: 13 },
  typeChipTextActive: { color: '#1a120b', fontWeight: '700' },
});
