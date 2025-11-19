import TigerIcon from "@/assets/images/tiger.png";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { questApi, type Quest } from "@/services/api";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Defs,
  G,
  Path,
  RadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { WebView } from "react-native-webview";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function MapScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuests, setSelectedQuests] = useState<Quest[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const webViewRef = useRef<WebView>(null);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );
  const kakaoMapJsKey = Constants.expoConfig?.extra?.kakaoMapJsKey;

  console.log("Kakao Map JS Key:", kakaoMapJsKey);

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
      const selectedIds = selectedQuests.map((q) => q.id);
      webViewRef.current.injectJavaScript(`
        if (typeof updateSelectedQuests === 'function') {
          updateSelectedQuests(${JSON.stringify(selectedIds)});
        }
        true;
      `);
    }
  };

  const addQuestToSelection = (quest: Quest) => {
    if (
      selectedQuests.length < 4 &&
      !selectedQuests.find((q) => q.id === quest.id)
    ) {
      setSelectedQuests([...selectedQuests, quest]);
      closeModal();
    }
  };

  const removeQuestFromSelection = (questId: number) => {
    setSelectedQuests(selectedQuests.filter((q) => q.id !== questId));
  };

  // 선택된 퀘스트가 변경될 때마다 WebView에 업데이트
  useEffect(() => {
    if (webViewRef.current && !loading) {
      const selectedIds = selectedQuests.map((q) => q.id);
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
      if (status !== "granted") {
        setError("위치 권한이 거부되었습니다.");
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
      console.error("Location tracking error:", err);
      setError("위치를 가져오는데 실패했습니다.");
    }
  };

  const fetchQuests = async () => {
    try {
      const questList = await questApi.getQuestList();
      console.log("Fetched quests:", questList);
      setQuests(questList);
    } catch (err) {
      console.error("Failed to fetch quests:", err);
      setError("퀘스트 데이터를 불러오는데 실패했습니다.");
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
      {/* 🔵 헤더 전체 */}
      <View style={styles.fullHeader}>
        {/* 검색 + walk + mint */}
        <View style={styles.topRow}>
          <View style={styles.searchBox}>
            <Svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={styles.searchIcon}
            >
              <Path
                d="M15.1753 4.32863C14.0003 3.15758 12.4092 2.5 10.7504 2.5C9.0916 2.5 7.50043 3.15758 6.32546 4.32863C5.41627 5.23994 4.80963 6.40903 4.58797 7.67716C4.3663 8.94528 4.54037 10.251 5.08648 11.4167L2.68227 13.8212C2.47232 14.015 2.30371 14.2492 2.18654 14.5098C2.06937 14.7704 2.00605 15.052 2.00041 15.3377C1.99478 15.6234 2.04692 15.9072 2.15373 16.1722C2.26053 16.4372 2.4198 16.6779 2.62195 16.8798C2.82409 17.0817 3.06493 17.2407 3.33004 17.3472C3.59516 17.4537 3.87908 17.5055 4.16471 17.4995C4.45035 17.4935 4.73181 17.4299 4.99223 17.3124C5.25265 17.1948 5.48665 17.0259 5.68016 16.8157L8.08438 14.4112C8.91749 14.8022 9.82643 15.0049 10.7467 15.005C11.5694 15.0046 12.3839 14.8415 13.1433 14.525C13.9027 14.2086 14.592 13.745 15.1716 13.1611C16.3425 11.986 17 10.3946 17 8.73562C17 7.07663 16.3425 5.48528 15.1716 4.31017L15.1753 4.32863ZM14.4157 10.2697C14.0402 11.1836 13.3381 11.9251 12.4462 12.3498C11.5543 12.7746 10.5362 12.8523 9.59014 12.5678C8.64407 12.2834 7.83768 11.6571 7.3278 10.8109C6.81793 9.96461 6.64105 8.95894 6.83163 7.98949C7.0222 7.02004 7.56657 6.15612 8.35882 5.5659C9.15107 4.97569 10.1345 4.70136 11.1179 4.79628C12.1012 4.89119 13.0141 5.34861 13.6788 6.07947C14.3436 6.81032 14.7127 7.76238 14.7144 8.75038C14.7151 9.27151 14.6136 9.78766 14.4157 10.2697Z"
                fill="#34495E"
              />
            </Svg>
            <Text style={styles.searchText}>District & Places</Text>
          </View>

          <View style={styles.walkBox}>
            <View style={styles.statColumn}>
              <Svg width="14" height="19" viewBox="0 0 14 19" fill="none">
                <Path
                  d="M4.5858 18.8191L3.41542 18.9879C2.81182 19.0742 1.78496 18.6936 1.70399 18.0461C1.62302 17.4026 2.51737 16.7434 3.12097 16.6531L4.29138 16.4844C4.89498 16.3981 5.92185 16.7827 6.00282 17.4301C6.08379 18.0736 5.1894 18.7328 4.5858 18.8191Z"
                  fill="white"
                  opacity="0.95"
                />
                <Path
                  d="M3.76134 15.6447L3.42645 15.6918C2.1162 15.8802 0.603508 14.9463 0.426844 13.5533L0.0219997 10.3554C-0.0205015 10.0237 -0.00130306 9.68644 0.0785638 9.36275C0.158431 9.03906 0.297396 8.73531 0.487452 8.46891C0.677508 8.20251 0.914951 7.97869 1.18621 7.81021C1.45748 7.64172 1.75722 7.53187 2.06833 7.48699L3.02525 7.34966C3.33657 7.30438 3.65322 7.32505 3.95705 7.41044C4.26088 7.49584 4.54593 7.6443 4.79585 7.84733C5.04577 8.05036 5.25567 8.30395 5.41352 8.59359C5.57136 8.88324 5.67405 9.20326 5.7157 9.53528L6.12055 12.7332C6.29721 14.134 5.06792 15.4642 3.76134 15.6447Z"
                  fill="white"
                  opacity="0.95"
                />
                <Path
                  d="M10.309 11.6502L9.13492 11.5286C8.52764 11.4658 7.6112 10.8419 7.66273 10.1945C7.72161 9.54703 8.73373 9.11934 9.34101 9.18213L10.5151 9.30374C11.1224 9.37045 12.0388 9.99436 11.9873 10.6418C11.9247 11.2892 10.9126 11.7208 10.309 11.6502Z"
                  fill="white"
                  opacity="0.95"
                />
                <Path
                  d="M10.1838 8.36199L9.84521 8.32669C8.53128 8.19328 7.2689 6.91413 7.38667 5.5133L7.6774 2.30356C7.70782 1.97015 7.79958 1.64641 7.94737 1.3508C8.09517 1.0552 8.2961 0.793527 8.53876 0.580733C8.78142 0.367938 9.06104 0.208185 9.36161 0.110606C9.66218 0.0130264 9.97782 -0.0204648 10.2905 0.0120301L11.2512 0.110127C11.8821 0.1766 12.4624 0.507317 12.8648 1.02969C13.2671 1.55206 13.4585 2.22335 13.3969 2.89607L13.1061 6.10576C12.9773 7.50659 11.4978 8.49933 10.1838 8.36199Z"
                  fill="white"
                  opacity="0.95"
                />
              </Svg>
              <Text style={styles.statLabel}>walk</Text>
            </View>
            <Text style={styles.statValue}>0.1</Text>
          </View>

          <View style={styles.mintBox}>
            <View style={styles.statColumn}>
              <Svg width="26" height="16" viewBox="0 0 26 16" fill="none">
                <Path
                  d="M26 7.93746V8.44855C26 9.17179 25.5789 9.78656 24.9296 10.2012C25.7342 10.8232 26.1647 11.7441 25.92 12.612L25.7765 13.0942C25.3813 14.4804 23.4241 15.0108 21.7773 14.1815L20.2812 13.4317C19.8558 13.2212 19.4801 12.9185 19.1802 12.5445C18.9389 12.8886 18.6698 13.2111 18.3756 13.5088C17.5932 14.3118 16.6512 14.9326 15.6136 15.3288C14.576 15.7251 13.4673 15.8876 12.363 15.8053C11.2586 15.7229 10.1845 15.3976 9.21383 14.8516C8.24317 14.3055 7.39873 13.5515 6.738 12.641C6.45213 12.9673 6.10695 13.2334 5.72174 13.4245L4.22558 14.1742C2.57885 15.0035 0.631008 14.4732 0.226384 13.0869L0.0828579 12.6048C-0.152389 11.7465 0.268722 10.8256 1.07327 10.194C0.423985 9.77932 0.00288208 9.15732 0.00288208 8.44131V7.93746C0.0132505 7.59598 0.106971 7.26261 0.27546 6.96781C0.443949 6.67301 0.681828 6.42619 0.967388 6.2499C0.261648 5.68577 -0.140606 4.86369 0.0452391 4.05607L0.158153 3.55942C0.471031 2.20455 2.27536 1.54641 3.93856 2.18527L5.49121 2.78556C5.88189 2.93367 6.24297 3.15341 6.55685 3.43406C7.26949 2.36734 8.22692 1.49633 9.34495 0.897587C10.463 0.298841 11.7074 -0.00930872 12.9688 0.000214193C14.2303 0.0097371 15.4701 0.336647 16.5794 0.952207C17.6887 1.56777 18.6335 2.45313 19.3308 3.5305C19.6676 3.20049 20.0683 2.9467 20.507 2.78556L22.0573 2.18527C23.7228 1.54641 25.5248 2.20455 25.8377 3.55942L25.9506 4.05607C26.1365 4.86369 25.7412 5.68577 25.0284 6.2499C25.3153 6.42532 25.5546 6.67178 25.7243 6.96663C25.8941 7.26149 25.9889 7.5953 26 7.93746Z"
                  fill="white"
                  opacity="0.95"
                />
              </Svg>
              <Text style={styles.statLabel}>mint</Text>
            </View>
            <Text style={styles.statValue}>25</Text>
          </View>
        </View>

        {/* ⚙️ 필터 + 카테고리 칩 (한 줄) */}
        <View style={styles.filterCategoryRow}>
          <Svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            style={styles.filterIcon}
          >
            <Path
              d="M26.5625 15H11.1188M5.6675 15H3.4375M5.6675 15C5.6675 14.2773 5.9546 13.5842 6.46563 13.0731C6.97667 12.5621 7.66979 12.275 8.3925 12.275C9.11522 12.275 9.80833 12.5621 10.3194 13.0731C10.8304 13.5842 11.1175 14.2773 11.1175 15C11.1175 15.7227 10.8304 16.4158 10.3194 16.9269C9.80833 17.4379 9.11522 17.725 8.3925 17.725C7.66979 17.725 6.97667 17.4379 6.46563 16.9269C5.9546 16.4158 5.6675 15.7227 5.6675 15ZM26.5625 23.2587H19.3775M19.3775 23.2587C19.3775 23.9816 19.0897 24.6755 18.5786 25.1867C18.0674 25.6978 17.3741 25.985 16.6513 25.985C15.9285 25.985 15.2354 25.6966 14.7244 25.1856C14.2133 24.6746 13.9262 23.9815 13.9262 23.2587M19.3775 23.2587C19.3775 22.5359 19.0897 21.8432 18.5786 21.3321C18.0674 20.8209 17.3741 20.5337 16.6513 20.5337C15.9285 20.5337 15.2354 20.8208 14.7244 21.3319C14.2133 21.8429 13.9262 22.536 13.9262 23.2587M13.9262 23.2587H3.4375M26.5625 6.74124H22.6813M17.23 6.74124H3.4375M17.23 6.74124C17.23 6.01852 17.5171 5.32541 18.0281 4.81437C18.5392 4.30333 19.2323 4.01624 19.955 4.01624C20.3129 4.01624 20.6672 4.08672 20.9978 4.22366C21.3284 4.36061 21.6288 4.56133 21.8819 4.81437C22.1349 5.06741 22.3356 5.36781 22.4726 5.69842C22.6095 6.02904 22.68 6.38338 22.68 6.74124C22.68 7.09909 22.6095 7.45344 22.4726 7.78405C22.3356 8.11466 22.1349 8.41506 21.8819 8.6681C21.6288 8.92114 21.3284 9.12186 20.9978 9.25881C20.6672 9.39575 20.3129 9.46623 19.955 9.46623C19.2323 9.46623 18.5392 9.17914 18.0281 8.6681C17.5171 8.15706 17.23 7.46395 17.23 6.74124Z"
              stroke="white"
              strokeWidth="1.875"
              strokeMiterlimit="10"
              strokeLinecap="round"
            />
          </Svg>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>History</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>Nature</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>Culture</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>Events</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>Shopping</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>Food</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>Extreme</Text>
            </View>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>Activities</Text>
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.questTooltip}>
        <View style={styles.questLeft}>
          {/* SVG 자리 */}
          <Image
            source={TigerIcon}
            style={{
              width: 75,
              height: 65,
              aspectRatio: 15/13
            }}
            resizeMode="contain"
          />
        </View>

        <View style={styles.questRight}>
          <Text style={styles.questTitle}>Add to your Quest List!</Text>
          <Text style={styles.questDesc}>
            Touch the marker in the map{"\n"}I’ll show you the detail
          </Text>
        </View>
      </View>

      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: kakaoMapHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoad={() => {
          console.log("WebView loaded");
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
          console.error("WebView error:", nativeEvent);
          setError(nativeEvent.description);
          setLoading(false);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log("Message from WebView:", data);
            if (data.type === "error") {
              setError(data.message);
            } else if (data.type === "questClick") {
              console.log("Quest clicked:", data.quest);
              openQuestModal(data.quest);
            }
          } catch (e) {
            console.log("WebView message:", event.nativeEvent.data);
          }
        }}
      />
      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            지도를 불러오는 중...
          </ThemedText>
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
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: slideAnim }] },
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
                      <ThemedText style={styles.modalMetaLabel}>
                        📏 3.5km
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.modalMetaItem}>
                      <ThemedText style={styles.modalMetaLabel}>
                        💰 {selectedQuest.reward_point}
                      </ThemedText>
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
                      <ThemedText style={styles.modalAddButtonText}>
                        +
                      </ThemedText>
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
              <RadialGradient
                id="paint0_radial_72_5040"
                cx="0.5"
                cy="0.5"
                r="0.5"
              >
                <Stop offset="0" stopColor="white" />
                <Stop offset="1" stopColor="white" stopOpacity="0.85" />
              </RadialGradient>
              <SvgLinearGradient
                id="paint1_linear_72_5040"
                x1="0.5"
                y1="0"
                x2="0.5"
                y2="1"
              >
                <Stop offset="0" stopColor="#659DF2" />
                <Stop offset="1" stopColor="#659DF2" stopOpacity="0.85" />
              </SvgLinearGradient>
            </Defs>
            <G>
              <Path
                d="M24 40C35.0457 40 44 31.0457 44 20C44 8.95431 35.0457 0 24 0C12.9543 0 4 8.95431 4 20C4 31.0457 12.9543 40 24 40Z"
                fill="url(#paint0_radial_72_5040)"
              />
              <Path
                d="M24 0.5C34.7696 0.5 43.5 9.23045 43.5 20C43.5 30.7696 34.7696 39.5 24 39.5C13.2304 39.5 4.5 30.7696 4.5 20C4.5 9.23045 13.2304 0.5 24 0.5Z"
                stroke="white"
              />
            </G>
            <G>
              <Path
                d="M15.9951 17.9652L29.8963 11.2817C31.7475 10.5681 32.4201 11.2237 31.7417 13.0976L25.3086 26.9868C25.1937 27.3037 24.9791 27.5739 24.6977 27.756C24.4162 27.938 24.0833 28.022 23.75 27.9951C23.4168 27.9681 23.1015 27.8316 22.8524 27.6065C22.6033 27.3815 22.4341 27.0802 22.3708 26.749C21.9224 24.4283 18.9559 21.4288 16.6218 20.9937L16.2423 20.9183C15.9148 20.8562 15.6164 20.6875 15.393 20.4379C15.1696 20.1884 15.0335 19.8717 15.0054 19.5366C14.9774 19.2015 15.0589 18.8664 15.2377 18.5825C15.4165 18.2987 15.6825 18.0818 15.9951 17.9652Z"
                fill="url(#paint1_linear_72_5040)"
              />
            </G>
          </Svg>
        </Pressable>
      </View>

      {/* Bottom Route Selection Bar */}
      <View style={styles.routeContainer} pointerEvents="box-none">
        <LinearGradient
          colors={["#FF7F50", "#994C30"]}
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
                console.log("START pressed", selectedQuests);
              }
            }}
            disabled={selectedQuests.length === 0}
          >
            <Text style={styles.startButtonText}>START</Text>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.3)",
  },
  errorText: {
    marginTop: 8,
    textAlign: "center",
  },
  // Current location button styles
  locationButtonContainer: {
    position: "absolute",
    bottom: 117, // 73px (bar height) + 30px (bottom margin) + 14px (gap)
    right: 20,
    zIndex: 1001,
    elevation: 1001,
  },
  locationButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  locationButtonIcon: {
    width: 48,
    height: 48,
  },
  // New compact route bar styles
  routeContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  routeBar: {
    width: 325,
    height: 73,
    borderRadius: 20,
    paddingHorizontal: 8.68,
    paddingVertical: 6.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4.82,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  questSlotsContainer: {
    flexDirection: "row",
    gap: 4.82,
  },
  questSlot: {
    width: 58,
    height: 60,
    backgroundColor: "#EF6A39",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  questSlotFilled: {
    backgroundColor: "#EF6A39",
  },
  slotQuestName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 2,
  },
  slotQuestPoints: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  slotPlusIcon: {
    fontSize: 32,
    fontWeight: "300",
    color: "#fff",
    textAlign: "center",
    lineHeight: 32,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  startButton: {
    width: 58,
    height: 60,
    backgroundColor: "#EF6A39",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(154, 77, 49, 0.46)",
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  modalContent: {
    height: MODAL_HEIGHT,
  },
  modalInner: {
    height: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  modalQuestImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
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
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalQuestLocation: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  modalQuestMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  modalMetaItem: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalMetaLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalQuestDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  modalAddButton: {
    width: 60,
    height: 60,
    backgroundColor: "rgba(244, 129, 84, 0.85)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAddButtonText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#fff",
  },
  modalRelatedButton: {
    flex: 1,
    height: 60,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalRelatedButtonText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },

  /* -----------------------
   FULL HEADER
------------------------*/
  fullHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 176,
    backgroundColor: "#659DF2",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    zIndex: 999,
    elevation: 999,
  },

  /* -----------------------
   TOP ROW (search + walk + mint)
------------------------*/
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchBox: {
    flex: 1,
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: { marginRight: 8 },
  searchText: { fontSize: 16, fontWeight: "500" },

  walkBox: {
    width: 76,
    height: 47,
    backgroundColor: "#4888D3",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  mintBox: {
    width: 76,
    height: 47,
    backgroundColor: "#76C7AD",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  statColumn: {
    width: 26,
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },

  statLabel: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "500",
    lineHeight: 10,
    letterSpacing: 0,
  },

  statValue: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0,
  },

  /* -----------------------
   FILTER ROW
------------------------*/
  filterRow: {
    marginTop: 12,
    marginBottom: 8,
  },

  /* -----------------------
   CATEGORY SCROLL
------------------------*/
  categoryScroll: {
    flexGrow: 0,
  },

  /* 필터 + 카테고리 칩 한 줄 */
  filterCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  filterIcon: {
    marginRight: 20,
  },

  categoryChip: {
    backgroundColor: "#FF7F50",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 42,
    marginRight: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  categoryText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  /* --------------------------
   QUEST TOOLTIP (Tiger Box)
---------------------------*/
  questTooltip: {
    position: "absolute",
    top: 190, // fullHeader 아래에 자연스럽게 배치
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FEF5E7",
    backgroundColor: "rgba(254, 245, 231, 0.85)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
    backdropFilter: "blur(4px)", // Web에서는 되지만 RN은 구현 못 함 → 생략됨
  },

  questLeft: {
    width: 75,
    height: 65,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  questRight: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
  },

  questTitle: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.18,
  },

  questDesc: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.16,
  },
});
