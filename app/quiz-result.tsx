import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Images } from "@/constants/images";
import { useQuestStore } from "@/store/useQuestStore";

export default function QuizResultScreen() {
  const router = useRouter();
  const { activeQuest } = useQuestStore();

  const params = useLocalSearchParams<{
    score?: string;
    detail?: string;
    isQuestMode?: string;
    questName?: string;
    questCompleted?: string;
    rewardPoint?: string;
    alreadyCompleted?: string;
  }>();

  const score = params.score ? parseInt(params.score) : 0;
  const detailList: number[] = params.detail ? JSON.parse(params.detail) : [];
  const isQuestMode = params.isQuestMode === "true";
  const questCompleted = params.questCompleted === "true";
  const rewardPoint = params.rewardPoint ? parseInt(params.rewardPoint) : 0;
  const questName = params.questName || "Quest of Seoul";
  const alreadyCompleted = params.alreadyCompleted === "true";

  const placeImageUrl =
    activeQuest?.quest.place_image_url || Images.quizThumbnail;

  const handleDiscoverMore = () => {
    // 일단 맵으로 돌아가서 퀘스트를 더 탐색하는 흐름
    router.replace("/(tabs)/map");
  };

  const handleNextQuest = () => {
    // 다음 퀘스트 선택을 위해 맵 탭으로 이동
    router.replace("/(tabs)/map");
  };

  return (
    <ThemedView style={styles.background}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 타이틀 */}
        <ThemedText style={styles.headerTitle}>{questName}</ThemedText>

        {/* 메인 결과 카드 */}
        <View style={styles.card}>
          {/* 장소 이미지 */}
          <Image
            source={
              typeof placeImageUrl === "string"
                ? { uri: placeImageUrl }
                : placeImageUrl
            }
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* 카드 내용 */}
          <View style={styles.cardBody}>
            <ThemedText style={styles.cardPlaceName}>{questName}</ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              {alreadyCompleted
                ? "Discovered Seoul once more!"
                : "You’ve discovered this place!"}
            </ThemedText>

            {/* 점수 / 정오 표시 바 */}
            <View style={styles.progressRow}>
              {detailList.map((value, index) => (
                <View key={index} style={styles.progressItem}>
                  <View style={styles.mintBadge}>
                    <ThemedText style={styles.mintValue}>+{value}</ThemedText>
                  </View>
                  <View style={styles.mintResult}>
                    <ThemedText
                      style={[
                        styles.mintResultText,
                        value > 0
                          ? styles.mintResultCorrect
                          : styles.mintResultWrong,
                      ]}
                    >
                      {value > 0 ? "✓" : "✕"}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 하단 액션 버튼들 */}
        <View style={styles.actions}>
          <Pressable style={styles.primaryBtn} onPress={handleDiscoverMore}>
            <ThemedText style={styles.primaryBtnText}>
              Discover this place more
            </ThemedText>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={handleNextQuest}>
            <ThemedText style={styles.secondaryBtnText}>
              Move on to next quest
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#34495E",
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 32,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardBody: {
    padding: 16,
  },
  cardPlaceName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#34495E",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#34495E",
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressItem: {
    alignItems: "center",
    flex: 1,
  },
  mintBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#34495E",
    marginBottom: 4,
  },
  mintValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  mintResult: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  mintResultText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mintResultCorrect: {
    color: "#76C7AD",
  },
  mintResultWrong: {
    color: "#FF7F50",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#34495E",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF7F50",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

