import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import * as Speech from 'expo-speech';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
};

const createInitialMessages = (): Message[] => [
  {
    id: makeId(),
    role: 'assistant',
    text: '안녕하세요! 일반 AI 채팅 또는 여행 퀘스트 추천이 가능해요.',
  },
];

export default function QuestAIChatScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);

  const [chats, setChats] = useState<ChatSession[]>([
    {
      id: makeId(),
      title: '기본 채팅',
      createdAt: Date.now(),
      messages: createInitialMessages(),
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState<string>(() => chats[0].id);
  const [input, setInput] = useState('');
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [mode, setMode] = useState<'chat' | 'quest'>('chat');
  const [questStep, setQuestStep] = useState<number>(0);
  const [questNaturalMode, setQuestNaturalMode] = useState(false);

  const currentMessages = useMemo(
    () => chats.find((chat) => chat.id === currentChatId)?.messages ?? [],
    [chats, currentChatId]
  );

  const updateCurrentChatMessages = (updater: (prev: Message[]) => Message[]) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages: updater(chat.messages) } : chat
      )
    );
  };

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [currentMessages]);

  const addAssistant = (text: string) => {
    updateCurrentChatMessages((prev) => [
      ...prev,
      { id: makeId(), role: 'assistant', text },
    ]);
  };

  const addUser = (text: string) => {
    updateCurrentChatMessages((prev) => [
      ...prev,
      { id: makeId(), role: 'user', text },
    ]);
  };

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const content = (overrideText ?? input).trim();
      if (!content) return;

      addUser(content);
      setInput('');

      if (mode === 'quest' && questNaturalMode) {
        handleNaturalQuestFlow(content);
        return;
      }

      const responseText = `'${content}'에 대한 응답이 여기에 생성됩니다.`;
      addAssistant(responseText);
    },
    [input, mode, questNaturalMode]
  );

  const startQuestFlow = () => {
    setMode('quest');
    setQuestStep(0);

    addAssistant('여행 추천을 원하시는군요!');
    addAssistant('버튼 기반으로 진행하시겠어요, 아니면 자연어 입력으로 진행할까요?');

    setQuestStep(100);
  };

  const handleNaturalQuestFlow = (text: string) => {
    if (questStep === 1) {
      addAssistant('좋아요! 차량 유무도 알려주세요.');
      setQuestStep(2);
      return;
    }
    if (questStep === 2) {
      addAssistant('예산은 어느 정도 생각하세요?');
      setQuestStep(3);
      return;
    }
    if (questStep === 3) {
      addAssistant('원하는 테마를 말해 주세요!');
      setQuestStep(4);
      return;
    }
    if (questStep === 4) {
      addAssistant('지역구 또는 선호 지역을 알려 주세요.');
      setQuestStep(5);
      return;
    }
    if (questStep === 5) {
      addAssistant('추천 코스를 만드는 중...');
      setTimeout(() => {
        addAssistant('여기 추천 코스입니다! (목업)');
        addAssistant('- 장소 1\n- 장소 2\n- 장소 3\n- 장소 4');
        addAssistant('퀘스트에 담을까요?');
        setQuestStep(6);
      }, 700);
      return;
    }
    if (questStep === 6) {
      addAssistant('담았어요! 여행 추천이 끝났습니다 😊');
      setMode('chat');
      setQuestStep(0);
      setQuestNaturalMode(false);
    }
  };

  const handleQuestSelect = (answer: string) => {
    addUser(answer);

    if (questStep === 100) {
      if (answer === '버튼으로 진행할래요') {
        setQuestNaturalMode(false);
        setQuestStep(1);
        addAssistant('몇 명이서 가시나요?');
        return;
      }
      if (answer === '자연어로 말하고 싶어요') {
        setQuestNaturalMode(true);
        setQuestStep(1);
        addAssistant('좋습니다! 여행 정보부터 말씀해주세요.');
        return;
      }
    }

    if (!questNaturalMode) {
      if (questStep === 1) {
        addAssistant('차량이 있으신가요?');
        setQuestStep(2);
        return;
      }
      if (questStep === 2) {
        addAssistant('예산은 어느 정도 생각하시나요?');
        setQuestStep(3);
        return;
      }
      if (questStep === 3) {
        addAssistant('원하는 테마는 무엇인가요?');
        setQuestStep(4);
        return;
      }
      if (questStep === 4) {
        addAssistant('어느 지역으로 가고 싶나요?');
        setQuestStep(5);
        return;
      }
      if (questStep === 5) {
        addAssistant('추천 코스를 만들고 있어요...');
        setTimeout(() => {
          addAssistant('완성됐어요! (목업)');
          addAssistant('- 장소1\n- 장소2\n- 장소3\n- 장소4');
          addAssistant('퀘스트에 담을까요?');
          setQuestStep(6);
        }, 800);
        return;
      }
      if (questStep === 6) {
        addAssistant('퀘스트에 담았습니다!');
        setMode('chat');
        setQuestStep(0);
        return;
      }
    }
  };

  const renderQuestOptions = () => {
    if (mode !== 'quest') return null;

    if (questStep === 100) {
      return (
        <QuestOptionRow
          options={['버튼으로 진행할래요', '자연어로 말하고 싶어요']}
          onSelect={handleQuestSelect}
        />
      );
    }

    if (!questNaturalMode) {
      if (questStep === 1)
        return <QuestOptionRow options={['혼자', '2명', '3명', '4명', '5명 이상']} onSelect={handleQuestSelect} />;

      if (questStep === 2)
        return <QuestOptionRow options={['있어요', '없어요']} onSelect={handleQuestSelect} />;

      if (questStep === 3)
        return <QuestOptionRow options={['1~2만원', '2~3만원', '3~4만원', '5만원 이상']} onSelect={handleQuestSelect} />;

      if (questStep === 4)
        return (
          <QuestOptionRow
            options={['역사', '자연', '전시·박물관', '데이트', '카페', '체험']}
            onSelect={handleQuestSelect}
          />
        );

      if (questStep === 5)
        return <QuestOptionRow options={['강남', '홍대', '성수', '종로', '여의도']} onSelect={handleQuestSelect} />;

      if (questStep === 6)
        return <QuestOptionRow options={['네, 담아주세요', '다른 코스 추천']} onSelect={handleQuestSelect} />;
    }

    return null;
  };

  const handleModeEntry = (choice: string) => {
    addUser(choice);
    if (choice === '여행 퀘스트 추천 받을래요') {
      startQuestFlow();
      return;
    }
    addAssistant("알겠습니다! 궁금한 점이 생기면 언제든지 말씀주세요. 여행 추천이 필요하면 '퀘스트'라고 입력해 주세요.");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowChatList(true)} style={styles.backButton}>
            <Ionicons name="menu" size={22} color="#fff" />
          </Pressable>
          <ThemedText type="title">Quest AI Chat</ThemedText>
          <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {currentMessages.map((message) => {
            const isAssistant = message.role === 'assistant';
            return (
              <View
                key={message.id}
                style={[
                  styles.bubble,
                  isAssistant ? styles.assistantBubble : styles.userBubble,
                ]}
              >
                <ThemedText style={[styles.bubbleText, !isAssistant && styles.userBubbleText]}>
                  {message.text}
                </ThemedText>
              </View>
            );
          })}
        </ScrollView>

        {mode === 'chat' && questStep === 0 && (
          <QuestOptionRow
            options={['일반 AI 채팅 계속할게요', '여행 퀘스트 추천 받을래요']}
            onSelect={handleModeEntry}
          />
        )}

        {renderQuestOptions()}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="무엇이든 말씀해주세요"
            placeholderTextColor="#94A3B8"
          />
          <Pressable style={styles.sendButton} onPress={() => sendMessage()}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
          </Pressable>
          <Pressable
            style={styles.voiceButton}
            onPress={() => setShowVoiceMode(true)}
          >
            <Ionicons name="mic-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        {showChatList && (
          <ChatListOverlay
            chats={chats}
            currentChatId={currentChatId}
            onSelect={(chatId) => {
              setCurrentChatId(chatId);
              setShowChatList(false);
              setMode('chat');
              setQuestStep(0);
              setQuestNaturalMode(false);
              setInput('');
              Speech.stop();
            }}
            onClose={() => setShowChatList(false)}
            onCreate={() => {
              const newChat: ChatSession = {
                id: makeId(),
                title: `새 채팅 ${chats.length + 1}`,
                createdAt: Date.now(),
                messages: createInitialMessages(),
              };
              setChats((prev) => [...prev, newChat]);
              setCurrentChatId(newChat.id);
              setShowChatList(false);
              setMode('chat');
              setQuestStep(0);
              setQuestNaturalMode(false);
              setInput('');
              Speech.stop();
            }}
          />
        )}

        {showVoiceMode && <VoiceModeOverlay onClose={() => setShowVoiceMode(false)} />}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function QuestOptionRow({
  options,
  onSelect,
}: {
  options: string[];
  onSelect: (s: string) => void;
}) {
  return (
    <View style={optionStyles.row}>
      {options.map((opt) => (
        <Pressable key={opt} style={optionStyles.button} onPress={() => onSelect(opt)}>
          <ThemedText style={optionStyles.text}>{opt}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const optionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 10,
  },
  button: {
    backgroundColor: '#5B7DFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  text: {
    color: '#fff',
  },
});

const chatListStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 60,
  },
  panel: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#0f172a',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  newChatText: {
    color: '#fff',
  },
  chatItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f2937',
  },
  chatItemActive: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  chatItemText: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  chatItemTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  chatItemSub: {
    color: '#94a3b8',
    fontSize: 12,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeText: {
    color: '#fff',
  },
});

