import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { aiStationApi } from '@/services/api';

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
};

const formatTimestamp = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${ampm} ${displayHours}:${displayMinutes}`;
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
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const recordRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

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
      addMessage({ id: makeId(), role: 'user', text, timestamp: new Date() });
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
        chat_session_id: sessionId,
      });
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || '응답을 받지 못했습니다.',
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Init chat error:', err);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: '오류가 발생했어요!',
        timestamp: new Date(),
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
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const data = await aiStationApi.exploreRAGChat({
        user_message: userText,
        language: 'ko',
        prefer_url: true,
        chat_session_id: sessionId,
      });
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || '응답을 받지 못했습니다.',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: '죄송합니다. 응답을 가져오는 중 오류가 발생했습니다.',
        timestamp: new Date(),
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

      // expo-file-system을 사용하여 base64로 변환
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      return base64;
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
        timestamp: new Date(),
      };
      addMessage(msg);

      // 2) 이어서 기존 RAG Chat으로 요청
      await sendMessageFromSTT(text);

      // 3) TTS 재생 (optional)
      if (data.audio) {
        try {
          const sound = new Audio.Sound();
          // base64 오디오를 임시 파일로 저장 후 재생
          const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
          await FileSystem.writeAsStringAsync(fileUri, data.audio, {
            encoding: 'base64',
          });
          await sound.loadAsync({ uri: fileUri });
          await sound.playAsync();
          // 재생 완료 후 정리
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
          });
        } catch (ttsError) {
          console.error("TTS 재생 오류:", ttsError);
        }
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
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('STT Chat error:', err);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: '응답을 가져오는 중 오류가 발생했습니다.',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#8FB6F1' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={exitToPrevious} style={styles.menuButton}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path d="M3.33334 15C3.09723 15 2.89945 14.92 2.74 14.76C2.58056 14.6 2.50056 14.4022 2.5 14.1667C2.49945 13.9311 2.57945 13.7333 2.74 13.5733C2.90056 13.4133 3.09834 13.3333 3.33334 13.3333H16.6667C16.9028 13.3333 17.1008 13.4133 17.2608 13.5733C17.4208 13.7333 17.5006 13.9311 17.5 14.1667C17.4994 14.4022 17.4194 14.6003 17.26 14.7608C17.1006 14.9214 16.9028 15.0011 16.6667 15H3.33334ZM3.33334 10.8333C3.09723 10.8333 2.89945 10.7533 2.74 10.5933C2.58056 10.4333 2.50056 10.2356 2.5 10C2.49945 9.76444 2.57945 9.56667 2.74 9.40667C2.90056 9.24667 3.09834 9.16667 3.33334 9.16667H16.6667C16.9028 9.16667 17.1008 9.24667 17.2608 9.40667C17.4208 9.56667 17.5006 9.76444 17.5 10C17.4994 10.2356 17.4194 10.4336 17.26 10.5942C17.1006 10.7547 16.9028 10.8344 16.6667 10.8333H3.33334ZM3.33334 6.66667C3.09723 6.66667 2.89945 6.58667 2.74 6.42667C2.58056 6.26667 2.50056 6.06889 2.5 5.83333C2.49945 5.59778 2.57945 5.4 2.74 5.24C2.90056 5.08 3.09834 5 3.33334 5H16.6667C16.9028 5 17.1008 5.08 17.2608 5.24C17.4208 5.4 17.5006 5.59778 17.5 5.83333C17.4994 6.06889 17.4194 6.26694 17.26 6.4275C17.1006 6.58806 16.9028 6.66778 16.6667 6.66667H3.33334Z" fill="white"/>
            </Svg>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Plan Chat</ThemedText>
          <Pressable onPress={exitToPrevious} style={styles.closeButton}>
            <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <G clipPath="url(#clip0_418_8934)">
                <Path fillRule="evenodd" clipRule="evenodd" d="M1.82891 0.313458C1.62684 0.118289 1.35619 0.0102947 1.07527 0.0127358C0.794342 0.015177 0.525614 0.127858 0.326962 0.32651C0.128311 0.525161 0.0156299 0.793889 0.0131887 1.07481C0.0107476 1.35574 0.118742 1.62638 0.313911 1.82846L5.98498 7.49953L0.313911 13.1706C0.211579 13.2694 0.129955 13.3877 0.0738023 13.5184C0.0176498 13.6491 -0.0119069 13.7897 -0.0131431 13.932C-0.0143794 14.0742 0.0127296 14.2153 0.066602 14.347C0.120474 14.4787 0.200031 14.5983 0.300631 14.6989C0.40123 14.7995 0.520857 14.879 0.652532 14.9329C0.784206 14.9868 0.925291 15.0139 1.06756 15.0127C1.20982 15.0114 1.35041 14.9819 1.48113 14.9257C1.61185 14.8696 1.73008 14.7879 1.82891 14.6856L7.49998 9.01453L13.1711 14.6856C13.3731 14.8808 13.6438 14.9888 13.9247 14.9863C14.2056 14.9839 14.4743 14.8712 14.673 14.6726C14.8717 14.4739 14.9843 14.2052 14.9868 13.9242C14.9892 13.6433 14.8812 13.3727 14.6861 13.1706L9.01498 7.49953L14.6861 1.82846C14.8812 1.62638 14.9892 1.35574 14.9868 1.07481C14.9843 0.793889 14.8717 0.525161 14.673 0.32651C14.4743 0.127858 14.2056 0.015177 13.9247 0.0127358C13.6438 0.0102947 13.3731 0.118289 13.1711 0.313458L7.49998 5.98453L1.82891 0.313458Z" fill="white"/>
              </G>
              <Defs>
                <ClipPath id="clip0_418_8934">
                  <Rect width="15" height="15" fill="white"/>
                </ClipPath>
              </Defs>
            </Svg>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages}>
          {messages.map((msg) => (
            <View key={msg.id} style={styles.messageContainer}>
              {msg.role === 'assistant' ? (
                <View style={styles.assistantMessageRow}>
                  <View style={styles.profileCircle}>
                    <Image
                      source={require('@/assets/images/face-3.png')}
                      style={styles.profileImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.assistantContentColumn}>
                    <ThemedText style={styles.nickname}>AI Docent</ThemedText>
                    <View style={styles.bubbleWithTime}>
                      <View style={styles.assistantBubble}>
                        <ThemedText style={styles.assistantBubbleText}>{msg.text}</ThemedText>
                      </View>
                      <ThemedText style={styles.timestamp}>
                        {formatTimestamp(msg.timestamp)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.userBubbleContainer}>
                  <ThemedText style={styles.timestamp}>
                    {formatTimestamp(msg.timestamp)}
                  </ThemedText>
                  <View style={styles.userBubble}>
                    <ThemedText style={styles.userText}>{msg.text}</ThemedText>
                  </View>
                </View>
              )}
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
      </View>
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
    backgroundColor: '#8FB6F1',
  },
  header: {
    width: '100%',
    height: 112,
    backgroundColor: '#8FB6F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  menuButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  closeButton: {
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messages: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  messageContainer: {
    marginBottom: 10,
    width: '100%',
  },
  assistantMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF5E7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 32,
    height: 32,
  },
  assistantContentColumn: {
    flex: 1,
    gap: 4,
  },
  nickname: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  bubbleWithTime: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    padding: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    maxWidth: '80%',
  },
  assistantBubbleText: {
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#9DFFE0',
    padding: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    maxWidth: '80%',
  },
  userText: {
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  timestamp: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 12,
    marginBottom: 2,
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

