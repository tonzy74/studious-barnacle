import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
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

import { Button } from '../components';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, radius, spacing } from '../theme';

type Route = RouteProp<RootStackParamList, 'LogPour'>;

const QUICK = [
  { label: 'Pass', value: 25 },
  { label: 'OK', value: 50 },
  { label: 'Good', value: 75 },
  { label: 'Great', value: 90 },
  { label: 'Unicorn', value: 100 },
];

export default function LogPourScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const addPour = useStore((s) => s.addPour);
  const track = useStore((s) => s.track);

  const [name, setName] = useState(params?.name ?? '');
  const [rating, setRating] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();

  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]?.uri) setPhoto(r.assets[0].uri);
  };

  const save = () => {
    if (!name.trim()) return;
    addPour({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bottleId: params?.bottleId,
      name: name.trim(),
      distillery: params?.distillery,
      rating,
      notes: notes.trim() || undefined,
      imageUrl: photo,
      at: Date.now(),
    });
    track('pour_logged', { rated: rating !== undefined });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        <Text style={styles.label}>What did you pour?</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Eagle Rare 10"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Your rating {rating !== undefined ? `— ${rating}/100` : ''}</Text>
        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.value}
              style={[styles.quick, rating === q.value && styles.quickActive]}
              onPress={() => setRating(q.value)}
            >
              <Text style={[styles.quickText, rating === q.value && styles.quickTextActive]}>
                {q.label}
              </Text>
              <Text style={[styles.quickVal, rating === q.value && styles.quickTextActive]}>
                {q.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={rating !== undefined ? String(rating) : ''}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            setRating(Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : undefined);
          }}
          keyboardType="number-pad"
          placeholder="…or type a precise score 0-100"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={styles.label}>Tasting notes</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Nose, palate, finish, mood…"
          placeholderTextColor={colors.textFaint}
        />

        {photo && <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />}
        <Button
          title={photo ? 'Change photo' : 'Add a photo'}
          icon="camera"
          variant="secondary"
          onPress={pickPhoto}
          style={{ marginTop: spacing.md }}
        />

        <Button
          title="Save to journal"
          icon="book"
          onPress={save}
          disabled={!name.trim()}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.amberBright, fontWeight: '600', marginTop: spacing.lg, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  notes: { minHeight: 90, textAlignVertical: 'top' },
  quickRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.sm },
  quick: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActive: { backgroundColor: colors.amber, borderColor: colors.amberBright },
  quickText: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  quickVal: { color: colors.textFaint, fontSize: 10, marginTop: 1 },
  quickTextActive: { color: colors.ink },
  photo: { width: '100%', height: 200, borderRadius: radius.md, marginTop: spacing.md },
});