type ChatListOverlayProps = {
  chats: ChatSession[];
  currentChatId: string;
  onSelect: (chatId: string) => void;
  onClose: () => void;
  onCreate: () => void;
};

function ChatListOverlay({ chats, currentChatId, onSelect, onClose, onCreate }: ChatListOverlayProps) {
  return (
    <View style={chatListStyles.overlay}>
      <View style={chatListStyles.panel}>
        <View style={chatListStyles.header}>
          <ThemedText type="subtitle">채팅 목록</ThemedText>
          <Pressable style={chatListStyles.newChatButton} onPress={onCreate}>
            <Ionicons name="add" size={18} color="#fff" />
            <ThemedText style={chatListStyles.newChatText}>새 채팅</ThemedText>
          </Pressable>
        </View>
        <ScrollView style={{ flex: 1 }}>
          {chats.map((chat) => {
            const isActive = chat.id === currentChatId;
            return (
              <Pressable
                key={chat.id}
                style={[chatListStyles.chatItem, isActive && chatListStyles.chatItemActive]}
                onPress={() => onSelect(chat.id)}
              >
                <ThemedText style={isActive ? chatListStyles.chatItemTextActive : chatListStyles.chatItemText}>
                  {chat.title}
                </ThemedText>
                <ThemedText style={chatListStyles.chatItemSub}>
                  {new Date(chat.createdAt).toLocaleDateString()}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={chatListStyles.closeButton} onPress={onClose}>
          <ThemedText style={chatListStyles.closeText}>닫기</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function VoiceModeOverlay({ onClose }: { onClose: () => void }) {
  return (
    <View style={overlayStyles.overlay}>
      <View style={overlayStyles.circle} />
      <View style={overlayStyles.bottomMenu}>
        <Pressable style={overlayStyles.menuButton}>
          <Ionicons name="videocam-outline" size={30} color="#aaa" />
        </Pressable>
        <Pressable style={overlayStyles.menuButton}>
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
});

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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
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
  voiceButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});


