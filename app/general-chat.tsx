import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

export default function GeneralChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: 'assistant',
      text: '안녕하세요! 서울의 명소에 대해 궁금한 점을 물어보세요. 🏛️',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      text: userText,
    };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/docent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo-user',
          landmark: 'Seoul',
          user_message: userText,
          language: 'ko',
          prefer_url: true,
          enable_tts: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || '응답을 받지 못했습니다.',
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: '죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exitToPrevious = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <ThemedText type="title">General Chat</ThemedText>
            <Pressable onPress={exitToPrevious} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
          <ThemedText>궁금한 점을 자유롭게 물어보세요.</ThemedText>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === 'assistant' ? styles.assistantBubble : styles.userBubble]}
            >
              <ThemedText style={msg.role === 'user' ? styles.userText : undefined}>{msg.text}</ThemedText>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#7a7a7a"
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="paper-plane" size={20} color="#fff" />
            )}
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
  },
  header: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    paddingVertical: 20,
    gap: 10,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#C1C9D9',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#5B7DFF',
  },
  userText: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#5B7DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

