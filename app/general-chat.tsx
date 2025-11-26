import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { aiStationApi } from '@/services/api';

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

export default function GeneralChatScreen() {
  const router = useRouter();
  const { init } = useLocalSearchParams();
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
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const recordRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  // AI Station에서 init 메시지 자동 처리
  useEffect(() => {
    if (init) {
      const text = Array.isArray(init) ? init[0] : init;
      // 1) 화면에 user 메시지 표시
      addMessage({ id: makeId(), role: 'user', text });
      // 2) 자동으로 rag-chat 호출
      sendMessageFromInit(text);
    }
  }, [init]);

  const sendMessageFromInit = async (text: string) => {
    setIsLoading(true);
    try {
      const data = await aiStationApi.exploreRAGChat({
        user_message: text,
        language: 'ko',
        prefer_url: false,
      });
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || '응답을 받지 못했습니다.',
      });
    } catch (err) {
      console.error('Init chat error:', err);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: '오류가 발생했어요!',
      });
    } finally {
      setIsLoading(false);
    }
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
      const data = await aiStationApi.exploreRAGChat({
        user_message: userText,
        language: 'ko',
        prefer_url: true,
      });

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

  // === STT + TTS ===
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      recordRef.current = recording;
      setIsRecording(true);
      console.log("녹음 시작");
    } catch (err) {
      console.error("녹음 실패:", err);
    }
  };

  const stopRecording = async () => {
    try {
      const recording = recordRef.current;
      if (!recording) return null;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);

      if (!uri) return null;

      const fileData = await fetch(uri);
      const blob = await fileData.blob();

      const reader = new FileReader();
      return new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("오디오 처리 실패:", err);
      setIsRecording(false);
      return null;
    }
  };

  const runSTTandTTS = async () => {
    try {
      const base64Audio = await stopRecording();
      if (!base64Audio) return;

      console.log("STT 요청 중...");

      const data = await aiStationApi.sttTts({
        audio: base64Audio,
        language_code: "ko-KR",
        prefer_url: false,
      });

      const text = data.transcribed_text;

      // 1) 텍스트를 유저 채팅으로 추가
      const msg: Message = {
        id: makeId(),
        role: "user",
        text: text,
      };
      addMessage(msg);

      // 2) 이어서 기존 RAG Chat으로 요청
      await sendMessageFromSTT(text);

      // 3) TTS 재생 (optional)
      if (data.audio) {
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: `data:audio/mp3;base64,${data.audio}` });
        await sound.playAsync();
      }

    } catch (e) {
      console.error("STT/TTS 오류:", e);
    }
  };

  const sendMessageFromSTT = async (text: string) => {
    setIsLoading(true);
    try {
      const data = await aiStationApi.exploreRAGChat({
        user_message: text,
        language: 'ko',
        prefer_url: true,
      });
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || '응답을 받지 못했습니다.',
      });
    } catch (err) {
      console.error('STT Chat error:', err);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: '응답을 가져오는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
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
          <Pressable
            style={styles.voiceButton}
            onPress={() => setShowVoiceMode(true)}
          >
            <Ionicons name="ellipse" size={22} color="#fff" />
          </Pressable>
        </View>

        {showVoiceMode && (
          <VoiceModeOverlay
            onClose={() => setShowVoiceMode(false)}
            isRecording={isRecording}
            onStartRecording={startRecording}
            onStopRecording={async () => {
              await runSTTandTTS();
              recordRef.current = null;
              setShowVoiceMode(false);
            }}
          />
        )}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

type VoiceModeOverlayProps = {
  onClose: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
};

function VoiceModeOverlay({ onClose, isRecording, onStartRecording, onStopRecording }: VoiceModeOverlayProps) {
  return (
    <View style={overlayStyles.overlay}>
      <View style={[overlayStyles.circle, isRecording && overlayStyles.circleRecording]} />
      <View style={overlayStyles.bottomMenu}>
        <Pressable style={overlayStyles.menuButton}>
          <Ionicons name="videocam-outline" size={30} color="#aaa" />
        </Pressable>
        <Pressable
          style={[overlayStyles.menuButton, isRecording && overlayStyles.menuButtonRecording]}
          onPress={async () => {
            if (!isRecording) {
              await onStartRecording();
            } else {
              await onStopRecording();
            }
          }}
        >
          <Ionicons name="mic" size={30} color="#fff" />
        </Pressable>
        <Pressable style={overlayStyles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={30} color="#aaa" />
        </Pressable>
        <Pressable style={overlayStyles.menuButton} onPress={onClose}>
          <Ionicons name="close" size={34} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    marginBottom: 200,
  },
  circleRecording: {
    backgroundColor: '#FF4444',
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  menuButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonRecording: {
    backgroundColor: '#FF4444',
  },
});

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
  voiceButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

