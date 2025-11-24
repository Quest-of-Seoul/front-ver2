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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://10.0.2.2:8000";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: 'assistant',
      text: '안녕하세요! 서울 관광에 대해 궁금한 점을 물어보세요. 🏛️\n\n사진을 업로드하면 해당 장소를 분석해드릴게요! 📸',
    },
  ]);
  const [input, setInput] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [vlmContext, setVlmContext] = useState<VLMContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleImageSelected = async (base64img: string) => {
    addMessage({
      id: makeId(),
      role: 'user',
      imageUrl: `data:image/jpeg;base64,${base64img}`,
    });
    await analyzeImage(base64img);
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

  const analyzeImage = async (base64img: string) => {
    addMessage({
      id: makeId(),
      role: 'assistant',
      text: '분석 중입니다... 🔍',
    });
    try {
      console.log('VLM API URL:', `${API_URL}/vlm/analyze`);

      const res = await fetch(`${API_URL}/vlm/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo-user',
          image: base64img,
          language: 'ko',
          prefer_url: true,
          enable_tts: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data?.description) {
        // VLM 컨텍스트 저장
        setVlmContext({
          placeName: data.place?.name || '서울',
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
            text: `📍 ${data.place.name || '알 수 없는 장소'}\n${data.place.address || ''}`,
          });
        }

        // 후속 질문 안내
        addMessage({
          id: makeId(),
          role: 'assistant',
          text: '이 장소에 대해 더 궁금한 점이 있으시면 질문해주세요! 💬',
        });
      } else {
        addMessage({
          id: makeId(),
          role: 'assistant',
          text: '분석 결과를 불러올 수 없었어요.',
        });
      }
    } catch (error) {
      console.error('VLM analyze error:', error);
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: '이미지 분석 중 오류가 발생했습니다.',
      });
    }
  };

  const sendMessage = async () => {
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
          user_id: 'demo-user',
          landmark: vlmContext.placeName,
          user_message: contextMessage,
          language: 'ko',
          prefer_url: true,
          enable_tts: false,
        };
      } else {
        // VLM 컨텍스트가 없으면 일반 서울 관광 대화
        requestBody = {
          user_id: 'demo-user',
          landmark: '서울',
          user_message: userText,
          language: 'ko',
          prefer_url: true,
          enable_tts: false,
        };
      }

      const res = await fetch(`${API_URL}/docent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
        text: '응답을 가져오는 중 오류가 발생했습니다.',
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
            <ThemedText type="title">Quest Chat</ThemedText>
            <Pressable onPress={exitToPrevious} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
          <ThemedText>AI Docent과 대화를 나눠보세요.</ThemedText>
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
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#7a7a7a"
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={[styles.sendButton, isLoading && styles.buttonDisabled]}
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

        <Modal visible={showImageModal} transparent animationType="slide" onRequestClose={() => setShowImageModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Pressable style={styles.modalItem} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color="#111" />
                <ThemedText style={styles.modalText}>사진 찍기</ThemedText>
              </Pressable>
              <Pressable style={styles.modalItem} onPress={pickImageFromLibrary}>
                <Ionicons name="image" size={20} color="#111" />
                <ThemedText style={styles.modalText}>앨범에서 선택</ThemedText>
              </Pressable>
              <Pressable style={styles.modalCancel} onPress={() => setShowImageModal(false)}>
                <ThemedText style={styles.modalCancelText}>취소</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  buttonDisabled: {
    opacity: 0.6,
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


