import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useQuestStore } from '@/store/useQuestStore';

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text?: string;
  imageUrl?: string;
};

type VLMContext = {
  placeName: string;
  description: string;
  vlmAnalysis?: string;
};

export default function QuestChatScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { activeQuest } = useQuestStore();

  // Access quest_id and place_id from active quest
  const questId = activeQuest?.quest_id;
  const placeId = activeQuest?.place_id;

  console.log('Quest Chat - Active Quest:', { questId, placeId });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: 'assistant',
      text: 'Hello! Ask me anything about Seoul tourism. 🏛️\n\nUpload a photo and I\'ll analyze the place for you! 📸',
    },
  ]);
  const [input, setInput] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [vlmContext, setVlmContext] = useState<VLMContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const recordRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // base64 이미지 저장

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

  const handleImageSelected = async (base64img: string) => {
    // 이미지를 선택하면 메시지로 추가하고, 입력창에 표시
    setSelectedImage(base64img);
    addMessage({
      id: makeId(),
      role: 'user',
      imageUrl: `data:image/jpeg;base64,${base64img}`,
    });
    // 이미지 선택 후 사용자가 메시지를 입력할 수 있도록 대기
  };

  const pickImageFromLibrary = async () => {
    setShowImageModal(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0].base64) {
      await handleImageSelected(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    setShowImageModal(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0].base64) {
      await handleImageSelected(result.assets[0].base64);
    }
  };

  const analyzeImage = async (base64img: string, userMessage?: string) => {
    addMessage({
      id: makeId(),
      role: 'assistant',
      text: 'Analyzing... 🔍',
    });
    try {
      // Quest 모드일 때는 quest VLM chat API 사용 (chat_logs에 저장됨)
      if (questId) {
        console.log('Quest VLM Chat API:', `${API_URL}/ai-station/quest/vlm-chat`);
        console.log('Quest ID:', questId, 'Place ID:', placeId);

        const data = await aiStationApi.questVlmChat({
          image: base64img,
          user_message: userMessage || undefined,
          quest_id: questId,
          place_id: placeId ?? undefined,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
        });

        if (data?.message) {
          // VLM 컨텍스트 저장
          setVlmContext({
            placeName: data.place?.name || 'Seoul',
            description: data.message,
          });

          addMessage({
            id: makeId(),
            role: 'assistant',
            text: data.message,
          });

          // 장소 정보가 있으면 추가 정보 표시
          if (data.place) {
            addMessage({
              id: makeId(),
              role: 'assistant',
              text: `📍 ${data.place.name || 'Unknown place'}\n${data.place.address || ''}`,
            });
          }

          // 후속 질문 안내
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Feel free to ask more questions about this place! 💬',
          });
        } else {
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Could not load analysis results.',
          });
        }
      } else {
        // Explore 모드일 때는 기존 VLM analyze API 사용
        console.log('VLM API URL:', `${API_URL}/vlm/analyze`);

        const data = await aiStationApi.vlmAnalyze({
          image: base64img,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
        });

        if (data?.description) {
          // VLM 컨텍스트 저장
          setVlmContext({
            placeName: data.place?.name || 'Seoul',
            description: data.description,
            vlmAnalysis: data.vlm_analysis,
          });

          addMessage({
            id: makeId(),
            role: 'assistant',
            text: data.description,
          });

          // 장소 정보가 있으면 추가 정보 표시
          if (data.place) {
            addMessage({
              id: makeId(),
              role: 'assistant',
              text: `📍 ${data.place.name || 'Unknown place'}\n${data.place.address || ''}`,
            });
          }

          // 후속 질문 안내
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Feel free to ask more questions about this place! 💬',
          });
        } else {
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Could not load analysis results.',
          });
        }
      }
    } catch (error) {
      console.error('VLM analyze error:', error);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'An error occurred while analyzing the image.',
      });
    }
  };

  const sendMessage = async () => {
    // 이미지가 선택되어 있으면 이미지 분석 실행
    if (selectedImage) {
      const userText = input.trim();
      if (userText) {
        addMessage({
          id: makeId(),
          role: 'user',
          text: userText,
        });
      }
      setInput('');
      setIsLoading(true);
      await analyzeImage(selectedImage, userText || undefined);
      setSelectedImage(null);
      setIsLoading(false);
      return;
    }

    // 이미지가 없으면 일반 텍스트 메시지
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    addMessage({
      id: makeId(),
      role: 'user',
      text: userText,
    });
    setInput('');
    setIsLoading(true);

    try {
      // VLM 컨텍스트가 있으면 컨텍스트 포함, 없으면 일반 대화
      let requestBody;

      if (vlmContext) {
        const contextMessage = `[이전 이미지 분석 결과]
${vlmContext.description}

[사용자 질문]
${userText}`;

        requestBody = {
          landmark: vlmContext.placeName,
          user_message: contextMessage,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
          quest_id: questId, // 퀘스트 ID 포함
          place_id: placeId ?? undefined, // 장소 ID 포함
        };
      } else {
        // VLM 컨텍스트가 없으면 일반 서울 관광 대화
        requestBody = {
          landmark: 'Seoul',
          user_message: userText,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
          quest_id: questId, // 퀘스트 ID 포함
          place_id: placeId ?? undefined, // 장소 ID 포함
        };
      }

      const data = await aiStationApi.docentChat(requestBody);

      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || 'Failed to receive response.',
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'An error occurred while fetching the response.',
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
        language_code: "en-US",
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
      // VLM 컨텍스트가 있으면 컨텍스트 포함, 없으면 일반 대화
      let requestBody;

      if (vlmContext) {
        const contextMessage = `[이전 이미지 분석 결과]
${vlmContext.description}

[사용자 질문]
${text}`;

        requestBody = {
          landmark: vlmContext.placeName,
          user_message: contextMessage,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
          quest_id: questId, // 퀘스트 ID 포함
          place_id: placeId ?? undefined, // 장소 ID 포함
        };
      } else {
        // VLM 컨텍스트가 없으면 일반 서울 관광 대화
        requestBody = {
          landmark: 'Seoul',
          user_message: text,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
          quest_id: questId, // 퀘스트 ID 포함
          place_id: placeId ?? undefined, // 장소 ID 포함
        };
      }

      const data = await aiStationApi.docentChat(requestBody);

      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || 'Failed to receive response.',
      });
    } catch (err) {
      console.error('STT Chat error:', err);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'An error occurred while fetching the response.',
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
            <ThemedText type="title">Quest Chat</ThemedText>
            <Pressable onPress={exitToPrevious} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
          <ThemedText>Chat with AI Docent.</ThemedText>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === 'assistant' ? styles.assistantBubble : styles.userBubble]}
            >
              {msg.text && (
                <ThemedText style={msg.role === 'user' ? styles.userText : undefined}>{msg.text}</ThemedText>
              )}
              {msg.imageUrl && (
                <Image source={{ uri: msg.imageUrl }} style={{ width: 180, height: 180, borderRadius: 12, marginTop: 6 }} />
              )}
            </View>
          ))}
        </ScrollView>

        {/* 선택된 이미지 프리뷰 */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </Pressable>
            <ThemedText style={styles.imagePreviewText}>
              {input.trim() ? 'Send with message' : 'Press Enter to send image only'}
            </ThemedText>
          </View>
        )}

        <View style={styles.inputRow}>
          <Pressable
            style={[styles.photoButton, isLoading && styles.buttonDisabled]}
            onPress={() => setShowImageModal(true)}
            disabled={isLoading}
          >
            <Ionicons name="image-outline" size={22} color="#fff" />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder={selectedImage ? "Add message (optional)" : "Enter message"}
            placeholderTextColor="#7a7a7a"
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={[styles.sendButton, isLoading && styles.buttonDisabled]}
            onPress={sendMessage}
            disabled={isLoading || (!input.trim() && !selectedImage)}
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

        <Modal visible={showImageModal} transparent animationType="slide" onRequestClose={() => setShowImageModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Pressable style={styles.modalItem} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color="#111" />
                <ThemedText style={styles.modalText}>Take Photo</ThemedText>
              </Pressable>
              <Pressable style={styles.modalItem} onPress={pickImageFromLibrary}>
                <Ionicons name="image" size={20} color="#111" />
                <ThemedText style={styles.modalText}>Choose from Album</ThemedText>
              </Pressable>
              <Pressable style={styles.modalCancel} onPress={() => setShowImageModal(false)}>
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>

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
  photoButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 18,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalText: {
    marginLeft: 8,
  },
  modalCancel: {
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    color: '#777',
  },
});


