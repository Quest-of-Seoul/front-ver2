import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant' as const,
    text: '안녕하세요! 궁금한 장소나 퀘스트를 물어보세요.',
  },
];

export default function QuestAIChatScreen() {
  const router = useRouter();
  const [messages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <ThemedText type="title">Quest AI Chat</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.messages}>
          {messages.map((message) => {
            const isAssistant = message.role === 'assistant';
            return (
              <View
                key={message.id}
                style={[styles.bubble, isAssistant ? styles.assistantBubble : styles.userBubble]}
              >
                <ThemedText style={[styles.bubbleText, !isAssistant && styles.userBubbleText]}>
                  {message.text}
                </ThemedText>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="어떤 퀘스트를 찾고 있나요?"
            placeholderTextColor="#94A3B8"
          />
          <Pressable style={styles.sendButton} onPress={() => setInput('')}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B7DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messages: {
    flexGrow: 1,
    gap: 12,
    paddingVertical: 10,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  assistantBubble: {
    backgroundColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#5B7DFF',
    alignSelf: 'flex-end',
  },
  bubbleText: {
    color: '#111827',
  },
  userBubbleText: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#5B7DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

