import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useReducer } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ScreenGradient, ScreenHeader } from '../components';
import { clearLog, formatLog, getLog, subscribe, DiagLevel } from '../lib/diagnostics';
import { colors, radius, spacing } from '../theme';

const LEVEL_COLOR: Record<DiagLevel, string> = {
  info: colors.textDim,
  warn: colors.amber,
  error: colors.danger,
};

export default function DiagnosticsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [, force] = useReducer((n) => n + 1, 0);

  useEffect(() => subscribe(force), []);

  const entries = getLog();

  return (
    <ScreenGradient>
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.md }}>
        <ScreenHeader
          eyebrow="UNDER THE HOOD"
          title="Diagnostics"
          subtitle="A live log of scans and AI calls. Hit a bug? Share this so it can be traced."
          onBack={() => navigation.goBack()}
        />

        <View style={styles.actions}>
          <Button
            title="Share log"
            icon="share-outline"
            onPress={() => Share.share({ message: formatLog() })}
            style={{ flex: 1 }}
          />
          <Button
            title="Clear"
            icon="trash-outline"
            variant="secondary"
            onPress={() => clearLog()}
            style={{ flex: 1 }}
          />
        </View>

        {entries.length === 0 ? (
          <Text style={styles.empty}>No activity logged yet. Scan a bottle or use an AI feature.</Text>
        ) : (
          <ScrollView
            style={styles.log}
            contentContainerStyle={{ padding: spacing.md }}
            showsVerticalScrollIndicator={false}
          >
            {entries.map((e, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.time}>{new Date(e.at).toLocaleTimeString()}</Text>
                <Text style={[styles.tag, { color: LEVEL_COLOR[e.level] }]}>[{e.tag}]</Text>
                <Text style={[styles.msg, e.level === 'error' && { color: colors.danger }]}>
                  {e.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  empty: { color: colors.textDim, marginTop: spacing.xl, textAlign: 'center' },
  log: {
    flex: 1,
    marginBottom: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
  time: { color: colors.textFaint, fontSize: 11, fontVariant: ['tabular-nums'] },
  tag: { fontSize: 11, fontWeight: '700' },
  msg: { color: colors.text, fontSize: 12, flex: 1, minWidth: '60%' },
});
