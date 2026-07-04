import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

import { Button } from '../components';
import { askSommelier } from '../lib/claude';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store/useStore';
import { colors } from '../theme';
import { ChatMsg } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTIONS = [
  'What should I pour with a ribeye tonight?',
  'Pick something for a cold rainy evening',
  'Which bottle pairs with dark chocolate?',
  'Surprise me with a pour and tell me why',
];

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const bottles = useStore((s) => s.bottles);
  const apiKey = useStore((s) => s.apiKey);
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
      const reply = await askSommelier(apiKey, bottles, history);
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
      <View style={[styles.container, styles.center]}>
        <Text style={styles.title}>AI Sommelier</Text>
        <Text style={styles.text}>
          The pairing chat is powered by Claude. Add your Anthropic API key in Settings to enable
          it — the key stays on your device.
        </Text>
        <Button
          title="Open Settings"
          onPress={() => navigation.navigate('Settings')}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.title}>AI Sommelier</Text>
          <Text style={styles.text}>
            Ask for pairings from your {bottles.length}-bottle collection.
          </Text>
          <View style={{ marginTop: 20, width: '100%' }}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestion} onPress={() => send(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {busy && (
        <View style={styles.busyRow}>
          <ActivityIndicator color={colors.amber} />
          <Text style={{ color: colors.textDim, marginLeft: 8 }}>Consulting the sommelier…</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask for a pairing…"
          placeholderTextColor={colors.textDim}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || busy) && { opacity: 0.4 }]}
          onPress={() => send(input)}
          disabled={!input.trim() || busy}
        >
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  text: { color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  suggestion: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: { color: colors.amberBright },
  bubble: { borderRadius: 14, padding: 12, marginBottom: 10, maxWidth: '85%' },
  userBubble: { backgroundColor: colors.amber, alignSelf: 'flex-end' },
  assistantBubble: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, lineHeight: 20 },
  busyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 12,
    padding: 12,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.amber,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: { color: '#1a120b', fontSize: 20, fontWeight: '800' },
});
