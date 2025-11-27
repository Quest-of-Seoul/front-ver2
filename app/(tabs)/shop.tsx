import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { pointsApi, rewardApi, Reward } from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

const CATEGORIES = [
  { key: "food", label: "Food" },
  { key: "cafe", label: "Cafe" },
  { key: "shopping", label: "Shopping" },
  { key: "ticket", label: "Ticket" },
  { key: "activity", label: "Activity" },
  { key: "entertainment", label: "Entertainment" },
  { key: "beauty", label: "Beauty" },
  { key: "wellness", label: "Wellness" },
];

export default function ShopScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("food");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userMint, setUserMint] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchUserPoints = async () => {
    try {
      const data = await pointsApi.getPoints();
      setUserMint(data.total_points);
      console.log("Shop - User mint points:", data.total_points);
    } catch (err) {
      console.error("Failed to fetch user points:", err);
    }
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await rewardApi.getRewards(selectedCategory, search);
      setRewards(data.rewards);
      console.log(`Fetched ${data.rewards.length} rewards for category: ${selectedCategory}`);
    } catch (e) {
      console.error("Failed to fetch rewards:", e);
      Alert.alert("오류", "리워드 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPoints();
    fetchRewards();
  }, [selectedCategory, search]);

  // Refresh points when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Shop screen focused - refreshing points");
      fetchUserPoints();
      fetchRewards();
    }, [])
  );

  const handleBuyReward = async (item: Reward) => {
    try {
      const res = await rewardApi.claim(item.id);
      if (res.status === "success") {
        Alert.alert(
          "구매 완료! 🎉", 
          `${item.name}을(를) 구매했습니다!\n\nQR 코드: ${res.qr_code}\n\nMy Coupon에서 확인하세요.`
        );
        fetchUserPoints();
      } else {
        Alert.alert(
          "포인트 부족 💎",
          `필요 포인트: ${res.required}\n보유 포인트: ${res.current}\n부족: ${res.shortage}`
        );
      }
    } catch (e: any) {
      console.error("Purchase error:", e);
      Alert.alert("오류", e.message || "구매 중 문제가 발생했습니다.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 🔎 Search */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search Shops"
          placeholderTextColor="#bbb"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {/* My Coupon 이동 */}
        <TouchableOpacity
          style={styles.couponBtn}
          onPress={() => router.push("/shop-coupon")}
        >
          <ThemedText style={styles.categoryText}>My Coupon</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Category selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.tag,
                selectedCategory === cat.key && styles.tagSelected,
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <ThemedText style={styles.tagText}>{cat.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 💎 Mint Card */}
      <View style={styles.mintCard}>
        <Ionicons name="cloud" size={60} color="#7DFFA4" style={styles.cloudIcon} />
        <View>
          <ThemedText style={styles.mintTitle}>You have</ThemedText>
          <ThemedText style={styles.mintAmount}>{userMint.toLocaleString()} mints</ThemedText>
        </View>
      </View>

      {/* Reward list */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {CATEGORIES.find(c => c.key === selectedCategory)?.label || "Rewards"}
        </ThemedText>
        <ThemedText style={styles.countText}>{rewards.length} items</ThemedText>
      </View>

      {loading ? (
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      ) : rewards.length === 0 ? (
        <ThemedText style={styles.emptyText}>No rewards available</ThemedText>
      ) : (
        <View style={styles.cardGrid}>
          {rewards.map((item) => (
            <RewardCard
              key={item.id}
              item={item}
              onBuy={() => handleBuyReward(item)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* 리워드 카드 컴포넌트 */
function RewardCard({ item, onBuy }: { item: Reward; onBuy: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardImagePlaceholder}>
        <Ionicons name="gift" size={40} color="#7DFFA4" />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.cardTitle} numberOfLines={2}>{item.name}</ThemedText>
        {item.description && (
          <ThemedText style={styles.cardDesc} numberOfLines={2}>{item.description}</ThemedText>
        )}
        <View style={styles.priceBox}>
          <Ionicons name="leaf" size={18} color="#7DFFA4" />
          <ThemedText style={styles.priceText}>{item.point_cost}</ThemedText>
        </View>
      </View>
      <TouchableOpacity style={styles.buyBtn} onPress={onBuy}>
        <ThemedText style={styles.buyText}>Buy</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A2A",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },

  /** Search Row */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  categoryBtn: {
    backgroundColor: "#1FC58E",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  couponBtn: {
    backgroundColor: "#394B70",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  categoryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  /** Mint Card */
  mintCard: {
    backgroundColor: "#1A2D48",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
  },
  cloudIcon: {
    marginRight: 16,
  },
  mintTitle: {
    color: "#A8B7D8",
    fontSize: 14,
  },
  mintAmount: {
    color: "#7DFFA4",
    fontSize: 26,
    fontWeight: "800",
  },

  /** Section */
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
  },

  /** Category Tags */
  tag: {
    backgroundColor: "#394B70",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tagSelected: {
    backgroundColor: "#1FC58E",
  },
  tagText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  /** Reward Cards */
  cardGrid: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1A2D48",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    gap: 12,
  },
  cardImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#0F1A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: {
    color: "#A8B7D8",
    fontSize: 12,
    marginBottom: 8,
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    color: "#7DFFA4",
    fontWeight: "700",
    fontSize: 15,
  },

  buyBtn: {
    backgroundColor: "#1FC58E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  countText: {
    color: "#A8B7D8",
    fontSize: 14,
  },
  loadingText: {
    textAlign: "center",
    color: "#A8B7D8",
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
});
