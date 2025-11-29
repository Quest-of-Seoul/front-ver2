import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { File } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

import { Images } from "@/constants/images";
import { aiStationApi } from "@/services/api";

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

const categories = [
  "History",
  "Nature",
  "Culture",
  "Events",
  "Shopping",
  "Food",
  "Extreme",
  "Activities",
];

export default function QuestRecommendationScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryBox, setShowCategoryBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "위치 정보 접근을 허용해주세요.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  const convertToBase64 = async (uri: string) => {
    const file = new File(uri);
    return file.base64();
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert("최대 3개", "이미지는 최대 3개까지 업로드할 수 있습니다.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "사진 앨범 접근을 허용해주세요.");
      return;
    }

    const remainingSlots = 3 - images.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages].slice(0, 3));
    }
  };

  const openCamera = async () => {
    if (images.length >= 3) {
      Alert.alert("최대 3개", "이미지는 최대 3개까지 업로드할 수 있습니다.");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "카메라 접근을 허용해주세요.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri].slice(0, 3));
    }
  };

  const chooseUploadMethod = () => {
    Alert.alert("이미지 업로드", "이미지를 어떻게 업로드할까요?", [
      { text: "카메라 촬영", onPress: openCamera },
      { text: "앨범에서 선택", onPress: pickImage },
      { text: "취소", style: "cancel" },
    ]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImages([]);
    setSelectedCategory(null);
  };

  const handleRecommend = async () => {
    if (images.length === 0 || !selectedCategory) return;

    setIsLoading(true);

    // 디버깅용 로그
    console.log("API_URL:", API_URL);
    console.log("Request URL:", `${API_URL}/recommend/similar-places`);
    console.log("Images count:", images.length);

    try {
      // 모든 이미지로 검색 후 결과 병합
      const allRecommendations = [];
      const seenPlaceIds = new Set<string>();

      for (const imageUri of images) {
        const base64 = await convertToBase64(imageUri);

        const data = await aiStationApi.similarPlaces({
          image: base64,
          limit: 5,
          quest_only: true,
          latitude: location?.latitude || 37.5665,
          longitude: location?.longitude || 126.978,
          radius_km: 10.0,
        });

        if (data.success && data.recommendations) {
          // 중복 제거하면서 결과 추가
          for (const rec of data.recommendations) {
            const placeId = rec.place_id || rec.quest_id;
            if (placeId && !seenPlaceIds.has(placeId)) {
              seenPlaceIds.add(placeId);
              allRecommendations.push(rec);
            }
          }
        }
      }

      if (allRecommendations.length === 0) {
        throw new Error("추천 결과가 없습니다.");
      }

      // 유사도 기준으로 정렬
      allRecommendations.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      router.push({
        pathname: "/(tabs)/find/recommendation-result",
        params: {
          category: selectedCategory,
          imageUri: images[0], // 첫 번째 이미지를 대표로 사용
          result: JSON.stringify(allRecommendations.slice(0, 10)), // 최대 10개
        },
      });
    } catch (err) {
      console.error("Recommendation error:", err);
      Alert.alert("오류", "추천을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonReady = Boolean(images.length > 0 && selectedCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={["#7EC8E3", "#4A90E2"]} style={styles.headerCard}>
        <TouchableOpacity onPress={() => {
          if (from === "ai-station") {
            router.push("/(tabs)/ai-station");
          } else if (from === "find") {
            router.push("/(tabs)/find");
          } else {
            router.back();
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Image source={Images.docentFace} style={{ width: 60, height: 60, borderRadius: 12 }} />
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.title}>AI Docent Recommendations</Text>
            <Text style={styles.subtitle}>Upload an image and I'll find similar places!</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 40 }}>
        <TouchableOpacity
          style={styles.stackedImagesContainer}
          onPress={images.length === 0 ? chooseUploadMethod : undefined}
          activeOpacity={images.length > 0 ? 1 : 0.7}
        >
          {/* 빈 슬롯들 (뒤에서부터) */}
          {images.length === 0 && (
            <>
              <View style={[styles.imageCard, styles.cardBack3]}>
                <Ionicons name="add" size={40} color="#667" />
              </View>
              <View style={[styles.imageCard, styles.cardBack2]}>
                <Ionicons name="add" size={40} color="#667" />
              </View>
              <View style={[styles.imageCard, styles.cardFront]}>
                <Ionicons name="add" size={40} color="#667" />
                <Text style={styles.uploadText}>Add image of the place{'\n'}up to 3</Text>
              </View>
            </>
          )}

          {/* 이미지가 있을 때 */}
          {images.length > 0 && (
            <View style={styles.imageStackWrapper}>
              {images.map((imageUri, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageCard,
                    index === 0 && styles.cardFront,
                    index === 1 && styles.cardBack2,
                    index === 2 && styles.cardBack3,
                  ]}
                >
                  <Image source={{ uri: imageUri }} style={styles.cardImage} />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* 남은 빈 슬롯 표시 */}
              {images.length < 3 && (
                <TouchableOpacity
                  style={[styles.addMoreButton]}
                  onPress={chooseUploadMethod}
                >
                  <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowCategoryBox(!showCategoryBox)}>
          <Text style={styles.filterToggleText}>Choose a filter for accuracy</Text>
          <Ionicons name={showCategoryBox ? "remove" : "add"} size={26} color="white" />
        </TouchableOpacity>

        {showCategoryBox && (
          <View style={styles.fieldBox}>
            <View style={styles.tags}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.tag, selectedCategory === cat && styles.tagSelected]}
                >
                  <Text style={styles.tagText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isButtonReady && (
          <TouchableOpacity
            style={[styles.buttonActive, isLoading && styles.buttonDisabled]}
            onPress={handleRecommend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Recommend Me!</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#10202F", paddingHorizontal: 20 },
  headerCard: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: { position: "absolute", top: 50, left: 20, padding: 6 },
  headerContent: { flexDirection: "row", marginTop: 40, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: "white" },
  subtitle: { marginTop: 6, color: "white", opacity: 0.9 },
  stackedImagesContainer: {
    height: 200,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  imageStackWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  imageCard: {
    position: "absolute",
    width: "70%",
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#667",
    borderStyle: "dashed",
    backgroundColor: "#1a2a3a",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cardFront: {
    left: 0,
    top: 10,
    zIndex: 3,
    borderStyle: "solid",
    borderColor: "#F47A3A",
  },
  cardBack2: {
    left: 65,
    top: 10,
    zIndex: 2,
    opacity: 0.95,
  },
  cardBack3: {
    left: 130,
    top: 10,
    zIndex: 1,
    opacity: 0.9,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadInner: { justifyContent: "center", alignItems: "center" },
  uploadText: { marginTop: 10, color: "#aaa", textAlign: "center", fontSize: 13 },
  addMoreButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#F47A3A",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButton: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  filterToggle: {
    borderWidth: 1,
    borderColor: "#667",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterToggleText: { color: "#ccc", fontSize: 16 },
  fieldBox: { marginBottom: 20, marginTop: 10 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: { backgroundColor: "#F47A3A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagText: { color: "white", fontWeight: "600", fontSize: 14 },
  tagSelected: { borderWidth: 2, borderColor: "white" },
  buttonActive: {
    backgroundColor: "#F47A3A",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
});