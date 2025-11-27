import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, View, FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { useChatHistoryStore } from '@/store/useChatHistoryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuestStore } from '@/store/useQuestStore';
import type { ChatSession, Quest } from '@/services/api';
import { questApi, mapApi } from '@/services/api';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import RouteResultList from '@/components/RouteResultList';

// 🔥 Supabase URL 절대경로 처리
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;

const getFullImageUrl = (url?: string | null): string | null => {
  // 🔥 NULL, undefined, 빈 문자열, "null" 문자열 모두 필터링
  if (!url || url === 'null' || url === 'undefined' || url.trim().length === 0) {
    return null;
  }
  
  // HTTP/HTTPS로 시작하면 절대경로
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 상대경로인 경우 절대경로로 변환
  if (url.startsWith('/storage')) {
    return `${SUPABASE_URL}${url}`;
  }
  
  // 기타 경우 그대로 반환 (하지만 5자 미만이면 무효)
  return url.length > 5 ? url : null;
};

export default function ChatHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'ai' | 'plus' | 'plan'>('ai');
  const { sessions, isLoading, error, fetchChatList } = useChatHistoryStore();
  const { isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRouteResults, setShowRouteResults] = useState(false);
  const [routeQuests, setRouteQuests] = useState<Quest[]>([]);

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
      console.log('🗺️ Loading Plan chats with params:', params);
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

  // 🔥 추천 결과 보기 핸들러
  const handleShowRouteResults = async (chat: any) => {
    try {
      console.log('🔍 handleShowRouteResults 시작');
      const questIds = chat.options?.quest_ids;
      console.log('🔍 questIds:', questIds);

      if (!questIds || questIds.length === 0) {
        console.error('No quest IDs found');
        alert('이 추천 결과는 조회할 수 없습니다.\n새로운 여행 경로를 추천받아 주세요.');
        return;
      }

      // 모든 퀘스트 조회
      console.log('🔍 모든 퀘스트 조회 중...');
      const allQuests = await questApi.getQuestList();
      console.log('🔍 전체 퀘스트 개수:', allQuests.length);
      console.log('🔍 전체 퀘스트 IDs:', allQuests.map((q: Quest) => q.id));

      const selectedQuests = allQuests.filter((q: Quest) => questIds.includes(q.id));
      console.log('🔍 선택된 퀘스트 개수:', selectedQuests.length);
      console.log('🔍 선택된 퀘스트:', selectedQuests.map((q: Quest) => ({ id: q.id, name: q.name })));

      if (selectedQuests.length === 0) {
        console.error('❌ 추천된 퀘스트를 찾을 수 없습니다');
        alert('추천된 퀘스트를 찾을 수 없습니다.');
        return;
      }

      // 🔥 위치 정보 가져오기 주석처리 (거리 계산 없이 진행)
      // console.log('🔍 위치 권한 요청 중...');
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // console.log('🔍 위치 권한 상태:', status);

      // let questsToSet = selectedQuests;

      // if (status === 'granted') {
      //   try {
      //     console.log('🔍 현재 위치 가져오는 중...');
      //     const location = await Location.getCurrentPositionAsync({
      //       accuracy: Location.Accuracy.Balanced,
      //       timeout: 5000,
      //       maximumAge: 10000
      //     });
      //     console.log('🔍 현재 위치 성공:', location.coords.latitude, location.coords.longitude);

      //     const questsWithDistance = selectedQuests.map((quest: Quest) => {
      //       if (quest.latitude && quest.longitude) {
      //         const distance = mapApi.calculateDistance(
      //           location.coords.latitude,
      //           location.coords.longitude,
      //           quest.latitude,
      //           quest.longitude
      //         );
      //         return { ...quest, distance_km: Number(distance.toFixed(1)) };
      //       }
      //       return quest;
      //     });
      //     console.log('🔍 거리 계산 완료:', questsWithDistance.length);
      //     questsToSet = questsWithDistance;
      //   } catch (locationError) {
      //     console.error('❌ 위치 가져오기 실패:', locationError);
      //     console.log('⚠️ 거리 계산 없이 진행');
      //     // 위치를 못 가져와도 계속 진행
      //   }
      // } else {
      //   console.log('🔍 위치 권한 없음, 거리 계산 스킵');
      // }

      console.log('🔍 setRouteQuests 호출, 퀘스트 개수:', selectedQuests.length);
      setRouteQuests(selectedQuests);

      console.log('🔍 setShowRouteResults(true) 호출');
      setShowRouteResults(true);

      console.log('🔍 setShowDetailModal(false) 호출');
      setShowDetailModal(false);

      // 다음 렌더링 사이클에서 상태 확인
      setTimeout(() => {
        console.log('🔍 [다음 렌더] 상태 확인 - 이 시점에 Modal이 보여야 함');
      }, 100);

      console.log('✅ handleShowRouteResults 완료');
    } catch (error) {
      console.error('❌ Error loading route results:', error);
      alert('추천 결과를 불러오는 중 오류가 발생했습니다.');
    }
  };

  /** --------------------------------------------------
   *  메시지 렌더링 전략 함수
   *  chat: 각 메시지 row
   *  type: session.function_type (rag_chat, vlm_chat, route_recommend)
   * --------------------------------------------------*/
  const renderChatMessage = (chat: any, type: string) => {
    const imageUrl = getFullImageUrl(chat.image_url);

    // 📌 AI PLUS - 이미지 + 텍스트
    if (type === "vlm_chat") {
      // 디버깅 로그
      if (chat.image_url) {
        console.log('💬 VLM Chat with image:', {
          id: chat.id,
          raw_url: chat.image_url,
          processed_url: imageUrl,
          has_image: !!imageUrl
        });
      }

      return (
        <View key={chat.id} style={{ marginBottom: 20 }}>
          {/* User Bubble */}
          <View style={[styles.bubble, styles.userBubble]}>
            {chat.user_message && (
              <ThemedText style={styles.userMessageText}>{chat.user_message}</ThemedText>
            )}
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.bubbleImage}
                resizeMode="cover"
                onError={(e) => {
                  console.error('❌ Image load error:', imageUrl, e.nativeEvent.error);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', imageUrl);
                }}
              />
            )}
          </View>

          {/* AI Bubble */}
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ThemedText style={styles.assistantMessageText}>
              {chat.ai_response}
            </ThemedText>
          </View>
        </View>
      );
    }

    // 📌 PLAN CHAT — 경로 추천만의 UI
    if (type === "route_recommend") {
      // 🔥 디버깅: Plan Chat 데이터 확인
      console.log('🗺️ Plan Chat Data:', {
        id: chat.id,
        title: chat.title,
        selected_theme: chat.selected_theme,
        selected_districts: chat.selected_districts,
        include_cart: chat.include_cart,
        options: chat.options,  // 🔥 options 확인
        quest_ids: chat.options?.quest_ids,  // 🔥 quest_ids 확인
        user_message: chat.user_message?.substring(0, 50),
        ai_response: chat.ai_response?.substring(0, 50),
      });

      return (
        <View key={chat.id} style={{ marginBottom: 20 }}>
          <View style={styles.planBubble}>
            <ThemedText style={styles.planTitle}>
              {chat.title || "여행 추천 결과"}
            </ThemedText>

            {chat.selected_theme && (
              <ThemedText style={styles.planMeta}>
                • 테마: {chat.selected_theme}
              </ThemedText>
            )}

            {chat.selected_districts && Array.isArray(chat.selected_districts) && chat.selected_districts.length > 0 && (
              <ThemedText style={styles.planMeta}>
                • 지역: {chat.selected_districts.join(", ")}
              </ThemedText>
            )}

            {chat.include_cart && (
              <ThemedText style={styles.planMeta}>
                • 장바구니 장소 포함
              </ThemedText>
            )}

            {chat.user_message && (
              <ThemedText style={styles.planMeta}>
                📝 요청: {chat.user_message}
              </ThemedText>
            )}

            <ThemedText style={styles.planMessage}>
              {chat.ai_response}
            </ThemedText>

            {chat.options?.quest_ids && chat.options.quest_ids.length > 0 ? (
              <Pressable
                style={styles.planButton}
                onPress={() => {
                  console.log('🔥🔥🔥 버튼 클릭됨!', chat.id);
                  console.log('🔥🔥🔥 quest_ids:', chat.options?.quest_ids);
                  handleShowRouteResults(chat);
                }}
              >
                <ThemedText style={styles.planButtonText}>
                  추천 결과 보기 ({chat.options.quest_ids.length}개)
                </ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.planButton, styles.planButtonDisabled]}>
                <ThemedText style={[styles.planButtonText, styles.planButtonTextDisabled]}>
                  ⚠️ 이전 버전 (결과 조회 불가)
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      );
    }

    // 📌 일반 AI Chat — 텍스트만
    return (
      <View key={chat.id} style={{ marginBottom: 20 }}>
        {/* User */}
        <View style={[styles.bubble, styles.userBubble]}>
          <ThemedText style={styles.userMessageText}>{chat.user_message}</ThemedText>
        </View>

        {/* AI */}
        <View style={[styles.bubble, styles.assistantBubble]}>
          <ThemedText style={styles.assistantMessageText}>
            {chat.ai_response}
          </ThemedText>
        </View>
      </View>
    );
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
            {item.chats[0].image_url ? '📸 ' : ''}{item.chats[0].user_message}
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
    console.log(`📊 Current tab: ${tab}, Sessions count: ${sessions.length}`);
    if (tab === 'plan') {
      console.log('🗺️ Plan sessions:', sessions.map(s => ({
        id: s.session_id,
        function_type: s.function_type,
        title: s.title
      })));
    }
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

      {/* Route Results Modal */}
      <Modal
        visible={showRouteResults}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          console.log('🔍 Modal onRequestClose 호출');
          setShowRouteResults(false);
        }}
      >
        {(() => {
          console.log('🔥🔥🔥 Modal 내부 렌더:', {
            showRouteResults,
            questsCount: routeQuests.length,
            quests: routeQuests.map(q => q.name)
          });
          return null;
        })()}
        {routeQuests.length > 0 ? (
          <RouteResultList
            places={routeQuests}
            onPressPlace={(quest) => {
              console.log('🔍 Quest 클릭:', quest.name);
              setShowRouteResults(false);
              router.push({
                pathname: '/(tabs)/map/quest-detail',
                params: { quest: JSON.stringify(quest) }
              });
            }}
            onClose={() => {
              console.log('🔍 RouteResultList 닫기 클릭');
              setShowRouteResults(false);
            }}
            onStartNavigation={() => {
              console.log('🔍 네비게이션 시작 클릭');
              if (routeQuests.length > 0) {
                setShowRouteResults(false);
                router.push({
                  pathname: '/(tabs)/map/quest-detail',
                  params: { quest: JSON.stringify(routeQuests[0]) }
                });
              }
            }}
          />
        ) : (
          <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>데이터 로딩 중...</ThemedText>
          </ThemedView>
        )}
      </Modal>

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

            {/* Chat Messages - 타입별 렌더링 */}
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.chatMessagesContainer}>
              {selectedSession.chats && selectedSession.chats.length > 0 ? (
                selectedSession.chats.map((chat) =>
                  renderChatMessage(chat, selectedSession.function_type || 'rag_chat')
                )
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
  chatImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
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
    backgroundColor: '#0F1A2A',
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
  // Quest Chat 스타일 추가
  chatMessagesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
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
  assistantMessageText: {
    color: '#1F2937',
    fontSize: 15,
  },
  bubbleImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 6,
  },
  planBubble: {
    backgroundColor: '#1E2A3B',
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  planMeta: {
    fontSize: 13,
    color: '#A5B4CC',
    marginBottom: 4,
  },
  planMessage: {
    marginTop: 12,
    color: '#fff',
    fontSize: 15,
  },
  planButton: {
    marginTop: 14,
    backgroundColor: '#5B7DFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  planButtonDisabled: {
    backgroundColor: '#3E4A63',
    opacity: 0.6,
  },
  planButtonTextDisabled: {
    color: '#94A3B8',
  },
  planMessageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
});

