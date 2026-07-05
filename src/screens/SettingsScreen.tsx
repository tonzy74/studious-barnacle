import * as TrackingTransparency from 'expo-tracking-transparency';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, ScreenGradient } from '../components';
import { appleSignInAvailable, signInWithApple, signOut } from '../lib/auth';
import { CLAUDE_MODELS } from '../lib/models';
import { useStore } from '../store/useStore';
import { colors } from '../theme';

export default function SettingsScreen() {
  const apiKey = useStore((s) => s.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);
  const model = useStore((s) => s.model);
  const setModel = useStore((s) => s.setModel);
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const consent = useStore((s) => s.consent);
  const setConsent = useStore((s) => s.setConsent);
  const bottles = useStore((s) => s.bottles);
  const learned = useStore((s) => s.learned);
  const events = useStore((s) => s.events);
  const track = useStore((s) => s.track);
  const clearAllData = useStore((s) => s.clearAllData);

  const [draft, setDraft] = useState(apiKey);
  const [saved, setSaved] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    appleSignInAvailable().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    setDraft(apiKey);
  }, [apiKey]);

  const saveKey = () => {
    setApiKey(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignIn = async () => {
    try {
      const p = await signInWithApple();
      setProfile(p);
      track('sign_in', { provider: 'apple' });
    } catch (err) {
      if ((err as { code?: string }).code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-in failed', (err as Error).message);
      }
    }
  };

  const handleSignOut = async () => {
    track('sign_out', { provider: profile?.provider ?? 'apple' });
    await signOut();
    setProfile(null);
  };

  const toggleSellShare = async (value: boolean) => {
    if (!value) {
      setConsent({ sellShare: false });
      return;
    }
    // Selling/sharing data requires the iOS App Tracking Transparency prompt
    // to be granted — both gates must pass, per Apple policy and the
    // CCPA/GDPR consent model.
    const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
    if (status === 'granted') {
      setConsent({ sellShare: true });
    } else {
      setConsent({ sellShare: false });
      Alert.alert(
        'Tracking not authorized',
        'iOS tracking permission was declined, so data sharing stays off. You can change this in iOS Settings > Privacy > Tracking.'
      );
    }
  };

  const exportData = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      consent,
      bottles,
      learnedLibrary: learned,
      analyticsEvents: events,
    };
    await Share.share({
      message: JSON.stringify(payload, null, 2),
      title: 'Whiskey Vault data export',
    });
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Delete all data',
      'This permanently removes your collection, learned library, sign-in, analytics events, and API key from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            setDraft('');
          },
        },
      ]
    );
  };

  return (
    <ScreenGradient>
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.section}>Account</Text>
      {profile ? (
        <>
          <Text style={styles.body}>
            Signed in with {profile.provider === 'apple' ? 'Apple' : 'Google'}
            {profile.name ? ` as ${profile.name}` : ''}
            {profile.email ? ` (${profile.email})` : ''}
          </Text>
          <Button
            title="Sign out"
            variant="secondary"
            onPress={handleSignOut}
            style={{ marginTop: 10 }}
          />
        </>
      ) : appleAvailable ? (
        <>
          <Text style={styles.help}>
            Sign in to prepare your collection for cross-device sync (coming soon). Your data
            stays on this device until sync ships.
          </Text>
          <Button title=" Sign in with Apple" onPress={handleSignIn} style={{ marginTop: 10 }} />
        </>
      ) : (
        <Text style={styles.help}>Sign in with Apple is available on iOS devices.</Text>
      )}

      <Text style={styles.section}>AI Sommelier</Text>
      <Text style={styles.help}>
        Powers pairing chat and AI bottle profiling. Create a key at console.anthropic.com — it's
        stored in your device's secure Keychain and sent only to Anthropic's API.
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
      <Button title={saved ? 'Saved ✓' : 'Save key'} onPress={saveKey} style={{ marginTop: 10 }} />

      <Text style={styles.label}>AI model</Text>
      <Text style={styles.help}>
        The Claude model used for profiling, vision, and chat. Opus is the most accurate for
        reading labels and shelf photos; switch to Sonnet or Haiku if your API tier rate-limits
        Opus or you want lower cost.
      </Text>
      {CLAUDE_MODELS.map((m) => {
        const active = m.id === model;
        return (
          <TouchableOpacity
            key={m.id}
            style={[styles.modelRow, active && styles.modelRowActive]}
            onPress={() => setModel(m.id)}
          >
            <Text style={[styles.modelName, active && styles.modelNameActive]}>
              {active ? '● ' : '○ '}
              {m.label}
            </Text>
            <Text style={styles.modelNote}>{m.note}</Text>
          </TouchableOpacity>
        );
      })}

      <Text style={styles.section}>Privacy & Data</Text>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.toggleTitle}>Share anonymized usage analytics</Text>
          <Text style={styles.help}>
            Helps improve the app. Events are anonymous (random ID, never your identity), contain
            no bottle names or personal data, and stay on-device today. Off by default.
          </Text>
        </View>
        <Switch
          value={consent.analytics}
          onValueChange={(v) => setConsent({ analytics: v })}
          trackColor={{ true: colors.amber, false: colors.cardAlt }}
          thumbColor={colors.text}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.toggleTitle}>Allow sharing/sale of data to partners</Text>
          <Text style={styles.help}>
            Off by default. Turning this on requires iOS tracking permission and covers only the
            anonymized analytics above — never your collection, name, or email. Turn off anytime
            (your CCPA "Do Not Sell or Share" right).
          </Text>
        </View>
        <Switch
          value={consent.sellShare}
          onValueChange={toggleSellShare}
          trackColor={{ true: colors.amber, false: colors.cardAlt }}
          thumbColor={colors.text}
        />
      </View>

      <Button
        title="Export my data (JSON)"
        variant="secondary"
        onPress={exportData}
        style={{ marginTop: 14 }}
      />
      <Button
        title="Delete all my data"
        variant="danger"
        onPress={confirmDeleteAll}
        style={{ marginTop: 10 }}
      />

      <Text style={[styles.help, { marginTop: 28 }]}>
        Whiskey Vault v1.0 · Your collection lives on this device. The AI features send your
        collection's tasting metadata to Anthropic under your own API key; barcode lookups query
        Open Food Facts. See the privacy policy in the project repository for full details.
      </Text>
    </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  section: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  body: { color: colors.text, fontSize: 15 },
  label: { color: colors.amberBright, marginTop: 18, marginBottom: 2, fontWeight: '600' },
  help: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 4 },
  modelRow: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
  },
  modelRowActive: { borderColor: colors.amber, backgroundColor: colors.cardAlt },
  modelName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  modelNameActive: { color: colors.amberBright },
  modelNote: { color: colors.textDim, fontSize: 12, marginTop: 3, lineHeight: 17 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 10,
  },
  toggleTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
