import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, View, FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { useChatHistoryStore } from '@/store/useChatHistoryStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { ChatSession } from '@/services/api';

export default function ChatHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'ai' | 'plus' | 'plan'>('ai');
  const { sessions, isLoading, error, fetchChatList } = useChatHistoryStore();
  const { isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [tab, isAuthenticated]);

  const loadChats = async () => {
    let params: {
      limit?: number;
      mode?: 'explore' | 'quest';
      function_type?: 'rag_chat' | 'vlm_chat' | 'route_recommend';
    } = { limit: 20 };

    if (tab === 'ai') {
      // 일반 AI 채팅: Explore 모드 RAG 채팅
      params.mode = 'explore';
      params.function_type = 'rag_chat';
    } else if (tab === 'plus') {
      // AI PLUS 채팅: Quest 모드 RAG + VLM 채팅 모두 포함
      params.mode = 'quest';
      // function_type을 지정하지 않으면 quest mode의 모든 채팅 (rag_chat, vlm_chat) 가져옴
    } else if (tab === 'plan') {
      // Plan 채팅: 여행 경로 추천
      params.mode = 'explore';
      params.function_type = 'route_recommend';
    }

    await fetchChatList(params);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleSessionPress = (session: ChatSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const formatTime = (timeAgo: string) => {
    // API에서 이미 "5분전", "01월 01일" 형식으로 제공됨
    return timeAgo;
  };

  const renderItem = ({ item }: { item: ChatSession }) => {
    // function_type에 따라 아이콘 및 뱃지 표시
    const getFunctionTypeBadge = () => {
      if (item.function_type === 'vlm_chat') {
        return '📸 이미지';
      } else if (item.function_type === 'route_recommend') {
        return '🗺️ 경로추천';
      } else if (item.mode === 'quest') {
        return '🎯 퀘스트';
      }
      return null;
    };

    return (
      <Pressable
        style={styles.chatCard}
        onPress={() => handleSessionPress(item)}
      >
        <View style={styles.cardHeader}>
          <ThemedText style={styles.message} numberOfLines={1}>
            {item.title || '제목 없음'}
          </ThemedText>
          {getFunctionTypeBadge() && (
            <ThemedText style={styles.typeBadge}>{getFunctionTypeBadge()}</ThemedText>
          )}
        </View>
        
        {item.chats && item.chats.length > 0 && (
          <ThemedText style={styles.preview} numberOfLines={1}>
            {item.chats[0].user_message}
          </ThemedText>
        )}
        
        <View style={styles.footer}>
          <ThemedText style={styles.time}>{formatTime(item.time_ago)}</ThemedText>
          <View style={styles.badges}>
            {item.is_read_only && (
              <ThemedText style={styles.readOnly}>조회 전용</ThemedText>
            )}
            {item.chats && (
              <ThemedText style={styles.chatCount}>{item.chats.length}개 메시지</ThemedText>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const getData = () => {
    return sessions;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>
          Chat History
        </ThemedText>
        <View>
          <ThemedText style={styles.modeBadge}>Explore Mode</ThemedText>
        </View>
      </View>

      {/* Chat Type Intro */}
      <View style={styles.typeBox}>
        {tab === 'ai' && (
          <>
            <Ionicons name="sparkles" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>AI Chat</ThemedText>
            <ThemedText style={styles.typeDesc}>
              일반 AI 채팅으로 서울의 명소에 대해 자유롭게 물어보세요!
            </ThemedText>
          </>
        )}
        {tab === 'plus' && (
          <>
            <Ionicons name="star" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>AI PLUS Chat</ThemedText>
            <ThemedText style={styles.typeDesc}>
              퀘스트 장소에서 이미지와 함께 더 깊이 있는 정보를 얻으세요!
            </ThemedText>
          </>
        )}
        {tab === 'plan' && (
          <>
            <Ionicons name="trail-sign" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>Travel Plan</ThemedText>
            <ThemedText style={styles.typeDesc}>
              AI가 추천한 여행 경로와 퀘스트 계획을 확인하세요!
            </ThemedText>
          </>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabItem, tab === 'ai' && styles.tabActive]}
          onPress={() => setTab('ai')}
        >
          <ThemedText style={styles.tabText}>AI Chat</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'plus' && styles.tabActive]}
          onPress={() => setTab('plus')}
        >
          <ThemedText style={styles.tabText}>AI PLUS Chat</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'plan' && styles.tabActive]}
          onPress={() => setTab('plan')}
        >
          <ThemedText style={styles.tabText}>Plan Chat</ThemedText>
        </Pressable>
      </View>

      {/* Chat list */}
      {!isAuthenticated ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            로그인이 필요합니다.
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable onPress={loadChats} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>다시 시도</ThemedText>
          </Pressable>
        </View>
      ) : isLoading && !refreshing ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#5B7DFF" />
        </View>
      ) : getData().length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            채팅 내역이 없습니다.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={getData()}
          keyExtractor={(item) => item.session_id}
          renderItem={renderItem}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Chat Detail Modal */}
      {selectedSession && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <ThemedView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  {selectedSession.title || '채팅 내역'}
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {selectedSession.chats?.length || 0}개 메시지
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowDetailModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Chat Messages */}
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner}>
              {selectedSession.chats && selectedSession.chats.length > 0 ? (
                selectedSession.chats.map((chat) => (
                  <View key={chat.id} style={styles.messageGroup}>
                    {/* User Message */}
                    <View style={styles.userMessageContainer}>
                      <View style={styles.userBubble}>
                        <ThemedText style={styles.userMessageText}>
                          {chat.user_message}
                        </ThemedText>
                      </View>
                    </View>

                    {/* AI Response */}
                    <View style={styles.aiMessageContainer}>
                      <View style={styles.aiBubble}>
                        <ThemedText style={styles.aiMessageText}>
                          {chat.ai_response}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>채팅 내역이 없습니다.</ThemedText>
                </View>
              )}
            </ScrollView>
          </ThemedView>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modeBadge: {
    backgroundColor: '#3E4A63',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
  },
  typeBox: {
    backgroundColor: '#2F3F5B',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  typeTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  typeDesc: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
    color: '#C7D3EA',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#2F3F5B',
    padding: 4,
    borderRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#5B7DFF',
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
  },
  chatCard: {
    backgroundColor: '#1F2A3D',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  typeBadge: {
    fontSize: 11,
    color: '#fff',
    backgroundColor: '#5B7DFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  preview: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#A5B4CC',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  readOnly: {
    fontSize: 11,
    color: '#8FB5FF',
    backgroundColor: '#2F3F5B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  chatCount: {
    fontSize: 11,
    color: '#A5B4CC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#A5B4CC',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5B7DFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#2F3F5B',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 20,
    gap: 20,
  },
  messageGroup: {
    gap: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#5B7DFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 15,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  aiBubble: {
    backgroundColor: '#2F3F5B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  aiMessageText: {
    color: '#fff',
    fontSize: 15,
  },
});

