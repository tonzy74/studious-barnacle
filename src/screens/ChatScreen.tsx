import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ScreenGradient } from '../components';
import { askSommelier } from '../lib/claude';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors, gradients, radius, spacing, type as typo } from '../theme';
import { ChatMsg } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTIONS = [
  { icon: 'restaurant' as const, text: 'What should I pour with a ribeye tonight?' },
  { icon: 'rainy' as const, text: 'Pick something for a cold rainy evening' },
  { icon: 'cafe' as const, text: 'Which bottle pairs with dark chocolate?' },
  { icon: 'sparkles' as const, text: 'Surprise me with a pour and tell me why' },
];

function SommelierMark() {
  return (
    <LinearGradient colors={gradients.gold} style={styles.mark}>
      <Ionicons name="wine" size={30} color={colors.ink} />
    </LinearGradient>
  );
}

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const bottles = useStore((s) => s.bottles);
  const apiKey = useStore((s) => s.apiKey);
  const model = useStore((s) => s.model);
  const track = useStore((s) => s.track);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const history: ChatMsg[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(history);
    setInput('');
    setBusy(true);
    track('chat_message_sent', { count: history.length });
    try {
      const reply = await askSommelier(apiKey, bottles, history, model);
      setMessages([...history, { role: 'assistant', text: reply }]);
    } catch (err) {
      const status = (err as { status?: number }).status;
      const msg =
        status === 401
          ? 'That API key was rejected — double-check it in Settings.'
          : status === 429
            ? 'Rate limited — give it a moment and try again.'
            : `Something went wrong reaching the sommelier: ${(err as Error).message}`;
      setMessages([...history, { role: 'assistant', text: msg }]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (!apiKey) {
    return (
      <ScreenGradient>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <SommelierMark />
          <Text style={styles.title}>AI Sommelier</Text>
          <Text style={styles.text}>
            The pairing chat is powered by Claude. Add your Anthropic API key in Settings to enable
            it — the key stays on your device.
          </Text>
          <Button
            title="Open Settings"
            icon="settings-outline"
            onPress={() => navigation.navigate('Settings')}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </ScreenGradient>
    );
  }

  return (
    <ScreenGradient>
      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {messages.length === 0 ? (
          <View style={styles.center}>
            <SommelierMark />
            <Text style={styles.title}>AI Sommelier</Text>
            <Text style={styles.text}>
              Ask for pairings from your {bottles.length}-bottle collection.
            </Text>
            <View style={{ marginTop: spacing.xl, width: '100%' }}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s.text}
                  style={styles.suggestion}
                  onPress={() => send(s.text)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={s.icon} size={18} color={colors.amber} />
                  <Text style={styles.suggestionText}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: spacing.lg }}
            renderItem={({ item }) =>
              item.role === 'user' ? (
                <LinearGradient
                  colors={gradients.gold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bubble, styles.userBubble]}
                >
                  <Text style={styles.userBubbleText}>{item.text}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <Text style={styles.bubbleText}>{item.text}</Text>
                </View>
              )
            }
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {busy && (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.amber} />
            <Text style={{ color: colors.textDim, marginLeft: spacing.sm }}>
              Consulting the sommelier…
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask for a pairing…"
            placeholderTextColor={colors.textFaint}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || busy) && { opacity: 0.4 }]}
            onPress={() => send(input)}
            disabled={!input.trim() || busy}
          >
            <Ionicons name="arrow-up" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  mark: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typo.title, color: colors.text },
  text: { color: colors.textDim, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: { color: colors.text, flex: 1, fontSize: 14 },
  bubble: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, maxWidth: '86%' },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  userBubbleText: { color: colors.ink, lineHeight: 20, fontWeight: '600' },
  assistantBubble: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, lineHeight: 21 },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.amber,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
