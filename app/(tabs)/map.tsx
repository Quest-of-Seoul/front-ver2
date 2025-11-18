import { StyleSheet, ActivityIndicator, Pressable, Animated, Dimensions, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, RadialGradient, Stop, G, LinearGradient as SvgLinearGradient } from 'react-native-svg';
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

    // 클릭한 마커를 주황색으로 변경
    if (webViewRef.current && !loading) {
      webViewRef.current.injectJavaScript(`
        if (typeof highlightMarker === 'function') {
          highlightMarker(${quest.id});
        }
        true;
      `);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedQuest(null), 300);

    // 모달 닫을 때 하이라이트 제거
    if (webViewRef.current && !loading) {
      const selectedIds = selectedQuests.map(q => q.id);
      webViewRef.current.injectJavaScript(`
        if (typeof updateSelectedQuests === 'function') {
          updateSelectedQuests(${JSON.stringify(selectedIds)});
        }
        true;
      `);
    }
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

  // 선택된 퀘스트가 변경될 때마다 WebView에 업데이트
  useEffect(() => {
    if (webViewRef.current && !loading) {
      const selectedIds = selectedQuests.map(q => q.id);
      webViewRef.current.injectJavaScript(`
        if (typeof updateSelectedQuests === 'function') {
          updateSelectedQuests(${JSON.stringify(selectedIds)});
        }
        true;
      `);
    }
  }, [selectedQuests, loading]);

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

      // 지도 중심을 현재 위치로 이동 + 초기 마커 생성
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (typeof map !== 'undefined') {
            var moveLatLon = new kakao.maps.LatLng(${location.coords.latitude}, ${location.coords.longitude});
            map.setCenter(moveLatLon);

            // 기존 마커가 있으면 제거
            if (typeof userMarker !== 'undefined' && userMarker !== null) {
              userMarker.setMap(null);
            }

            // 초기 내 위치 마커 생성 (SVG 아이콘 사용)
            var markerContent = document.createElement('div');
            markerContent.innerHTML = \`
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#filter0_d)">
                  <path d="M24 40C35.0457 40 44 31.0457 44 20C44 8.95431 35.0457 0 24 0C12.9543 0 4 8.95431 4 20C4 31.0457 12.9543 40 24 40Z" fill="url(#paint0_radial)" shape-rendering="crispEdges"/>
                  <path d="M24 0.5C34.7696 0.5 43.5 9.23045 43.5 20C43.5 30.7696 34.7696 39.5 24 39.5C13.2304 39.5 4.5 30.7696 4.5 20C4.5 9.23045 13.2304 0.5 24 0.5Z" stroke="white" shape-rendering="crispEdges"/>
                </g>
                <g filter="url(#filter1_i)">
                  <path d="M23.998 5C24.5528 5.00015 25.0028 5.45084 25.0029 6.00684V9.42871C26.3034 9.54737 27.5803 9.89474 28.7715 10.4658C30.8319 11.4536 32.5349 13.0568 33.6455 15.0537C34.3273 16.2798 34.7642 17.6176 34.9434 18.9932H37.9932C38.5493 18.9932 39 19.4432 39 19.998C38.9998 20.5528 38.5492 21.0029 37.9932 21.0029H35.0195C35.0087 21.207 34.9939 21.4113 34.9717 21.6152C34.6966 24.1128 33.5784 26.4419 31.8018 28.2188C30.0249 29.9956 27.695 31.1145 25.1973 31.3896C25.1326 31.3967 25.0676 31.4003 25.0029 31.4062V33.9932C25.0029 34.5492 24.5528 34.9999 23.998 35C23.4432 35 22.9932 34.5493 22.9932 33.9932V31.4062C21.4712 31.2668 19.9864 30.814 18.6367 30.0635C16.6397 28.9529 15.0357 27.2499 14.0479 25.1895C13.4157 23.8709 13.0572 22.4472 12.9805 21.0029H10.0068C9.45085 21.0028 9.00016 20.5528 9 19.998C9 19.4432 9.45075 18.9933 10.0068 18.9932H13.0566C13.0755 18.8485 13.0965 18.7038 13.1211 18.5596C13.5058 16.3072 14.5806 14.23 16.1963 12.6143C17.812 10.9985 19.8893 9.92387 22.1416 9.53906C22.4245 9.49073 22.7088 9.45281 22.9932 9.42676V6.00684C22.9933 5.45075 23.4432 5 23.998 5ZM13.377 21.0029C13.3991 21.406 13.4443 21.8091 13.5127 22.21C13.8834 24.3812 14.919 26.3839 16.4766 27.9414C18.0341 29.4989 20.0367 30.5346 22.208 30.9053C22.469 30.9498 22.731 30.9839 22.9932 31.0088V27.4277C19.7483 26.9658 17.2135 24.3057 16.9434 21.0029H13.377ZM31.0566 21.0029C30.7863 24.3071 28.2497 26.9674 25.0029 27.4277V31.0078C26.2437 30.8901 27.4618 30.556 28.5986 30.0107C30.5847 29.0581 32.2258 27.5122 33.2959 25.5869C34.0821 24.1722 34.5302 22.604 34.6182 21.0029H31.0566ZM25.0029 13.4072C27.9698 13.8278 30.3457 16.0856 30.9395 18.9932H34.5371C34.2237 16.689 33.1664 14.5473 31.5186 12.8994C29.8067 11.1875 27.5617 10.1108 25.1553 9.8457C25.1045 9.84015 25.0537 9.83587 25.0029 9.83105V13.4072ZM22.9932 9.83008C21.5391 9.9681 20.1213 10.405 18.8311 11.1221C16.9057 12.1921 15.3598 13.8333 14.4072 15.8193C13.9239 16.8271 13.6061 17.8986 13.458 18.9932H17.0605C17.654 16.0869 20.0281 13.8293 22.9932 13.4072V9.83008Z" fill="#FF7F50"/>
                </g>
                <defs>
                  <filter id="filter0_d" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="4"/>
                    <feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                  </filter>
                  <filter id="filter1_i" x="9" y="5" width="30" height="34" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="4"/>
                    <feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
                  </filter>
                  <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 20) rotate(90) scale(20)">
                    <stop stop-color="white"/>
                    <stop offset="1" stop-color="white" stop-opacity="0.85"/>
                  </radialGradient>
                </defs>
              </svg>
            \`;
            markerContent.style.cssText = 'width: 40px; height: 40px;';

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

                // 내 위치 마커 업데이트 (기존 마커 제거)
                if (typeof userMarker !== 'undefined' && userMarker !== null) {
                  userMarker.setMap(null);
                }

                var markerContent = document.createElement('div');
                markerContent.innerHTML = \`
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_d_rt)">
                      <path d="M24 40C35.0457 40 44 31.0457 44 20C44 8.95431 35.0457 0 24 0C12.9543 0 4 8.95431 4 20C4 31.0457 12.9543 40 24 40Z" fill="url(#paint0_radial_rt)" shape-rendering="crispEdges"/>
                      <path d="M24 0.5C34.7696 0.5 43.5 9.23045 43.5 20C43.5 30.7696 34.7696 39.5 24 39.5C13.2304 39.5 4.5 30.7696 4.5 20C4.5 9.23045 13.2304 0.5 24 0.5Z" stroke="white" shape-rendering="crispEdges"/>
                    </g>
                    <g filter="url(#filter1_i_rt)">
                      <path d="M23.998 5C24.5528 5.00015 25.0028 5.45084 25.0029 6.00684V9.42871C26.3034 9.54737 27.5803 9.89474 28.7715 10.4658C30.8319 11.4536 32.5349 13.0568 33.6455 15.0537C34.3273 16.2798 34.7642 17.6176 34.9434 18.9932H37.9932C38.5493 18.9932 39 19.4432 39 19.998C38.9998 20.5528 38.5492 21.0029 37.9932 21.0029H35.0195C35.0087 21.207 34.9939 21.4113 34.9717 21.6152C34.6966 24.1128 33.5784 26.4419 31.8018 28.2188C30.0249 29.9956 27.695 31.1145 25.1973 31.3896C25.1326 31.3967 25.0676 31.4003 25.0029 31.4062V33.9932C25.0029 34.5492 24.5528 34.9999 23.998 35C23.4432 35 22.9932 34.5493 22.9932 33.9932V31.4062C21.4712 31.2668 19.9864 30.814 18.6367 30.0635C16.6397 28.9529 15.0357 27.2499 14.0479 25.1895C13.4157 23.8709 13.0572 22.4472 12.9805 21.0029H10.0068C9.45085 21.0028 9.00016 20.5528 9 19.998C9 19.4432 9.45075 18.9933 10.0068 18.9932H13.0566C13.0755 18.8485 13.0965 18.7038 13.1211 18.5596C13.5058 16.3072 14.5806 14.23 16.1963 12.6143C17.812 10.9985 19.8893 9.92387 22.1416 9.53906C22.4245 9.49073 22.7088 9.45281 22.9932 9.42676V6.00684C22.9933 5.45075 23.4432 5 23.998 5ZM13.377 21.0029C13.3991 21.406 13.4443 21.8091 13.5127 22.21C13.8834 24.3812 14.919 26.3839 16.4766 27.9414C18.0341 29.4989 20.0367 30.5346 22.208 30.9053C22.469 30.9498 22.731 30.9839 22.9932 31.0088V27.4277C19.7483 26.9658 17.2135 24.3057 16.9434 21.0029H13.377ZM31.0566 21.0029C30.7863 24.3071 28.2497 26.9674 25.0029 27.4277V31.0078C26.2437 30.8901 27.4618 30.556 28.5986 30.0107C30.5847 29.0581 32.2258 27.5122 33.2959 25.5869C34.0821 24.1722 34.5302 22.604 34.6182 21.0029H31.0566ZM25.0029 13.4072C27.9698 13.8278 30.3457 16.0856 30.9395 18.9932H34.5371C34.2237 16.689 33.1664 14.5473 31.5186 12.8994C29.8067 11.1875 27.5617 10.1108 25.1553 9.8457C25.1045 9.84015 25.0537 9.83587 25.0029 9.83105V13.4072ZM22.9932 9.83008C21.5391 9.9681 20.1213 10.405 18.8311 11.1221C16.9057 12.1921 15.3598 13.8333 14.4072 15.8193C13.9239 16.8271 13.6061 17.8986 13.458 18.9932H17.0605C17.654 16.0869 20.0281 13.8293 22.9932 13.4072V9.83008Z" fill="#FF7F50"/>
                    </g>
                    <defs>
                      <filter id="filter0_d_rt" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="4"/>
                        <feGaussianBlur stdDeviation="2"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_rt"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_rt" result="shape"/>
                      </filter>
                      <filter id="filter1_i_rt" x="9" y="5" width="30" height="34" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="4"/>
                        <feGaussianBlur stdDeviation="2"/>
                        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_rt"/>
                      </filter>
                      <radialGradient id="paint0_radial_rt" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 20) rotate(90) scale(20)">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="white" stop-opacity="0.85"/>
                      </radialGradient>
                    </defs>
                  </svg>
                \`;
                markerContent.style.cssText = 'width: 40px; height: 40px;';

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

        // 선택된 퀘스트 ID 목록 (전역)
        var selectedQuestIds = [];
        var highlightedQuestId = null; // 현재 하이라이트된 퀘스트

        // 마커 SVG 생성 함수
        function createMarkerSVG(isSelected) {
          if (isSelected) {
            // 오렌지 버전
            return '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M17.7979 2.04102C18.5471 -0.014178 21.4523 -0.0135671 22.2012 2.04199L26.3242 13.376L26.4043 13.5957L26.624 13.6758L37.958 17.7988V17.7979C40.0139 18.5467 40.0138 21.4522 37.958 22.2012L26.624 26.3242L26.4043 26.4043L26.3242 26.624L22.2012 37.958C21.4522 40.0138 18.5467 40.0139 17.7979 37.958H17.7988L13.6758 26.624L13.5957 26.4043L13.376 26.3242L2.04199 22.2012H2.04102C-0.0138994 21.4517 -0.0135677 18.5466 2.04199 17.7979V17.7988L13.376 13.6758L13.5957 13.5957L13.6758 13.376L17.7988 2.04199L17.7979 2.04102Z" fill="url(#paint0_linear_orange)" stroke="#FF7F50"/>' +
              '<defs>' +
              '<linearGradient id="paint0_linear_orange" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">' +
              '<stop stop-color="#FF7F50"/>' +
              '<stop offset="1" stop-color="#FF7F50" stop-opacity="0.8"/>' +
              '</linearGradient>' +
              '</defs>' +
              '</svg>';
          } else {
            // 블루 버전
            return '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M17.7979 2.04102C18.5471 -0.014178 21.4523 -0.0135671 22.2012 2.04199L26.3242 13.376L26.4043 13.5957L26.624 13.6758L37.958 17.7988V17.7979C40.0139 18.5467 40.0138 21.4522 37.958 22.2012L26.624 26.3242L26.4043 26.4043L26.3242 26.624L22.2012 37.958C21.4522 40.0138 18.5467 40.0139 17.7979 37.958H17.7988L13.6758 26.624L13.5957 26.4043L13.376 26.3242L2.04199 22.2012H2.04102C-0.0138994 21.4517 -0.0135677 18.5466 2.04199 17.7979V17.7988L13.376 13.6758L13.5957 13.5957L13.6758 13.376L17.7988 2.04199L17.7979 2.04102Z" fill="url(#paint0_linear_blue)" stroke="#659DF2"/>' +
              '<defs>' +
              '<linearGradient id="paint0_linear_blue" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">' +
              '<stop stop-color="#659DF2"/>' +
              '<stop offset="1" stop-color="#659DF2" stop-opacity="0.8"/>' +
              '</linearGradient>' +
              '</defs>' +
              '</svg>';
          }
        }

        // 특정 마커 하이라이트 함수 (모달 열 때)
        function highlightMarker(questId) {
          highlightedQuestId = questId;
          // 모든 마커 업데이트
          markers.forEach(function(marker) {
            var markerQuestId = parseInt(marker.getContent().getAttribute('data-quest-id'));
            var isSelected = selectedQuestIds.indexOf(markerQuestId) !== -1;
            var isHighlighted = markerQuestId === questId;
            // 하이라이트되었거나 이미 선택된 마커는 주황색
            marker.getContent().innerHTML = createMarkerSVG(isSelected || isHighlighted);
          });
        }

        // 선택된 퀘스트 업데이트 함수
        function updateSelectedQuests(selectedIds) {
          selectedQuestIds = selectedIds || [];
          // 모든 마커 업데이트 (선택된 퀘스트만 주황색)
          markers.forEach(function(marker) {
            var questId = marker.getContent().getAttribute('data-quest-id');
            var isSelected = selectedQuestIds.indexOf(parseInt(questId)) !== -1;
            marker.getContent().innerHTML = createMarkerSVG(isSelected);
          });
        }

        // 퀘스트 마커 추가 함수
        function addQuestMarkers(quests) {
          try {
            // 기존 마커 제거
            markers.forEach(marker => marker.setMap(null));
            markers = [];

            quests.forEach((quest, index) => {
              var markerPosition = new kakao.maps.LatLng(quest.latitude, quest.longitude);

              // SVG 아이콘 마커 생성
              var markerContent = document.createElement('div');
              var isSelected = selectedQuestIds.indexOf(quest.id) !== -1;
              markerContent.innerHTML = createMarkerSVG(isSelected);
              markerContent.style.cssText =
                'width: 40px;' +
                'height: 40px;' +
                'cursor: pointer;' +
                'user-select: none;' +
                '-webkit-user-select: none;';
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

      {/* Current Location Button */}
      <View style={styles.locationButtonContainer} pointerEvents="box-none">
        <Pressable
          style={styles.locationButton}
          onPress={() => {
            if (userLocation && webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                if (typeof map !== 'undefined') {
                  var moveLatLon = new kakao.maps.LatLng(${userLocation.latitude}, ${userLocation.longitude});
                  map.panTo(moveLatLon);
                }
                true;
              `);
            }
          }}
        >
          <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <Defs>
              <RadialGradient id="paint0_radial_72_5040" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor="white"/>
                <Stop offset="1" stopColor="white" stopOpacity="0.85"/>
              </RadialGradient>
              <SvgLinearGradient id="paint1_linear_72_5040" x1="0.5" y1="0" x2="0.5" y2="1">
                <Stop offset="0" stopColor="#659DF2"/>
                <Stop offset="1" stopColor="#659DF2" stopOpacity="0.85"/>
              </SvgLinearGradient>
            </Defs>
            <G>
              <Path d="M24 40C35.0457 40 44 31.0457 44 20C44 8.95431 35.0457 0 24 0C12.9543 0 4 8.95431 4 20C4 31.0457 12.9543 40 24 40Z" fill="url(#paint0_radial_72_5040)"/>
              <Path d="M24 0.5C34.7696 0.5 43.5 9.23045 43.5 20C43.5 30.7696 34.7696 39.5 24 39.5C13.2304 39.5 4.5 30.7696 4.5 20C4.5 9.23045 13.2304 0.5 24 0.5Z" stroke="white"/>
            </G>
            <G>
              <Path d="M15.9951 17.9652L29.8963 11.2817C31.7475 10.5681 32.4201 11.2237 31.7417 13.0976L25.3086 26.9868C25.1937 27.3037 24.9791 27.5739 24.6977 27.756C24.4162 27.938 24.0833 28.022 23.75 27.9951C23.4168 27.9681 23.1015 27.8316 22.8524 27.6065C22.6033 27.3815 22.4341 27.0802 22.3708 26.749C21.9224 24.4283 18.9559 21.4288 16.6218 20.9937L16.2423 20.9183C15.9148 20.8562 15.6164 20.6875 15.393 20.4379C15.1696 20.1884 15.0335 19.8717 15.0054 19.5366C14.9774 19.2015 15.0589 18.8664 15.2377 18.5825C15.4165 18.2987 15.6825 18.0818 15.9951 17.9652Z" fill="url(#paint1_linear_72_5040)"/>
            </G>
          </Svg>
        </Pressable>
      </View>

      {/* Bottom Route Selection Bar */}
      <View style={styles.routeContainer} pointerEvents="box-none">
        <LinearGradient
          colors={['#FF7F50', '#994C30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.routeBar}
        >
          <View style={styles.questSlotsContainer}>
            {[0, 1, 2, 3].map((index) => {
              const quest = selectedQuests[index];
              return (
                <Pressable
                  key={index}
                  style={[styles.questSlot, quest && styles.questSlotFilled]}
                  onPress={() => quest && removeQuestFromSelection(quest.id)}
                >
                  {quest ? (
                    <>
                      <Text style={styles.slotQuestName} numberOfLines={1}>
                        {quest.name}
                      </Text>
                      <Text style={styles.slotQuestPoints}>
                        {quest.reward_point}P
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.slotPlusIcon}>+</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.startButton}
            onPress={() => {
              if (selectedQuests.length > 0) {
                console.log('START pressed', selectedQuests);
              }
            }}
            disabled={selectedQuests.length === 0}
          >
            <Text style={styles.startButtonText}>
              START
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
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
  // Current location button styles
  locationButtonContainer: {
    position: 'absolute',
    bottom: 117, // 73px (bar height) + 30px (bottom margin) + 14px (gap)
    right: 20,
    zIndex: 1001,
    elevation: 1001,
  },
  locationButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonIcon: {
    width: 48,
    height: 48,
  },
  // New compact route bar styles
  routeContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  routeBar: {
    width: 325,
    height: 73,
    borderRadius: 20,
    paddingHorizontal: 8.68,
    paddingVertical: 6.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  questSlotsContainer: {
    flexDirection: 'row',
    gap: 4.82,
  },
  questSlot: {
    width: 58,
    height: 60,
    backgroundColor: '#EF6A39',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  questSlotFilled: {
    backgroundColor: '#EF6A39',
  },
  slotQuestName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  slotQuestPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  slotPlusIcon: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  startButton: {
    width: 58,
    height: 60,
    backgroundColor: '#EF6A39',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(154, 77, 49, 0.46)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: -0.16,
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
