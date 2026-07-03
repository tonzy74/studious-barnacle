import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '../components';
import { useStore } from '../store/useStore';
import { colors } from '../theme';

export default function SettingsScreen() {
  const apiKey = useStore((s) => s.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);
  const [draft, setDraft] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiKey(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Anthropic API key</Text>
      <Text style={styles.help}>
        Powers the AI Sommelier pairing chat. Create a key at console.anthropic.com — it's stored
        only on this device and sent only to Anthropic's API.
      </Text>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="sk-ant-…"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <Button title={saved ? 'Saved ✓' : 'Save'} onPress={save} style={{ marginTop: 16 }} />

      <Text style={[styles.help, { marginTop: 32 }]}>
        Whiskey Vault v1.0 — inventory, random pours, AI pairing, and guest matching. Flavor
        profiles are aggregated from the common language of professional reviews.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.amberBright, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  help: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
});
