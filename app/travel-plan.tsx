import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { aiStationApi, mapApi } from '@/services/api';
import { useQuestStore } from '@/store/useQuestStore';

import RouteResultList from '@/components/RouteResultList';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const createInitialMessages = (): Message[] => [
  {
    id: makeId(),
    role: 'assistant',
    text: 'Hello! I\'ll recommend a travel route in Seoul. Please answer the questions!',
  },
];

export default function TravelPlanScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { selectedQuests, routeResults: storedRouteResults, setRouteResults: storeRouteResults, clearRouteResults } = useQuestStore();

  const [messages, setMessages] = useState<Message[]>(createInitialMessages());
  const [questStep, setQuestStep] = useState<number>(0);
  const [preferences, setPreferences] = useState<any>({});
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [routeResults, setRouteResults] = useState<any[] | null>(storedRouteResults); // 🔥 추천 결과 저장
  const [viewMode, setViewMode] = useState<'chat' | 'result'>(storedRouteResults ? 'result' : 'chat'); // 🔥 화면 모드 전환

  useEffect(() => {
    // 위치 정보 가져오기
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    })();

    // 초기 질문 시작
    startTravelPlanFlow();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const addMessage = (text: string, role: 'assistant' | 'user') => {
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role, text },
    ]);
  };

  const startTravelPlanFlow = () => {
    const cartCount = selectedQuests.length;
    if (cartCount > 0) {
      addMessage(`You have ${cartCount} place(s) in your quest cart.`, 'assistant');
      if (cartCount === 1) {
        addMessage('Would you like me to create 4 courses including this place, or create 4 new courses?', 'assistant');
      } else {
        addMessage(`Would you like me to create 4 courses including the first place (${selectedQuests[0].name}), or create 4 new courses?`, 'assistant');
      }
      setQuestStep(0);
    } else {
      addMessage('I\'ll create a new travel route for you!', 'assistant');
      addMessage('Where would you like to start?', 'assistant');
      setQuestStep(1);
    }
  };

  const handleAnswer = useCallback(
    async (answer: string) => {
      addMessage(answer, 'user');

      if (questStep === 0) {
        // 장바구니 질문
        if (answer.includes('include') || answer.includes('must')) {
          setPreferences((prev: any) => ({ ...prev, includeCart: true }));
          addMessage('Great! Where would you like to start?', 'assistant');
          setQuestStep(1);
        } else {
          setPreferences((prev: any) => ({ ...prev, includeCart: false }));
          addMessage('I\'ll ask you some questions to create a new course!', 'assistant');
          addMessage('Where would you like to start?', 'assistant');
          setQuestStep(1);
        }
        return;
      }

      if (questStep === 1) {
        // 출발지 선택
        if (answer === 'Current Location') {
          if (location) {
            setPreferences((prev: any) => ({
              ...prev,
              useCurrentLocation: true,
              startLatitude: location.latitude,
              startLongitude: location.longitude,
            }));
            addMessage('Starting from your current location! What travel theme would you like?', 'assistant');
          } else {
            addMessage('Unable to get location information. Please try again.', 'assistant');
            return;
          }
        } else {
          setPreferences((prev: any) => ({
            ...prev,
            useCurrentLocation: false,
            startLocation: answer,
          }));
          addMessage(`Starting from ${answer}! What travel theme would you like?`, 'assistant');
        }
        setQuestStep(2);
        return;
      }

      if (questStep === 2) {
        // 테마 질문
        setPreferences((prev: any) => ({
          ...prev,
          theme: answer,
          category: answer
        }));
        addMessage('Great! Which districts would you like to visit? (You can select multiple)', 'assistant');
        setQuestStep(3);
        return;
      }

      if (questStep === 3) {
        // 자치구 선택 (토글 방식)
        if (answer === 'Done') {
          if (selectedDistricts.length === 0) {
            addMessage('Please select at least 1 district!', 'assistant');
            return;
          }

          // 최종 추천 요청
          const finalPreferences = {
            ...preferences,
            districts: selectedDistricts,
          };
          setPreferences(finalPreferences);

          const districtList = selectedDistricts.join(', ');
          addMessage(`Creating recommended courses for ${districtList}...`, 'assistant');
          setIsLoading(true);

          try {
            const response = await aiStationApi.routeRecommend({
              preferences: finalPreferences,
              latitude: finalPreferences.useCurrentLocation ? location?.latitude : undefined,
              longitude: finalPreferences.useCurrentLocation ? location?.longitude : undefined,
              must_visit_place_id: selectedQuests.length > 0 && finalPreferences.includeCart
                ? selectedQuests[0].place_id ?? undefined
                : undefined,
            });

            if (response.success && response.quests) {
              console.log('🔥 API 응답 quests 개수:', response.quests.length);
              console.log('🔥 API 응답 quests 데이터:', response.quests);

              // 🔥 각 quest에 거리 계산 추가
              const questsWithDistance = response.quests.map((quest: any) => {
                if (location && quest.latitude && quest.longitude) {
                  const distance = mapApi.calculateDistance(
                    location.latitude,
                    location.longitude,
                    quest.latitude,
                    quest.longitude
                  );
                  return { ...quest, distance_km: Number(distance.toFixed(1)) };
                }
                return quest;
              });

              setRouteResults(questsWithDistance); // 🔥 로컬 state에 저장
              storeRouteResults(questsWithDistance); // 🔥 전역 state에 저장
              addMessage(`Recommended courses are ready! (${response.quests.length} places)`, 'assistant');
              addMessage('Please click the button below to view the results!', 'assistant');
              setQuestStep(4);
            } else {
              addMessage('Failed to create recommended courses. Please try again.', 'assistant');
              setQuestStep(0);
            }
          } catch (error) {
            console.error('Route recommend error:', error);
            addMessage('An error occurred. Please try again.', 'assistant');
            setQuestStep(0);
          } finally {
            setIsLoading(false);
          }
        } else {
          // 자치구 토글
          const district = answer;
          setSelectedDistricts(prev => {
            if (prev.includes(district)) {
              // 이미 선택된 경우 제거
              const updated = prev.filter(d => d !== district);
              addMessage(`${district} deselected`, 'assistant');
              return updated;
            } else {
              // 선택되지 않은 경우 추가
              const updated = [...prev, district];
              addMessage(`${district} selected (${updated.length} total)`, 'assistant');
              return updated;
            }
          });
        }
        return;
      }

      if (questStep === 4) {
        // 🔥 결과 보기 / 다시 추천
        if (answer === 'View Results') {
          setViewMode('result'); // 🔥 전체 화면 전환
        } else {
          addMessage('I\'ll recommend again from the beginning!', 'assistant');
          setQuestStep(0);
          setPreferences({});
          setSelectedDistricts([]);
          setRouteResults(null);
          startTravelPlanFlow();
        }
        return;
      }
    },
    [questStep, preferences, location, selectedQuests, selectedDistricts]
  );

  /** --------------------------
   * 🔥 추천 결과 화면 모드
   * -------------------------- */
  if (viewMode === 'result' && routeResults) {
    return (
      <RouteResultList
        places={routeResults}
        onPressPlace={(quest) => {
          // Quest detail 페이지로 이동 (quest 객체를 JSON으로 전달)
          router.push({
            pathname: '/(tabs)/map/quest-detail',
            params: { quest: JSON.stringify(quest) }
          });
        }}
        onClose={() => {
          setViewMode('chat');
          clearRouteResults(); // 🔥 전역 state 초기화
        }}
        onStartNavigation={() => {
          // 첫 번째 장소로 네비게이션 시작
          if (routeResults.length > 0) {
            router.push({
              pathname: '/(tabs)/map/quest-detail',
              params: { quest: JSON.stringify(routeResults[0]) }
            });
          }
        }}
      />
    );
  }

  /** --------------------------
   * 🔥 채팅 모드 이하
   * -------------------------- */

  const renderOptions = () => {
    if (isLoading) return null;

    switch (questStep) {
      case 0:
        return (
          <OptionRow
            options={['Include Required', 'Recommend 4 New']}
            onSelect={handleAnswer}
          />
        );
      case 1:
        return (
          <OptionRow
            options={['Current Location', 'Seoul Station', 'Gangnam Station', 'Hongik Univ. Station', 'Myeongdong Station']}
            onSelect={handleAnswer}
          />
        );
      case 2:
        return (
          <OptionRow
            options={['History', 'Nature', 'Culture', 'Events', 'Shopping', 'Food', 'Extreme', 'Activities']}
            onSelect={handleAnswer}
          />
        );
      case 3:
        return (
          <DistrictSelector
            selectedDistricts={selectedDistricts}
            onSelect={handleAnswer}
          />
        );
      case 4:
        return (
          <OptionRow
            options={['View Results', 'Recommend Again']}
            onSelect={handleAnswer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Travel Plan</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => {
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

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B7DFF" />
              <ThemedText style={styles.loadingText}>Creating recommended route...</ThemedText>
            </View>
          )}
        </ScrollView>

        {renderOptions()}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function OptionRow({
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

function DistrictSelector({
  selectedDistricts,
  onSelect,
}: {
  selectedDistricts: string[];
  onSelect: (s: string) => void;
}) {
  const districts = [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  return (
    <View style={districtStyles.container}>
      <View style={districtStyles.grid}>
        {districts.map((district) => {
          const isSelected = selectedDistricts.includes(district);
          return (
            <Pressable
              key={district}
              style={[
                districtStyles.districtButton,
                isSelected && districtStyles.districtButtonSelected
              ]}
              onPress={() => onSelect(district)}
            >
              <ThemedText
                style={[
                  districtStyles.districtText,
                  isSelected && districtStyles.districtTextSelected
                ]}
              >
                {district}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[
          districtStyles.completeButton,
          selectedDistricts.length === 0 && districtStyles.completeButtonDisabled
        ]}
        onPress={() => onSelect('Done')}
        disabled={selectedDistricts.length === 0}
      >
        <ThemedText style={districtStyles.completeButtonText}>
          Done ({selectedDistricts.length})
        </ThemedText>
      </Pressable>
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
    fontSize: 14,
    fontWeight: '500',
  },
});

const districtStyles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  districtButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  districtButtonSelected: {
    backgroundColor: '#5B7DFF',
    borderColor: '#3D5FE0',
  },
  districtText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500',
  },
  districtTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  completeButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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
    fontSize: 15,
  },
  userBubbleText: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
});

