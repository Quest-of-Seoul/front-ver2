import React, { useState, useRef } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useQuestStore } from "@/store/useQuestStore";

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

export default function RecommendationResultScreen() {
  const router = useRouter();
  const { category, imageUri, result } = useLocalSearchParams();
  const allRecommendations = JSON.parse((result as string) || "[]");

  // quest_id가 있는 항목만 필터링
  const recommendations = allRecommendations.filter((item: any) => item.quest_id);

  // 검증 로그
  console.log("=== Recommendation Results ===");
  console.log(`Total recommendations: ${allRecommendations.length}`);
  console.log(`With quest_id: ${recommendations.length}`);
  recommendations.forEach((item: any, index: number) => {
    console.log(`[${index}] Place: ${item.name} | Quest ID: ${item.quest_id} | Place ID: ${item.place_id}`);
  });

  const { width } = useWindowDimensions();
  const cardWidth = width - 60;
  const cardPadding = (width - cardWidth) / 2;
  const [activeIndex, setActiveIndex] = useState(0);

  const { selectedQuests, addQuest, isQuestSelected, removeQuest } = useQuestStore();
  const lastTap = useRef<number>(0);

  const handleAddToCart = (item: any) => {
    if (!item.quest_id) {
      Alert.alert("알림", "이 장소에는 연결된 퀘스트가 없습니다.");
      return;
    }

    console.log("=== Adding to Cart ===");
    console.log(`Place Name: ${item.name}`);
    console.log(`Quest ID: ${item.quest_id}`);
    console.log(`Place ID: ${item.place_id}`);
    console.log(`Image URL: ${item.place_image_url}`);

    const quest = {
      id: item.quest_id,
      place_id: item.place_id,
      name: item.name,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      reward_point: item.reward_point,
      description: item.description,
      district: item.district,
      is_active: true,
      place_image_url: item.place_image_url,
    };

    if (isQuestSelected(quest.id)) {
      Alert.alert("알림", "이미 추가된 퀘스트입니다.");
      return;
    }

    addQuest(quest);
    console.log(`Added to cart: ${quest.name} with image: ${quest.place_image_url}`);
    Alert.alert("성공", `${item.name}이(가) 장바구니에 추가되었습니다.`);
  };

  const handleCardPress = async (item: any) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      // 더블 클릭: 상세 페이지로 이동
      lastTap.current = 0;

      if (!item.quest_id) {
        Alert.alert("알림", "이 장소에는 연결된 퀘스트가 없습니다.");
        return;
      }

      console.log(`Double-click detected: Navigating to quest-detail`);
      console.log(`Quest ID: ${item.quest_id}, Quest Name: ${item.name}`);

      // quest-detail expects a 'quest' object as JSON string
      const questData = {
        id: item.quest_id,
        place_id: item.place_id,
        name: item.name,
        title: item.name, // Using name as title
        description: item.description || "No description available",
        category: item.category,
        latitude: item.latitude,
        longitude: item.longitude,
        reward_point: item.reward_point,
        points: item.reward_point, // Using reward_point as points
        difficulty: "medium", // Default difficulty
        is_active: true,
        completion_count: 0,
        created_at: new Date().toISOString(),
        district: item.district,
        place_image_url: item.place_image_url,
        distance_km: item.distance_km,
      };

      router.push({
        pathname: "/(tabs)/map/quest-detail",
        params: {
          quest: JSON.stringify(questData),
        },
      });
    } else {
      // 싱글 클릭
      lastTap.current = now;
      console.log(`Single click on: ${item.name} (Quest ID: ${item.quest_id})`);
    }
  };

  const handleStartQuests = () => {
    if (selectedQuests.length === 0) {
      Alert.alert("알림", "장바구니에 퀘스트를 추가해주세요.");
      return;
    }

    router.push("/(tabs)/map");
  };

  return (
    <View style={styles.container}>
      <View style={styles.dismissRow}>
        <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>Based on your image & filter</Text>
        </View>

        <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Filter: {category}</Text>

      <View style={styles.tagRow}>
        <View style={[styles.tagChip, { backgroundColor: "#4A67FF" }]}>
          <Text style={styles.tagChipText}>Image</Text>
        </View>
        {category && (
          <View style={[styles.tagChip, { backgroundColor: "#F47A3A" }]}>
            <Text style={styles.tagChipText}>{category}</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="center"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        contentContainerStyle={[styles.horizontalList, { paddingHorizontal: cardPadding }]}
      >
        {recommendations.map((item: any) => (
          <TouchableOpacity
            key={item.place_id || item.id}
            style={[styles.card, { width: cardWidth }]}
            onPress={() => handleCardPress(item)}
            activeOpacity={0.8}
          >
            {item.place_image_url ? (
              <Image source={{ uri: item.place_image_url }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.placeholderImage]}>
                <Ionicons name="image" size={32} color="#9FB3C8" />
                <Text style={{ color: "#9FB3C8", marginTop: 6 }}>이미지를 불러올 수 없어요</Text>
              </View>
            )}

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category || "Unknown"}</Text>
            </View>

            {/* + 버튼 (우측 상단) */}
            {item.quest_id && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item);
                }}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            )}

            {item.distance_km && (
              <View style={styles.distanceTag}>
                <Ionicons name="navigate" size={14} color="white" />
                <Text style={styles.distanceText}>{item.distance_km}km</Text>
              </View>
            )}

            {item.reward_point && (
              <View style={styles.pointTag}>
                <Ionicons name="information-circle" size={14} color="white" />
                <Text style={styles.pointText}>{item.reward_point}</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <Text style={styles.placeTitle}>{item.name}</Text>
              <Text style={styles.placeDistrict}>{item.district || "Unknown district"}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {recommendations.map((_: any, index: number) => (
          <View key={index} style={[styles.dot, activeIndex === index && styles.dotActive]} />
        ))}
      </View>

      {/* 장바구니 + START 버튼 */}
      <View style={styles.routeContainer} pointerEvents="box-none">
        <LinearGradient
          colors={["#FF7F50", "#994C30"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.routeBar}
        >
          <View style={styles.questSlotsContainer}>
            {[0, 1, 2, 3].map((index) => {
              const selectedQuest = selectedQuests[index];
              console.log(`Cart Slot ${index}:`, selectedQuest ? `${selectedQuest.name} - ${selectedQuest.place_image_url}` : "Empty");
              return (
                <Pressable
                  key={index}
                  style={styles.questSlot}
                  onPress={() => selectedQuest && removeQuest(selectedQuest.id)}
                >
                  {selectedQuest ? (
                    <Image
                      source={{
                        uri: selectedQuest.place_image_url || "https://picsum.photos/58/60",
                      }}
                      style={styles.slotQuestImage}
                    />
                  ) : (
                    <Text style={styles.slotPlusIcon}>+</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[
              styles.startButton,
              selectedQuests.length > 0 && styles.startButtonActive,
            ]}
            onPress={handleStartQuests}
            disabled={selectedQuests.length === 0}
          >
            <Text
              style={[
                styles.startButtonText,
                selectedQuests.length > 0 && styles.startButtonTextActive,
              ]}
            >
              START
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#10202F", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  dismissRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  resultTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: { color: "#B8C3CF", marginTop: 10 },
  tagRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  tagChipText: { color: "#fff", fontWeight: "700" },
  horizontalList: { paddingVertical: 30 },
  card: { backgroundColor: "#1E2B3A", borderRadius: 16, overflow: "hidden", position: "relative" },
  cardImage: { width: "100%", height: 200 },
  placeholderImage: { justifyContent: "center", alignItems: "center" },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: { color: "white", fontWeight: "700", fontSize: 13 },
  addButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#F47A3A",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  distanceTag: {
    position: "absolute",
    top: 60,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distanceText: { color: "white", fontSize: 12, fontWeight: "600" },
  pointTag: {
    position: "absolute",
    top: 100,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    backgroundColor: "rgba(74, 103, 255, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointText: { color: "white", fontSize: 12, fontWeight: "600" },
  cardContent: { padding: 16 },
  placeTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  placeDistrict: { color: "#9FB3C8", fontSize: 14, marginTop: 4 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { width: 18, backgroundColor: "#fff" },

  /* Bottom Route Selection Bar */
  routeContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1600,
    elevation: 1600,
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
    overflow: "hidden",
  },
  slotQuestImage: {
    width: 58,
    height: 60,
    borderRadius: 10,
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
  startButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(154, 77, 49, 0.46)",
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  startButtonTextActive: {
    color: "#EF6A39",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: -0.16,
  },
});