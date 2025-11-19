import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const mockData = [
  {
    id: 1,
    category: "Heritage",
    distance: "3.5km",
    point: 300,
    title: "Gyeongbokgung Palace",
    district: "Jongno-gu",
    image: require("@/assets/images/guiz-bg.jpg"),
  },
  {
    id: 2,
    category: "Culture",
    distance: "4.2km",
    point: 250,
    title: "Bukchon Hanok Village",
    district: "Jongno-gu",
    image: require("@/assets/images/guiz-bg.jpg"),
  },
  {
    id: 3,
    category: "Nature",
    distance: "5.8km",
    point: 180,
    title: "Namsan Park",
    district: "Yongsan-gu",
    image: require("@/assets/images/guiz-bg.jpg"),
  },
];

export default function RecommendationResultScreen() {
  const router = useRouter();
  const { category = "Selected filter" } = useLocalSearchParams<{
    category?: string;
    imageUri?: string;
  }>();
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(() => width - 60, [width]);
  const sidePadding = useMemo(
    () => (width - cardWidth) / 2,
    [width, cardWidth]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.dismissRow}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>
            I considered the image and filter you chose!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.back()}
          accessibilityLabel="Close recommendations"
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Based on your image & filter selection ({category})
      </Text>

      <View style={styles.tagRow}>
        <View style={[styles.tagChip, { backgroundColor: "#4A67FF" }]}>
          <Text style={styles.tagChipText}>Image</Text>
        </View>
        <View style={[styles.tagChip, { backgroundColor: "#F47A3A" }]}>
          <Text style={styles.tagChipText}>{category}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="center"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setActiveIndex(index);
        }}
        contentContainerStyle={[
          styles.horizontalList,
          {
            paddingLeft: sidePadding,
            paddingRight: sidePadding,
          },
        ]}
      >
        {mockData.map((item) => (
          <View key={item.id} style={[styles.card, { width: cardWidth }]}>
            <Image source={item.image} style={styles.cardImage} />

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            <TouchableOpacity style={styles.plusButton} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>

            <View style={styles.distanceTag}>
              <Ionicons name="navigate" size={14} color="white" />
              <Text style={styles.distanceText}>{item.distance}</Text>
            </View>

            <View style={styles.pointTag}>
              <Ionicons name="cash" size={14} color="white" />
              <Text style={styles.pointText}>{item.point} point</Text>
            </View>

            <Text style={styles.placeTitle}>{item.title}</Text>
            <Text style={styles.placeDistrict}>{item.district}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {mockData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10202F",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  dismissRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  resultTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
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
  subtitle: {
    color: "#B8C3CF",
    marginTop: 20,
  },
  tagRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagChipText: {
    color: "#fff",
    fontWeight: "700",
  },
  horizontalList: {
    paddingVertical: 30,
  },
  card: {
    backgroundColor: "#1E2B3A",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginHorizontal: 10,
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },
  plusButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#F47A3A",
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
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
  distanceText: {
    color: "white",
    fontSize: 12,
  },
  pointTag: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    backgroundColor: "#4CC9A7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  placeTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    marginHorizontal: 12,
  },
  placeDistrict: {
    color: "#9FB3C8",
    fontSize: 14,
    marginBottom: 14,
    marginHorizontal: 12,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#fff",
  },
});

