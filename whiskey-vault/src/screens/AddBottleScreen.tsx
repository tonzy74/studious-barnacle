import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '../components';
import { WHISKEY_DB } from '../data/whiskeyDatabase';
import { defaultProfileFor, findWhiskeyByName } from '../lib/flavor';
import { RootStackParamList } from '../navigation';
import { newBottleId, useStore } from '../store/useStore';
import { colors } from '../theme';
import { WhiskeyType } from '../types';

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

  const prefillRef = params.refId ? WHISKEY_DB.find((r) => r.id === params.refId) : undefined;

  const [name, setName] = useState(prefillRef?.name ?? params.name ?? '');
  const [distillery, setDistillery] = useState(prefillRef?.distillery ?? params.brand ?? '');
  const [type, setType] = useState<WhiskeyType>(prefillRef?.type ?? 'bourbon');
  const [proof, setProof] = useState(prefillRef ? String(prefillRef.proof) : '');
  const [notes, setNotes] = useState(prefillRef?.notes ?? '');

  // Live-match the typed name against the reference DB so known bottles pick
  // up professional tasting notes and a real flavor profile automatically.
  const dbMatch = useMemo(() => (prefillRef ? prefillRef : findWhiskeyByName(name)), [name, prefillRef]);

  const applyMatch = () => {
    if (!dbMatch) return;
    setName(dbMatch.name);
    setDistillery(dbMatch.distillery);
    setType(dbMatch.type);
    setProof(String(dbMatch.proof));
    setNotes(dbMatch.notes);
  };

  const save = () => {
    if (!name.trim()) return;
    const matched = dbMatch && dbMatch.name === name ? dbMatch : undefined;
    addBottle({
      id: newBottleId(),
      name: name.trim(),
      distillery: distillery.trim() || 'Unknown',
      type,
      proof: parseFloat(proof) || 80,
      barcode: params.barcode,
      refId: matched?.id,
      flavor: matched ? { ...matched.flavor } : defaultProfileFor(type),
      notes: notes.trim() || (matched?.notes ?? ''),
      opened: false,
      quantity: 1,
      addedAt: Date.now(),
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {params.barcode && (
          <Text style={styles.barcode}>Scanned barcode: {params.barcode}</Text>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Eagle Rare 10 Year"
          placeholderTextColor={colors.textDim}
        />

        {dbMatch && dbMatch.name !== name && (
          <TouchableOpacity style={styles.matchBanner} onPress={applyMatch}>
            <Text style={styles.matchText}>
              Found in database: {dbMatch.name} — tap to use its tasting profile
            </Text>
          </TouchableOpacity>
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
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Proof</Text>
        <TextInput
          style={styles.input}
          value={proof}
          onChangeText={setProof}
          keyboardType="decimal-pad"
          placeholder="e.g. 90"
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

        <Button title="Add to my bar" onPress={save} disabled={!name.trim()} style={{ marginTop: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  barcode: { color: colors.textDim, marginBottom: 12, fontSize: 13 },
  label: { color: colors.amberBright, marginTop: 14, marginBottom: 6, fontWeight: '600' },
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
