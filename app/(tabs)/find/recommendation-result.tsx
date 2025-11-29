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
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";
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
      title: item.name,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      reward_point: item.reward_point,
      points: item.reward_point || 0,
      description: item.description || "",
      district: item.district,
      difficulty: "medium" as const,
      is_active: true,
      completion_count: 0,
      created_at: new Date().toISOString(),
      place_image_url: item.place_image_url,
      distance_km: item.distance_km,
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
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <G clipPath="url(#clip0_6_5064)">
              <Path fillRule="evenodd" clipRule="evenodd" d="M1.82891 0.313946C1.62684 0.118777 1.35619 0.0107829 1.07527 0.0132241C0.794342 0.0156653 0.525614 0.128346 0.326962 0.326998C0.128311 0.525649 0.0156299 0.794377 0.0131887 1.0753C0.0107476 1.35623 0.118742 1.62687 0.313911 1.82895L5.98498 7.50002L0.313911 13.1711C0.211579 13.2699 0.129955 13.3882 0.0738023 13.5189C0.0176498 13.6496 -0.0119069 13.7902 -0.0131431 13.9324C-0.0143794 14.0747 0.0127296 14.2158 0.066602 14.3475C0.120474 14.4791 0.200031 14.5988 0.300631 14.6994C0.40123 14.8 0.520857 14.8795 0.652532 14.9334C0.784206 14.9873 0.925291 15.0144 1.06756 15.0131C1.20982 15.0119 1.35041 14.9824 1.48113 14.9262C1.61185 14.87 1.73008 14.7884 1.82891 14.6861L7.49998 9.01502L13.1711 14.6861C13.3731 14.8813 13.6438 14.9893 13.9247 14.9868C14.2056 14.9844 14.4743 14.8717 14.673 14.673C14.8717 14.4744 14.9843 14.2057 14.9868 13.9247C14.9892 13.6438 14.8812 13.3732 14.6861 13.1711L9.01498 7.50002L14.6861 1.82895C14.8812 1.62687 14.9892 1.35623 14.9868 1.0753C14.9843 0.794377 14.8717 0.525649 14.673 0.326998C14.4743 0.128346 14.2056 0.0156653 13.9247 0.0132241C13.6438 0.0107829 13.3731 0.118777 13.1711 0.313946L7.49998 5.98502L1.82891 0.313946Z" fill="white"/>
            </G>
            <Defs>
              <ClipPath id="clip0_6_5064">
                <Rect width="15" height="15" fill="white"/>
              </ClipPath>
            </Defs>
          </Svg>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>I considered the image and filter you chose!</Text>

      <View style={styles.newTagRow}>
        <View style={styles.imageTagChip}>
          <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <Path d="M11.25 5C11.25 5.33152 11.1183 5.64946 10.8839 5.88388C10.6495 6.1183 10.3315 6.25 10 6.25C9.66848 6.25 9.35054 6.1183 9.11612 5.88388C8.8817 5.64946 8.75 5.33152 8.75 5C8.75 4.66848 8.8817 4.35054 9.11612 4.11612C9.35054 3.8817 9.66848 3.75 10 3.75C10.3315 3.75 10.6495 3.8817 10.8839 4.11612C11.1183 4.35054 11.25 4.66848 11.25 5Z" fill="white"/>
            <Path fillRule="evenodd" clipRule="evenodd" d="M7.46438 0.781143H7.53562C8.97875 0.781143 10.1094 0.781143 10.9919 0.899893C11.8944 1.02114 12.6069 1.27489 13.1663 1.83364C13.7256 2.39302 13.9787 3.10552 14.1 4.00864C14.2188 4.89052 14.2188 6.02114 14.2188 7.46427V7.51927C14.2188 8.71239 14.2188 9.68864 14.1537 10.4836C14.0887 11.2836 13.9556 11.9505 13.6569 12.5055C13.526 12.7497 13.3625 12.9699 13.1663 13.1661C12.6069 13.7255 11.8944 13.9786 10.9913 14.0999C10.1094 14.2186 8.97875 14.2186 7.53562 14.2186H7.46438C6.02125 14.2186 4.89062 14.2186 4.00813 14.0999C3.10563 13.9786 2.39313 13.7249 1.83375 13.1661C1.33812 12.6705 1.08188 12.0536 0.94625 11.2874C0.811875 10.5355 0.7875 9.59989 0.7825 8.43864C0.781667 8.14281 0.78125 7.82989 0.78125 7.49989V7.46364C0.78125 6.02052 0.78125 4.88989 0.9 4.00739C1.02125 3.10489 1.275 2.39239 1.83375 1.83302C2.39313 1.27364 3.10562 1.02052 4.00875 0.899268C4.89062 0.780518 6.02125 0.780518 7.46438 0.780518M4.13312 1.82802C3.33437 1.93552 2.8525 2.14052 2.49687 2.49614C2.14062 2.85239 1.93625 3.33364 1.82875 4.13302C1.72 4.94552 1.71875 6.01302 1.71875 7.49927V8.02677L2.34437 7.47927C2.6188 7.23905 2.97426 7.11212 3.33877 7.12419C3.70328 7.13626 4.04957 7.28642 4.3075 7.54427L6.98875 10.2255C7.19682 10.4335 7.47159 10.5615 7.76472 10.5869C8.05784 10.6123 8.35052 10.5334 8.59125 10.3643L8.7775 10.233C9.1248 9.98898 9.54463 9.87 9.96834 9.89554C10.392 9.92109 10.7945 10.0896 11.11 10.3736L12.8788 11.9655C13.0575 11.5918 13.1631 11.1005 13.2194 10.4074C13.2806 9.65427 13.2812 8.71552 13.2812 7.49927C13.2812 6.01302 13.28 4.94552 13.1712 4.13302C13.0637 3.33364 12.8587 2.85177 12.5031 2.49552C12.1469 2.13989 11.6656 1.93552 10.8663 1.82802C10.0538 1.71927 8.98625 1.71802 7.5 1.71802C6.01375 1.71802 4.94562 1.71927 4.13312 1.82802Z" fill="white"/>
          </Svg>
          <Text style={styles.imageTagText}>Image</Text>
          <TouchableOpacity>
            <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <Path fillRule="evenodd" clipRule="evenodd" d="M1.21927 0.200508C1.08456 0.0703956 0.904128 -0.00160044 0.716845 2.70019e-05C0.529561 0.00165444 0.350409 0.0767751 0.217975 0.209209C0.0855406 0.341644 0.0104199 0.520796 0.00879249 0.708079C0.00716504 0.895362 0.0791611 1.07579 0.209274 1.21051L3.98999 4.99122L0.209274 8.77194C0.141052 8.83783 0.0866365 8.91665 0.0492015 9.00379C0.0117665 9.09094 -0.00793794 9.18467 -0.00876209 9.27951C-0.00958625 9.37435 0.0084864 9.46841 0.0444013 9.55619C0.0803162 9.64397 0.133354 9.72372 0.20042 9.79079C0.267487 9.85786 0.347238 9.91089 0.435021 9.94681C0.522804 9.98272 0.616861 10.0008 0.711703 9.99997C0.806546 9.99915 0.900274 9.97945 0.98742 9.94201C1.07457 9.90458 1.15338 9.85016 1.21927 9.78194L4.99999 6.00122L8.7807 9.78194C8.91542 9.91205 9.09585 9.98405 9.28313 9.98242C9.47042 9.98079 9.64957 9.90567 9.782 9.77324C9.91444 9.6408 9.98956 9.46165 9.99118 9.27437C9.99281 9.08708 9.92082 8.90665 9.7907 8.77194L6.00999 4.99122L9.7907 1.21051C9.92082 1.07579 9.99281 0.895362 9.99118 0.708079C9.98956 0.520796 9.91444 0.341644 9.782 0.209209C9.64957 0.0767751 9.47042 0.00165444 9.28313 2.70019e-05C9.09585 -0.00160044 8.91542 0.0703956 8.7807 0.200508L4.99999 3.98122L1.21927 0.200508Z" fill="white"/>
            </Svg>
          </TouchableOpacity>
        </View>
        {category && (
          <View style={styles.categoryTagChip}>
            <Text style={styles.categoryTagText}>{category}</Text>
            <TouchableOpacity>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <G clipPath="url(#clip0_6_5082)">
                  <Path fillRule="evenodd" clipRule="evenodd" d="M1.21927 0.209298C1.08456 0.0791846 0.904128 0.00718862 0.716845 0.00881606C0.529561 0.0104435 0.350409 0.0855642 0.217975 0.217999C0.0855406 0.350433 0.0104199 0.529585 0.00879249 0.716868C0.00716504 0.904152 0.0791611 1.08458 0.209274 1.2193L3.98999 5.00001L0.209274 8.78073C0.141052 8.84662 0.0866365 8.92544 0.0492015 9.01258C0.0117665 9.09973 -0.00793794 9.19345 -0.00876209 9.2883C-0.00958625 9.38314 0.0084864 9.4772 0.0444013 9.56498C0.0803162 9.65276 0.133354 9.73251 0.20042 9.79958C0.267487 9.86665 0.347238 9.91968 0.435021 9.9556C0.522804 9.99151 0.616861 10.0096 0.711703 10.0088C0.806546 10.0079 0.900274 9.98823 0.98742 9.9508C1.07457 9.91336 1.15338 9.85895 1.21927 9.79073L4.99999 6.01001L8.7807 9.79073C8.91542 9.92084 9.09585 9.99284 9.28313 9.99121C9.47042 9.98958 9.64957 9.91446 9.782 9.78203C9.91444 9.64959 9.98956 9.47044 9.99118 9.28316C9.99281 9.09587 9.92082 8.91544 9.7907 8.78073L6.00999 5.00001L9.7907 1.2193C9.92082 1.08458 9.99281 0.904152 9.99118 0.716868C9.98956 0.529585 9.91444 0.350433 9.782 0.217999C9.64957 0.0855642 9.47042 0.0104435 9.28313 0.00881606C9.09585 0.00718862 8.91542 0.0791846 8.7807 0.209298L4.99999 3.99001L1.21927 0.209298Z" fill="white"/>
                </G>
                <Defs>
                  <ClipPath id="clip0_6_5082">
                    <Rect width="10" height="10" fill="white"/>
                  </ClipPath>
                </Defs>
              </Svg>
            </TouchableOpacity>
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
  dismissRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 12
  },
  resultTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFF",
    textAlign: "center",
    fontFamily: "Pretendard",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0,
    marginTop: 10,
    marginBottom: 14,
  },
  newTagRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  imageTagChip: {
    flexDirection: "row",
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 42,
    backgroundColor: "#659DF2",
  },
  imageTagText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  categoryTagChip: {
    flexDirection: "row",
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 42,
    backgroundColor: "#FF7F50",
  },
  categoryTagText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: -0.12,
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