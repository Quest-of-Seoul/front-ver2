import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
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
      params.mode = 'explore';
      params.function_type = 'rag_chat';
    } else if (tab === 'plus') {
      params.mode = 'quest';
      params.function_type = 'vlm_chat';
    } else if (tab === 'plan') {
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
    // 세션 상세 화면으로 이동 (추후 구현 가능)
    console.log('Session pressed:', session.session_id);
  };

  const formatTime = (timeAgo: string) => {
    // API에서 이미 "5분전", "01월 01일" 형식으로 제공됨
    return timeAgo;
  };

  const renderItem = ({ item }: { item: ChatSession }) => (
    <Pressable
      style={styles.chatCard}
      onPress={() => handleSessionPress(item)}
    >
      <ThemedText style={styles.message}>{item.title}</ThemedText>
      {item.mode === 'quest' && (
        <ThemedText style={styles.location}>퀘스트 모드</ThemedText>
      )}
      <View style={styles.footer}>
        <ThemedText style={styles.time}>{formatTime(item.time_ago)}</ThemedText>
        {item.is_read_only && (
          <ThemedText style={styles.readOnly}>조회 전용</ThemedText>
        )}
      </View>
    </Pressable>
  );

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
              Check what you've discovered about Seoul!
            </ThemedText>
          </>
        )}
        {tab === 'plus' && (
          <>
            <Ionicons name="star" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>AI PLUS Chat</ThemedText>
            <ThemedText style={styles.typeDesc}>
              You went to the landmark and learned more! that's a plus!
            </ThemedText>
          </>
        )}
        {tab === 'plan' && (
          <>
            <Ionicons name="trail-sign" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>Plan Chat</ThemedText>
            <ThemedText style={styles.typeDesc}>
              Keep these plans in mind and just get started to move
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
  message: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#8FB5FF',
  },
  time: {
    fontSize: 12,
    color: '#A5B4CC',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  readOnly: {
    fontSize: 11,
    color: '#8FB5FF',
    backgroundColor: '#2F3F5B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
});

