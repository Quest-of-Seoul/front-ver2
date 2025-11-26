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
  const [image, setImage] = useState<string | null>(null);
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "사진 앨범 접근을 허용해주세요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "카메라 접근을 허용해주세요.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const chooseUploadMethod = () => {
    Alert.alert("이미지 업로드", "이미지를 어떻게 업로드할까요?", [
      { text: "카메라 촬영", onPress: openCamera },
      { text: "앨범에서 선택", onPress: pickImage },
      { text: "취소", style: "cancel" },
    ]);
  };

  const clearImage = () => {
    setImage(null);
    setSelectedCategory(null);
  };

  const handleRecommend = async () => {
    if (!image || !selectedCategory) return;

    setIsLoading(true);
    const base64 = await convertToBase64(image);

    // 디버깅용 로그
    console.log("API_URL:", API_URL);
    console.log("Request URL:", `${API_URL}/recommend/similar-places`);

    try {
      const data = await aiStationApi.similarPlaces({
        image: base64,
        limit: 5,
        quest_only: true,
        latitude: location?.latitude || 37.5665,
        longitude: location?.longitude || 126.978,
        radius_km: 10.0,
      });

      if (!data.success) {
        throw new Error("추천 실패");
      }

      router.push({
        pathname: "/(tabs)/find/recommendation-result",
        params: {
          category: selectedCategory,
          imageUri: image,
          result: JSON.stringify(data.recommendations),
        },
      });
    } catch (err) {
      console.error("Recommendation error:", err);
      Alert.alert("오류", "추천을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonReady = Boolean(image && selectedCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={["#7EC8E3", "#4A90E2"]} style={styles.headerCard}>
        <TouchableOpacity onPress={() => {
          if (from === "ai-station") {
            router.push("/(tabs)/ai-station");
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
        <TouchableOpacity style={styles.uploadBox} onPress={chooseUploadMethod}>
          {image ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity style={styles.closeButton} onPress={clearImage}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadInner}>
              <Ionicons name="images-outline" size={40} color="#888" />
              <Text style={styles.uploadText}>Add an Image of the Place</Text>
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
  uploadBox: {
    borderWidth: 1,
    borderColor: "#667",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 180,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadInner: { justifyContent: "center", alignItems: "center" },
  uploadText: { marginTop: 10, color: "#aaa" },
  previewWrapper: { width: "100%", height: "100%" },
  previewImage: { width: "100%", height: "100%" },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
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