import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

interface Quest {
  id: number;
  place_id: string | null;
  name: string;
  title: string | null;
  description: string;
  category: string | null;
  latitude: number;
  longitude: number;
  reward_point: number;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
  completion_count: number;
  created_at: string;
}

interface QuestMiniModalProps {
  quest: Quest;
  onClose: () => void;
}

export default function QuestMiniModal({ quest, onClose }: QuestMiniModalProps) {
  const slideAnim = useRef(new Animated.Value(307)).current; // 모달 높이만큼 아래에서 시작

  useEffect(() => {
    // 모달이 마운트되면 위로 올라오는 애니메이션
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const handleClose = () => {
    // 닫을 때 아래로 내려가는 애니메이션
    Animated.timing(slideAnim, {
      toValue: 307,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <>
      {/* 배경 오버레이 (클릭시 닫기) */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/* 모달 */}
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* 내용 전체 */}
        <View style={styles.contentWrapper}>
          {/* 왼쪽 이미지 */}
          <Image
            source={{ uri: "https://picsum.photos/300/300" }}
            style={styles.image}
          />

          {/* 오른쪽 영역 */}
          <View style={styles.rightColumn}>
            {/* See Related Places 버튼 */}
            <Pressable style={styles.relatedBtn}>
              <Text style={styles.relatedBtnText}>See Related Places</Text>
            </Pressable>

            {/* 텍스트들 */}
            <View style={styles.titleBox}>
              <Text style={styles.title}>{quest.name}</Text>
              <Text style={styles.subTitle}>💰 {quest.reward_point}P</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  /** 배경 오버레이 */
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1500,
  },

  /** 전체 모달 */
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 307,
    backgroundColor: "#34495E",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 47, // 내용과 모달 상단 간격
    alignItems: "center",
    zIndex: 1501,
  },

  /** 내용 전체 wrapper */
  contentWrapper: {
    width: 325,
    height: 156.931,
    flexDirection: "row",
    gap: 12,
  },

  /** 왼쪽 이미지 */
  image: {
    width: 156.931,
    height: 156.931,
    borderRadius: 10,
  },

  /** 오른쪽 상·하 정렬 column */
  rightColumn: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
  },

  /** See Related Places 버튼 박스 */
  relatedBtn: {
    width: 154,
    height: 40,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#4D647C",

    justifyContent: "center",
    alignItems: "center",
  },

  relatedBtnText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.16,
    lineHeight: 20,
  },

  /** 제목/서브텍스트 wrapper */
  titleBox: {
    width: 142,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
  },

  /** 제목 */
  title: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.18,
  },

  /** 하단 장소 텍스트 */
  subTitle: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: -0.12,
  },
});
