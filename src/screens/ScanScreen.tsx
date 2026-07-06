import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenGradient } from '../components';
import { diag } from '../lib/diagnostics';
import { resolveBarcodeAndLearn } from '../lib/library';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, radius, spacing, type as typo } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const lastScanned = useRef<string>('');
  const learned = useStore((s) => s.learned);
  const learnRecord = useStore((s) => s.learnRecord);
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const track = useStore((s) => s.track);

  const onScan = async (result: BarcodeScanningResult) => {
    const code = result.data;
    if (busy || !code || code === lastScanned.current) return;
    lastScanned.current = code;
    setBusy(true);
    // Resolves through built-in DB → learned library → live lookup + AI
    // profiling, teaching the library as it goes.
    const resolved = await resolveBarcodeAndLearn(code, {
      learned,
      apiKey: apiKey || undefined,
      model,
      onLearn: learnRecord,
    });
    setBusy(false);
    const resolvedName = resolved.record?.name ?? resolved.name;
    diag.info('scan', `${code} → ${resolved.source}: ${resolvedName ?? '(no name)'}`);
    track('scan_resolved', { source: resolved.source });

    // Whiskey barcodes often aren't in any public database. Rather than dump
    // the user into a blank form, offer the reliable path: scan the label.
    if (!resolvedName) {
      Alert.alert(
        'Barcode not found',
        "That UPC isn't in the public databases (common for whiskey). Scan the label instead — the AI will read it — or enter it by hand.",
        [
          { text: 'Scan the label', onPress: () => navigation.navigate('ScanLabel') },
          {
            text: 'Enter manually',
            onPress: () => navigation.navigate('AddBottle', { barcode: code }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      setTimeout(() => {
        lastScanned.current = '';
      }, 1500);
      return;
    }

    navigation.navigate('AddBottle', {
      barcode: code,
      name: resolvedName,
      brand: resolved.record?.distillery ?? resolved.brand,
      refId: resolved.record?.id,
      imageUrl: resolved.record?.imageUrl ?? resolved.imageUrl,
    });
    // Allow re-scanning the same code after returning to this screen.
    setTimeout(() => {
      lastScanned.current = '';
    }, 3000);
  };

  if (!permission) {
    return <ScreenGradient />;
  }

  if (!permission.granted) {
    return (
      <ScreenGradient>
        <View style={[styles.container, styles.center]}>
          <View style={styles.permGlyph}>
            <Ionicons name="scan" size={44} color={colors.amber} />
          </View>
          <Text style={styles.title}>Camera access needed</Text>
          <Text style={styles.text}>
            Whiskey Vault needs the camera to scan bottle barcodes into your inventory.
          </Text>
          <Button
            title="Grant camera access"
            icon="camera"
            onPress={requestPermission}
            style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
          />
          <Button
            title="Add manually instead"
            icon="add"
            variant="secondary"
            onPress={() => navigation.navigate('AddBottle', {})}
            style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
          />
        </View>
      </ScreenGradient>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{
            barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128'],
          }}
          onBarcodeScanned={onScan}
        />
      )}
      <View style={styles.overlay}>
        <View style={styles.hintPill}>
          <Ionicons name="barcode-outline" size={16} color={colors.amberBright} />
          <Text style={styles.hint}>Point at the barcode on a bottle</Text>
        </View>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        {busy && (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.amber} />
            <Text style={styles.text}> Looking up bottle…</Text>
          </View>
        )}
        <Button
          title="Add manually instead"
          icon="add"
          variant="secondary"
          onPress={() => navigation.navigate('AddBottle', {})}
          style={{ marginTop: 'auto', marginBottom: spacing.xl }}
        />
      </View>
    </View>
  );
}

const CORNER = 30;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  permGlyph: {
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
  overlay: { flex: 1, alignItems: 'center', padding: spacing.xl },
  title: { ...typo.title, color: colors.text },
  text: { color: colors.text, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20,13,7,0.7)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { color: colors.text, fontSize: 14, fontWeight: '600' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.amberBright },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  frame: {
    width: 260,
    height: 160,
    marginTop: spacing.xl,
  },
  busyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
});
