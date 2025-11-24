import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL || "http://10.0.2.2:8000";

export default function RecommendationResultScreen() {
  const router = useRouter();
  const { category, imageUri, result } = useLocalSearchParams();
  const recommendations = JSON.parse((result as string) || "[]");

  const { width } = useWindowDimensions();
  const cardWidth = width - 60;
  const cardPadding = (width - cardWidth) / 2;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleQuestPress = async (item: any) => {
    const questId = item.quest_id;
    if (!questId) {
      Alert.alert("알림", "이 장소에는 연결된 퀘스트가 없습니다.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/recommend/quests/${questId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.detail || "퀘스트 정보를 불러올 수 없습니다.");
      }

      const quest = data.quest;
      const quizCount = data.quizzes?.length || 0;

      Alert.alert(
        quest.name || "Quest",
        `${quest.description || ""}\n\n📍 ${item.district || "위치 정보 없음"}\n🎯 ${quest.reward_point || 0} Points\n📝 ${quizCount} Quiz(es)`,
        [
          { text: "닫기", style: "cancel" },
          {
            text: "AI 도슨트와 대화",
            onPress: () => {
              router.push({
                pathname: "/quest-ai-chat",
                params: {
                  questId: questId,
                  questName: quest.name,
                },
              });
            },
          },
        ]
      );
    } catch (err) {
      console.error("Quest detail error:", err);
      Alert.alert("오류", "퀘스트 정보를 불러올 수 없습니다.");
    }
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
            onPress={() => handleQuestPress(item)}
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

            {item.distance_km && (
              <View style={styles.distanceTag}>
                <Ionicons name="navigate" size={14} color="white" />
                <Text style={styles.distanceText}>{item.distance_km} km</Text>
              </View>
            )}

            {item.similarity && (
              <View style={styles.similarityTag}>
                <Ionicons name="analytics" size={14} color="white" />
                <Text style={styles.similarityText}>{Math.round(item.similarity * 100)}%</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <Text style={styles.placeTitle}>{item.name}</Text>
              <Text style={styles.placeDistrict}>{item.district || "District info unavailable"}</Text>

              {item.reward_point && (
                <View style={styles.rewardRow}>
                  <Ionicons name="leaf" size={16} color="#4ADE80" />
                  <Text style={styles.rewardText}>{item.reward_point} Points</Text>
                </View>
              )}

              {item.quest_id && (
                <View style={styles.questIndicator}>
                  <Ionicons name="flag" size={14} color="#F47A3A" />
                  <Text style={styles.questIndicatorText}>Quest Available</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {recommendations.map((_: any, index: number) => (
          <View key={index} style={[styles.dot, activeIndex === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#10202F", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 },
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
  cardImage: { width: "100%", height: 160 },
  placeholderImage: { justifyContent: "center", alignItems: "center" },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: { color: "white", fontWeight: "700", fontSize: 13 },
  distanceTag: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distanceText: { color: "white", fontSize: 12 },
  similarityTag: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    backgroundColor: "rgba(74, 103, 255, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  similarityText: { color: "white", fontSize: 12, fontWeight: "600" },
  cardContent: { padding: 12 },
  placeTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  placeDistrict: { color: "#9FB3C8", fontSize: 14, marginTop: 4 },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  rewardText: { color: "#4ADE80", fontSize: 14, fontWeight: "600" },
  questIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  questIndicatorText: { color: "#F47A3A", fontSize: 12, fontWeight: "600" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { width: 18, backgroundColor: "#fff" },
});