import { StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { questApi, type Quest } from '@/services/api';

export default function MapScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const webViewRef = useRef<WebView>(null);
  const kakaoMapJsKey = Constants.expoConfig?.extra?.kakaoMapJsKey;

  console.log('Kakao Map JS Key:', kakaoMapJsKey);

  useEffect(() => {
    fetchQuests();
  }, []);

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
    if (quests.length > 0 && webViewRef.current) {
      // 퀘스트 데이터를 WebView로 전송
      const questsJson = JSON.stringify(quests);
      webViewRef.current.injectJavaScript(`
        if (typeof addQuestMarkers === 'function') {
          addQuestMarkers(${questsJson});
        }
        true;
      `);
    }
  }, [quests]);

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

            quests.forEach(quest => {
              var markerPosition = new kakao.maps.LatLng(quest.latitude, quest.longitude);

              // 커스텀 마커 이미지 생성
              var markerContent = '<div style="' +
                'background-color: ' + (difficultyColors[quest.difficulty] || '#4CAF50') + ';' +
                'padding: 8px 12px;' +
                'border-radius: 20px;' +
                'color: white;' +
                'font-weight: bold;' +
                'font-size: 12px;' +
                'box-shadow: 0 2px 4px rgba(0,0,0,0.3);' +
                'white-space: nowrap;' +
                'cursor: pointer;' +
                '">' + quest.reward_point + 'P</div>';

              var customOverlay = new kakao.maps.CustomOverlay({
                position: markerPosition,
                content: markerContent,
                yAnchor: 1
              });

              customOverlay.setMap(map);
              markers.push(customOverlay);

              // 클릭 이벤트
              var overlayElement = customOverlay.getContent();
              overlayElement.onclick = function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'questClick',
                  quest: quest
                }));
              };
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
              // TODO: 퀘스트 상세 정보 표시 또는 다른 액션
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
});
