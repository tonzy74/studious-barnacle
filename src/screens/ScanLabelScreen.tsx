import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, RarityBadge, ScreenGradient, ScreenHeader, TypeBadge, TypeIcon } from '../components';
import { identifyBottlesFromPhoto } from '../lib/claude';
import { applyCorrections } from '../lib/corrections';
import { diag } from '../lib/diagnostics';
import { findWhiskeyByName } from '../lib/flavor';
import { fairPrice, formatUsd } from '../lib/pricing';
import { RARITY_LABELS } from '../lib/rarity';
import { useProGate } from '../useProGate';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, spacing, type as typo } from '../theme';
import { WhiskeyRecord } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Result {
  name: string;
  distillery: string;
  record?: WhiskeyRecord;
  owned: boolean;
  opened?: boolean;
}

export default function ScanLabelScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const learned = useStore((s) => s.learned);
  const bottles = useStore((s) => s.bottles);
  const corrections = useStore((s) => s.corrections);
  const addWishlist = useStore((s) => s.addWishlist);
  const { requirePro } = useProGate('ai-label-scan');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | undefined>();

  const scan = async (fromCamera: boolean) => {
    if (requirePro()) return;
    setError('');
    setResult(undefined);
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return setError('Camera access is needed.');
    }
    const picker = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const shot = await picker({ mediaTypes: ['images'], quality: 0.5, base64: true });
    if (shot.canceled || !shot.assets[0]?.base64) return;

    setBusy(true);
    try {
      const identified = applyCorrections(
        await identifyBottlesFromPhoto(
          apiKey,
          shot.assets[0].base64,
          shot.assets[0].mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
          model
        ),
        corrections
      );
      if (identified.length === 0) {
        setError('Could not read a bottle — try a straight-on shot of the label.');
      } else {
        const top = identified[0];
        const record = findWhiskeyByName(`${top.name} ${top.distillery}`, learned);
        const owned = bottles.some(
          (b) => b.name.toLowerCase().replace(/[^a-z0-9]+/g, '') === top.name.toLowerCase().replace(/[^a-z0-9]+/g, '')
        );
        diag.info('label-scan', `${top.name} → ${record ? 'matched ' + record.name : 'no db match'}`);
        setResult({ name: top.name, distillery: top.distillery, record, owned, opened: top.opened });
      }
    } catch (err) {
      diag.error('label-scan', err, `model ${model}`);
      setError(`Scan failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const price = result?.record
    ? fairPrice(result.record.msrp, result.record.secondary, result.record.rarity)
    : undefined;

  return (
    <ScreenGradient>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="IN-STORE MODE"
          title="Scan a Label"
          subtitle="Point at a bottle to identify it and see its value, rarity, and whether you already own it — no barcode needed."
          onBack={() => navigation.goBack()}
        />

        {!apiKey && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.note}>Label scanning uses AI — add your API key in Settings first.</Text>
            <Button title="Open Settings" icon="settings-outline" variant="secondary" onPress={() => navigation.navigate('Settings')} style={{ marginTop: spacing.md }} />
          </Card>
        )}

        {apiKey && (
          <View style={styles.actions}>
            <Button title="Photograph a label" icon="camera" onPress={() => scan(true)} disabled={busy} style={{ flex: 1 }} />
            <Button title="From library" icon="images" variant="secondary" onPress={() => scan(false)} disabled={busy} style={{ flex: 1 }} />
          </View>
        )}

        {busy && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.amber} size="large" />
            <Text style={styles.note}>Reading the label…</Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        {result && (
          <Card style={{ marginTop: spacing.lg }} glow>
            <View style={styles.resultTop}>
              <TypeIcon type={result.record?.type ?? 'other'} size={48} />
              <View style={styles.badges}>
                {result.record && <TypeBadge type={result.record.type} />}
                <RarityBadge rarity={result.record?.rarity} size={30} />
              </View>
            </View>
            <Text style={styles.name}>{result.record?.name ?? result.name}</Text>
            <Text style={styles.sub}>{result.record?.distillery ?? result.distillery}</Text>

            {result.owned && (
              <View style={styles.ownedTag}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.ownedText}>Already in your bar</Text>
              </View>
            )}

            {result.opened !== undefined && (
              <View style={styles.ownedTag}>
                <Ionicons
                  name={result.opened ? 'ellipse-outline' : 'lock-closed'}
                  size={15}
                  color={colors.textDim}
                />
                <Text style={styles.openText}>
                  Looks {result.opened ? 'opened' : 'sealed'} (AI guess — confirm when adding)
                </Text>
              </View>
            )}

            <View style={styles.valueRow}>
              <View>
                <Text style={styles.valueLabel}>Fair price</Text>
                <Text style={styles.valueBig}>{price !== undefined ? formatUsd(price) : '—'}</Text>
              </View>
              {result.record?.rarity && (
                <View style={{ flex: 1, marginLeft: spacing.lg }}>
                  <Text style={styles.valueLabel}>Rarity</Text>
                  <Text style={styles.rarityText}>{RARITY_LABELS[result.record.rarity]}</Text>
                </View>
              )}
            </View>

            <Button
              title="Add to my bar"
              icon="add-circle"
              onPress={() =>
                navigation.navigate('AddBottle', {
                  name: result.record?.name ?? result.name,
                  brand: result.record?.distillery ?? result.distillery,
                  refId: result.record?.id,
                  opened: result.opened,
                })
              }
              style={{ marginTop: spacing.lg }}
            />
            <Button
              title="Add to hunt list"
              icon="heart-outline"
              variant="secondary"
              onPress={() => {
                addWishlist({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  name: result.record?.name ?? result.name,
                  distillery: result.record?.distillery ?? result.distillery,
                  watchRelease: true,
                  addedAt: Date.now(),
                });
                navigation.goBack();
              }}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  center: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  note: { color: colors.textDim, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  error: { color: colors.danger, marginTop: spacing.md, lineHeight: 19 },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typo.title, color: colors.text, marginTop: spacing.md },
  sub: { color: colors.amberBright, marginTop: 4, fontSize: 14 },
  ownedTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  ownedText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  openText: { color: colors.textDim, fontSize: 12 },
  valueRow: { flexDirection: 'row', marginTop: spacing.lg },
  valueLabel: { color: colors.textDim, fontSize: 12 },
  valueBig: { color: colors.amberBright, fontSize: 24, fontWeight: '800', marginTop: 2 },
  rarityText: { color: colors.text, fontSize: 13, marginTop: 4, lineHeight: 18 },
});
