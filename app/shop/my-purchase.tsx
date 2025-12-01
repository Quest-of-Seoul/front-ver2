import { ThemedText } from "@/components/themed-text";
import { ClaimedReward, pointsApi, rewardApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";

type TabType = "day-pass" | "available" | "used";

export default function MyPurchaseScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("available");
  const [userMint, setUserMint] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [coupons, setCoupons] = useState<ClaimedReward[]>([]);

  const fetchUserPoints = async () => {
    try {
      const data = await pointsApi.getPoints();
      setUserMint(data.total_points);
    } catch (err) {
      // Ignore
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await rewardApi.getClaimedRewards();
      setCoupons(res.claimed_rewards || []);
    } catch (e) {
      Alert.alert("Error", "Failed to load purchase list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPoints();
    fetchCoupons();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserPoints();
      fetchCoupons();
    }, [])
  );

  // Filter coupons based on active tab
  const getFilteredCoupons = () => {
    if (activeTab === "day-pass") {
      // Day Pass는 별도 처리 필요 (현재는 빈 배열)
      return [];
    } else if (activeTab === "available") {
      return coupons.filter((c) => !c.used_at);
    } else {
      return coupons.filter((c) => c.used_at);
    }
  };

  const filteredCoupons = getFilteredCoupons();

  // Day Pass 데이터 (임시 - 나중에 API로 가져올 수 있음)
  const [dayPassData, setDayPassData] = useState<{
    days: number;
    expiresAt: string | null;
  } | null>(null);
  
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Day Pass 남은 시간 계산 및 실시간 업데이트
  useEffect(() => {
    if (!dayPassData?.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(dayPassData.expiresAt!).getTime();
      const diff = expires - now;
      
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} left`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [dayPassData]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>My Purchase</ThemedText>
        <View style={styles.mintHeader}>
          <Svg width="26" height="16" viewBox="0 0 26 16" fill="none">
            <Path
              d="M26 7.93746V8.44855C26 9.17179 25.5789 9.78656 24.9296 10.2012C25.7342 10.8232 26.1647 11.7441 25.92 12.612L25.7765 13.0942C25.3813 14.4804 23.4241 15.0108 21.7773 14.1815L20.2812 13.4317C19.8558 13.2212 19.4801 12.9185 19.1802 12.5445C18.9389 12.8886 18.6698 13.2111 18.3756 13.5088C17.5932 14.3118 16.6512 14.9326 15.6136 15.3288C14.576 15.7251 13.4673 15.8876 12.363 15.8053C11.2586 15.7229 10.1845 15.3976 9.21383 14.8516C8.24317 14.3055 7.39872 13.5515 6.738 12.641C6.45213 12.9673 6.10695 13.2334 5.72174 13.4245L4.22558 14.1742C2.57885 15.0035 0.631008 14.4732 0.226384 13.0869L0.0828579 12.6048C-0.152389 11.7465 0.268722 10.8256 1.07327 10.194C0.423985 9.77932 0.00288208 9.15732 0.00288208 8.44131V7.93746C0.0132505 7.59598 0.106971 7.26261 0.27546 6.96781C0.443949 6.67301 0.681828 6.42619 0.967388 6.2499C0.261648 5.68577 -0.140606 4.86369 0.0452391 4.05606L0.158153 3.55942C0.471031 2.20455 2.27536 1.54641 3.93855 2.18527L5.49121 2.78556C5.88189 2.93367 6.24297 3.15341 6.55685 3.43406C7.26949 2.36734 8.22692 1.49633 9.34495 0.897587C10.463 0.298841 11.7074 -0.00930872 12.9688 0.000214193C14.2303 0.0097371 15.4701 0.336647 16.5794 0.952207C17.6887 1.56777 18.6335 2.45313 19.3308 3.5305C19.6676 3.20049 20.0683 2.9467 20.507 2.78556L22.0573 2.18527C23.7228 1.54641 25.5248 2.20455 25.8377 3.55942L25.9506 4.05606C26.1365 4.86369 25.7412 5.68577 25.0284 6.2499C25.3153 6.42532 25.5546 6.67178 25.7243 6.96663C25.8941 7.26149 25.9889 7.5953 26 7.93746Z"
              fill="url(#paint0_radial_mint)"
            />
            <Defs>
              <RadialGradient
                id="paint0_radial_mint"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(13 7.91304) rotate(90) scale(7.91304 13)"
              >
                <Stop stopColor="white" />
                <Stop offset="1" stopColor="white" stopOpacity="0.85" />
              </RadialGradient>
            </Defs>
          </Svg>
          <ThemedText style={styles.mintLabel}>mint</ThemedText>
          <ThemedText style={styles.mintValue}>{userMint}</ThemedText>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "day-pass" && styles.activeTab]}
          onPress={() => setActiveTab("day-pass")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "day-pass" && styles.activeTabText,
            ]}
          >
            Day Pass
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "available" && styles.activeTab]}
          onPress={() => setActiveTab("available")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "available" && styles.activeTabText,
            ]}
          >
            Available
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "used" && styles.activeTab]}
          onPress={() => setActiveTab("used")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "used" && styles.activeTabText,
            ]}
          >
            Used
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ThemedText style={styles.emptyText}>Loading...</ThemedText>
        ) : activeTab === "day-pass" ? (
          dayPassData ? (
            <DayPassCard days={dayPassData.days} timeLeft={timeLeft} />
          ) : (
            <View style={styles.dayPassEmptyContainer}>
              <ThemedText style={styles.emptyText}>
                No day pass purchases yet.
              </ThemedText>
              <Pressable
                style={styles.goToDayPassButton}
                onPress={() => router.push("/shop/day-pass")}
              >
                <ThemedText style={styles.goToDayPassText}>
                  Go see Day Pass Trials
                </ThemedText>
              </Pressable>
            </View>
          )
        ) : filteredCoupons.length === 0 ? (
          <ThemedText style={styles.emptyText}>
            {activeTab === "available"
              ? "No available purchases yet."
              : "No used purchases yet."}
          </ThemedText>
        ) : (
          <View style={styles.grid}>
            {filteredCoupons.map((item) => (
              <PurchaseItem 
                key={item.id} 
                item={item}
                onPress={() => {
                  router.push({
                    pathname: "/shop/my-purchase-coupon-detail",
                    params: {
                      coupon: JSON.stringify(item),
                    },
                  });
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DayPassCard({ days, timeLeft }: { days: number; timeLeft: string | null }) {
  return (
    <View style={styles.dayPassCard}>
      <ThemedText style={styles.dayPassTitle}>{days} Day</ThemedText>
      
      <View style={styles.dayPassFeatures}>
        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="flash" size={20} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>
            Mint 1.3X collects
          </ThemedText>
        </View>
        
        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="infinite-outline" size={20} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>
            Infinite AI Docent Chat
          </ThemedText>
        </View>
        
        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="construct-outline" size={20} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>
            Automatic tour route generate
          </ThemedText>
        </View>
      </View>

      {timeLeft && (
        <View style={styles.timeLeftContainer}>
          <View style={styles.timeLeftDivider} />
          <ThemedText style={styles.timeLeftText}>{timeLeft}</ThemedText>
        </View>
      )}
    </View>
  );
}

function PurchaseItem({ 
  item, 
  onPress 
}: { 
  item: ClaimedReward;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.itemCard} onPress={onPress}>
      <View style={styles.itemImageContainer}>
        {item.rewards?.image_url ? (
          <Image
            source={{ uri: item.rewards.image_url }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="gift" size={40} color="#76C7AD" />
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemBrand} numberOfLines={1}>
          {item.rewards.type || "Reward"}
        </ThemedText>
        <ThemedText style={styles.itemName} numberOfLines={2}>
          {item.rewards.name}
        </ThemedText>
        <View style={styles.itemPriceBadge}>
          <Svg width="13" height="8" viewBox="0 0 13 8" fill="none">
            <Path
              d="M13 4.01234V4.2707C13 4.63629 12.7895 4.94705 12.4648 5.15666C12.8671 5.47107 13.0823 5.9366 12.96 6.37531L12.8883 6.61904C12.6907 7.31976 11.712 7.58787 10.8887 7.16865L10.1406 6.78965C9.9279 6.68324 9.74007 6.53022 9.5901 6.34118C9.46947 6.51509 9.3349 6.67816 9.18782 6.82864C8.79662 7.23454 8.3256 7.54833 7.80681 7.74864C7.28802 7.94896 6.73366 8.0311 6.18148 7.98947C5.62929 7.94784 5.09225 7.7834 4.60692 7.50738C4.12158 7.23136 3.69936 6.85023 3.369 6.38993C3.22607 6.5549 3.05348 6.68943 2.86087 6.78599L2.11279 7.16499C1.28943 7.58421 0.315504 7.3161 0.113192 6.61538L0.041429 6.37165C-0.0761944 5.93781 0.134361 5.47229 0.536633 5.153C0.211993 4.94339 0.00144104 4.62898 0.00144104 4.26704V4.01234C0.00662526 3.83973 0.0534857 3.67121 0.13773 3.52219C0.221975 3.37317 0.340914 3.24841 0.483694 3.15929C0.130824 2.87412 -0.0703029 2.45857 0.0226196 2.05032L0.0790765 1.79927C0.235516 1.11439 1.13768 0.781702 1.96928 1.10464L2.7456 1.40809C2.94094 1.48295 3.12149 1.59403 3.27843 1.7359C3.63475 1.19668 4.11346 0.756388 4.67248 0.453726C5.23149 0.151063 5.8537 -0.00470551 6.48442 0.000108273C7.11515 0.00492205 7.73507 0.170173 8.28972 0.481336C8.84437 0.792498 9.31677 1.24004 9.66538 1.78465C9.8338 1.61783 10.0342 1.48954 10.2535 1.40809L11.0286 1.10464C11.8614 0.781702 12.7624 1.11439 12.9188 1.79927L12.9753 2.05032C13.0682 2.45857 12.8706 2.87412 12.5142 3.15929C12.6577 3.24797 12.7773 3.37255 12.8622 3.5216C12.9471 3.67064 12.9944 3.83938 13 4.01234Z"
              fill="#F5F5F5"
            />
          </Svg>
          <ThemedText style={styles.itemPrice}>{item.rewards.point_cost}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#34495E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#34495E",
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  mintHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mintLabel: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  mintValue: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#76C7AD",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "Pretendard",
    fontSize: 14,
    fontWeight: "400",
  },
  activeTabText: {
    color: "#76C7AD",
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  itemCard: {
    width: (Dimensions.get("window").width - 32 - 12) / 2,
    backgroundColor: "#76C7AD",
    borderRadius: 12,
    padding: 12,
    aspectRatio: 0.75,
  },
  itemImageContainer: {
    width: "100%",
    flex: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flexDirection: "column",
    gap: 4,
  },
  itemBrand: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  itemName: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
  },
  itemPriceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  itemPrice: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  emptyText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 40,
    fontSize: 14,
  },
  // Day Pass Card
  dayPassCard: {
    backgroundColor: "#76C7AD",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  dayPassTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  dayPassFeatures: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    marginBottom: 20,
  },
  dayPassFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayPassFeatureText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  timeLeftContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
  },
  timeLeftDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 12,
  },
  timeLeftText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
  },
  dayPassEmptyContainer: {
    alignItems: "center",
    marginTop: 40,
    gap: 20,
  },
  goToDayPassButton: {
    backgroundColor: "#FF7F50",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 10,
  },
  goToDayPassText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 16,
    fontWeight: "700",
  },
});
