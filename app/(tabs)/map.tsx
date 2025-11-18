import { StyleSheet, ActivityIndicator, ScrollView, Pressable, Modal, Animated, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { questApi, type Quest } from '@/services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function MapScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuests, setSelectedQuests] = useState<Quest[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const webViewRef = useRef<WebView>(null);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const kakaoMapJsKey = Constants.expoConfig?.extra?.kakaoMapJsKey;

  console.log('Kakao Map JS Key:', kakaoMapJsKey);

  useEffect(() => {
    fetchQuests();
    startLocationTracking();

    return () => {
      // Cleanup location tracking
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, slideAnim]);

  const openQuestModal = (quest: Quest) => {
    setSelectedQuest(quest);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedQuest(null), 300);
  };

  const addQuestToSelection = (quest: Quest) => {
    if (selectedQuests.length < 4 && !selectedQuests.find(q => q.id === quest.id)) {
      setSelectedQuests([...selectedQuests, quest]);
      closeModal();
    }
  };

  const removeQuestFromSelection = (questId: number) => {
    setSelectedQuests(selectedQuests.filter(q => q.id !== questId));
  };

  const startLocationTracking = async () => {
    try {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('위치 권한이 거부되었습니다.');
        return;
      }

      // 현재 위치 가져오기
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // 지도 중심을 현재 위치로 이동
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (typeof map !== 'undefined') {
            var moveLatLon = new kakao.maps.LatLng(${location.coords.latitude}, ${location.coords.longitude});
            map.setCenter(moveLatLon);
          }
          true;
        `);
      }

      // 실시간 위치 추적 시작
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // 1초마다 업데이트
          distanceInterval: 1, // 1m 이동시 업데이트
        },
        (newLocation) => {
          const newCoords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setUserLocation(newCoords);

          // 지도 중심을 새 위치로 부드럽게 이동 + 내 위치 마커 업데이트
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (typeof map !== 'undefined') {
                var moveLatLon = new kakao.maps.LatLng(${newCoords.latitude}, ${newCoords.longitude});
                map.panTo(moveLatLon);

                // 내 위치 마커 업데이트
                if (typeof userMarker !== 'undefined') {
                  userMarker.setMap(null);
                }

                var markerContent = document.createElement('div');
                markerContent.style.cssText =
                  'width: 20px;' +
                  'height: 20px;' +
                  'background-color: #4285F4;' +
                  'border: 3px solid white;' +
                  'border-radius: 50%;' +
                  'box-shadow: 0 2px 4px rgba(0,0,0,0.3);';

                userMarker = new kakao.maps.CustomOverlay({
                  position: moveLatLon,
                  content: markerContent,
                  zIndex: 999
                });
                userMarker.setMap(map);
              }
              true;
            `);
          }
        }
      );
    } catch (err) {
      console.error('Location tracking error:', err);
      setError('위치를 가져오는데 실패했습니다.');
    }
  };

  const fetchQuests = async () => {
    try {
      const questList = await questApi.getQuestList();
      console.log('Fetched quests:', questList);
      setQuests(questList);
    } catch (err) {
      console.error('Failed to fetch quests:', err);
      setError('퀘스트 데이터를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    if (quests.length > 0 && webViewRef.current && !loading) {
      // WebView가 로드된 후 마커 추가
      const questsJson = JSON.stringify(quests);
      // 약간의 지연을 두고 마커 추가 (지도 초기화 완료 후)
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (typeof addQuestMarkers === 'function') {
            addQuestMarkers(${questsJson});
          }
          true;
        `);
      }, 500);
    }
  }, [quests, loading]);

  const kakaoMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Kakao Map</title>
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapJsKey}"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map;
        var markers = [];
        var userMarker;

        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: 'Starting map initialization' }));

          if (typeof kakao === 'undefined') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Kakao SDK not loaded' }));
          } else {
            var container = document.getElementById('map');
            var options = {
              center: new kakao.maps.LatLng(37.5665, 126.9780),
              level: 5
            };
            map = new kakao.maps.Map(container, options);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', message: 'Map loaded successfully' }));
          }
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.toString() }));
        }

        // 퀘스트 마커 추가 함수
        function addQuestMarkers(quests) {
          try {
            // 기존 마커 제거
            markers.forEach(marker => marker.setMap(null));
            markers = [];

            // 난이도별 색상
            const difficultyColors = {
              easy: '#4CAF50',
              medium: '#FF9800',
              hard: '#F44336'
            };

            quests.forEach((quest, index) => {
              var markerPosition = new kakao.maps.LatLng(quest.latitude, quest.longitude);

              // 커스텀 마커 이미지 생성
              var markerContent = document.createElement('div');
              markerContent.style.cssText =
                'background-color: ' + (difficultyColors[quest.difficulty] || '#4CAF50') + ';' +
                'padding: 8px 12px;' +
                'border-radius: 20px;' +
                'color: white;' +
                'font-weight: bold;' +
                'font-size: 12px;' +
                'box-shadow: 0 2px 4px rgba(0,0,0,0.3);' +
                'white-space: nowrap;' +
                'cursor: pointer;' +
                'user-select: none;' +
                '-webkit-user-select: none;';
              markerContent.innerHTML = quest.reward_point + 'P';
              markerContent.setAttribute('data-quest-id', quest.id);

              // 클릭 이벤트 추가 (클로저 문제 해결)
              markerContent.addEventListener('click', (function(questData) {
                return function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Marker clicked:', questData.name);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'questClick',
                    quest: questData
                  }));
                };
              })(quest));

              var customOverlay = new kakao.maps.CustomOverlay({
                position: markerPosition,
                content: markerContent,
                yAnchor: 1,
                clickable: true
              });

              customOverlay.setMap(map);
              markers.push(customOverlay);
            });

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              message: 'Added ' + quests.length + ' markers'
            }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Failed to add markers: ' + e.toString()
            }));
          }
        }
      </script>
    </body>
    </html>
  `;

  if (!kakaoMapJsKey) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">Error</ThemedText>
          <ThemedText style={styles.errorText}>
            Kakao Map API Key가 설정되지 않았습니다.
          </ThemedText>
          <ThemedText style={styles.errorText}>
            .env 파일을 확인해주세요.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: kakaoMapHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoad={() => {
          console.log('WebView loaded');
          setLoading(false);
          // WebView 로드 후 퀘스트가 있으면 마커 추가
          if (quests.length > 0) {
            const questsJson = JSON.stringify(quests);
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(`
                if (typeof addQuestMarkers === 'function') {
                  addQuestMarkers(${questsJson});
                }
                true;
              `);
            }, 500);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setError(nativeEvent.description);
          setLoading(false);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('Message from WebView:', data);
            if (data.type === 'error') {
              setError(data.message);
            } else if (data.type === 'questClick') {
              console.log('Quest clicked:', data.quest);
              openQuestModal(data.quest);
            }
          } catch (e) {
            console.log('WebView message:', event.nativeEvent.data);
          }
        }}
      />
      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>지도를 불러오는 중...</ThemedText>
        </ThemedView>
      )}
      {error && (
        <ThemedView style={styles.errorOverlay}>
          <ThemedText type="subtitle">Error</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}

      {/* Quest Detail Modal - Below cards */}
      {modalVisible && selectedQuest && (
        <Pressable
          style={styles.modalBackdrop}
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ThemedView style={styles.modalInner}>
                {/* Modal Handle */}
                <ThemedView style={styles.modalHandle} />

                {/* Quest Image */}
                <ThemedView style={styles.modalQuestImage}>
                  <ThemedText style={styles.modalQuestImageText}>🏛️</ThemedText>
                </ThemedView>

                {/* Quest Info */}
                <ThemedView style={styles.modalQuestInfo}>
                  <ThemedText type="title" style={styles.modalQuestName}>
                    {selectedQuest.name}
                  </ThemedText>

                  <ThemedText style={styles.modalQuestLocation}>
                    📍 Jongno-gu
                  </ThemedText>

                  <ThemedView style={styles.modalQuestMeta}>
                    <ThemedView style={styles.modalMetaItem}>
                      <ThemedText style={styles.modalMetaLabel}>📏 3.5km</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.modalMetaItem}>
                      <ThemedText style={styles.modalMetaLabel}>💰 {selectedQuest.reward_point}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedText style={styles.modalQuestDescription}>
                    {selectedQuest.description}
                  </ThemedText>

                  {/* Action Buttons */}
                  <ThemedView style={styles.modalActions}>
                    <Pressable
                      style={styles.modalAddButton}
                      onPress={() => addQuestToSelection(selectedQuest)}
                    >
                      <ThemedText style={styles.modalAddButtonText}>+</ThemedText>
                    </Pressable>
                    <Pressable style={styles.modalRelatedButton}>
                      <ThemedText style={styles.modalRelatedButtonText}>
                        See Related Places
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </Pressable>
          </Animated.View>
        </Pressable>
      )}

      {/* Bottom Card Panel - Always on top */}
      <ThemedView style={styles.bottomPanel} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardContainer}
        >
          {/* 4 Cards - Empty or Filled */}
          {[0, 1, 2, 3].map((index) => {
            const quest = selectedQuests[index];
            return (
              <Pressable
                key={index}
                style={quest ? styles.filledCard : styles.emptyCard}
                onPress={() => quest && removeQuestFromSelection(quest.id)}
              >
                {quest ? (
                  <ThemedView style={styles.cardContent}>
                    <ThemedText style={styles.cardQuestName} numberOfLines={2}>
                      {quest.name}
                    </ThemedText>
                    <ThemedText style={styles.cardQuestPoints}>
                      {quest.reward_point}P
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedText style={styles.plusIcon}>+</ThemedText>
                )}
              </Pressable>
            );
          })}

          {/* START Button */}
          <Pressable
            style={styles.startButton}
            onPress={() => console.log('START pressed', selectedQuests)}
          >
            <ThemedText style={styles.startText}>START</ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 1000,
    elevation: 1000,
  },
  cardContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  emptyCard: {
    width: 100,
    height: 120,
    backgroundColor: 'rgba(244, 129, 84, 0.85)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filledCard: {
    width: 100,
    height: 120,
    backgroundColor: 'rgba(244, 129, 84, 1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    padding: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardQuestName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  cardQuestPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  plusIcon: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    opacity: 0.9,
  },
  startButton: {
    width: 100,
    height: 120,
    backgroundColor: 'rgba(244, 129, 84, 0.6)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(139, 69, 19, 0.5)',
    letterSpacing: 1,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  modalContent: {
    height: MODAL_HEIGHT,
  },
  modalInner: {
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalQuestImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalQuestImageText: {
    fontSize: 80,
  },
  modalQuestInfo: {
    paddingHorizontal: 24,
  },
  modalQuestName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalQuestLocation: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  modalQuestMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  modalMetaItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalMetaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalQuestDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modalAddButton: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(244, 129, 84, 0.85)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddButtonText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
  },
  modalRelatedButton: {
    flex: 1,
    height: 60,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRelatedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
});
