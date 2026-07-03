import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components';
import { resolveBarcodeAndLearn } from '../lib/library';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors } from '../theme';

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
      onLearn: learnRecord,
    });
    setBusy(false);
    navigation.navigate('AddBottle', {
      barcode: code,
      name: resolved.record?.name ?? resolved.name,
      brand: resolved.record?.distillery ?? resolved.brand,
      refId: resolved.record?.id,
    });
    // Allow re-scanning the same code after returning to this screen.
    setTimeout(() => {
      lastScanned.current = '';
    }, 3000);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.text}>
          Whiskey Vault needs the camera to scan bottle barcodes into your inventory.
        </Text>
        <Button title="Grant camera access" onPress={requestPermission} style={{ marginTop: 20 }} />
        <Button
          title="Add manually instead"
          variant="secondary"
          onPress={() => navigation.navigate('AddBottle', {})}
          style={{ marginTop: 10 }}
        />
      </View>
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
        <Text style={styles.hint}>Point at the barcode on a bottle</Text>
        <View style={styles.frame} />
        {busy && (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.amber} />
            <Text style={styles.text}> Looking up bottle…</Text>
          </View>
        )}
        <Button
          title="Add manually instead"
          variant="secondary"
          onPress={() => navigation.navigate('AddBottle', {})}
          style={{ marginTop: 'auto', marginBottom: 24 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlay: { flex: 1, alignItems: 'center', padding: 24 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  text: { color: colors.text, textAlign: 'center', marginTop: 8 },
  hint: { color: colors.text, fontSize: 16, marginTop: 40, fontWeight: '600' },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: colors.amber,
    borderRadius: 16,
    marginTop: 24,
  },
  busyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
});
