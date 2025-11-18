import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const FILTER_TAGS = ["Heritage", "Cuisine", "Shopping", "K-culture"];

const CATEGORIES = [
  { id: 1, name: "Attractions", icon: "⭐" },
  { id: 2, name: "Culture Plex", icon: "❇️" },
  { id: 3, name: "Events in Seoul", icon: "💃" },
  { id: 4, name: "Leisure", icon: "🎣" },
  { id: 5, name: "Sleep", icon: "🛏️" },
  { id: 6, name: "Shopping", icon: "🛍️" },
  { id: 7, name: "Cuisine", icon: "🍽️" },
  { id: 8, name: "Transportation", icon: "🚌" },
];

export default function FindScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/************* Search + Stats **************/}
        <View style={styles.topArea}>
          {/* Search Bar */}
          <View style={styles.searchBox}>
            <IconSymbol name="magnifyingglass" size={18} color="#6A727E" />
            <TextInput
              placeholder="Search Places"
              placeholderTextColor="#6A727E"
              style={styles.searchInput}
            />
            <IconSymbol name="camera.fill" size={20} color="#6A727E" />
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: "#5E7EB3" }]}>
              <IconSymbol name="figure.walk" size={22} color="#fff" />
              <ThemedText style={styles.statText}>0.1</ThemedText>
            </View>

            <View style={[styles.statCard, { backgroundColor: "#A8D9C4" }]}>
              <ThemedText style={styles.statText}>25</ThemedText>
              <ThemedText style={styles.statSub}>min</ThemedText>
            </View>
          </View>
        </View>

        {/************* Filter Tags **************/}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          <Pressable style={styles.tagFilterIcon}>
            <IconSymbol name="slider.horizontal.3" size={20} color="#fff" />
          </Pressable>

          {FILTER_TAGS.map((t) => (
            <Pressable key={t} style={styles.tagItem}>
              <ThemedText style={styles.tagText}>{t}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/************* AI Docent Card **************/}
        <Pressable
          style={styles.aiCard}
          onPress={() => router.push("/quest-recommendation")}
        >
          <View style={styles.aiLeft}>
            <IconSymbol name="camera.fill" size={20} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <ThemedText style={styles.aiTitle}>AI Docent</ThemedText>
            <ThemedText style={styles.aiTitle}>Recommendations</ThemedText>
            <ThemedText style={styles.aiDesc}>Show me any image!</ThemedText>
            <ThemedText style={styles.aiDesc}>
              I will find out your best tour route
            </ThemedText>
          </View>
        </Pressable>

        {/************* 8 Themes **************/}
        <View style={styles.themeHeader}>
          <ThemedText style={styles.themeNumber}>8</ThemedText>
          <View>
            <ThemedText style={styles.themeTitle}>
              8 Themes of places
            </ThemedText>
            <ThemedText style={styles.themeSubtitle}>for your Quest</ThemedText>
          </View>
        </View>

        {/************* Category Grid **************/}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.id} style={styles.gridCard}>
              <ThemedText style={styles.gridIcon}>{cat.icon}</ThemedText>
              <ThemedText style={styles.gridLabel}>{cat.name}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2F3D52",
  },

  /********* Top Area *********/
  topArea: {
    paddingHorizontal: 20,
    paddingTop: 60,
    gap: 20,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
  },

  statCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },

  statText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  statSub: {
    color: "#fff",
    fontSize: 12,
  },

  /********* Tags *********/
  tagsRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
    flexDirection: "row",
  },

  tagFilterIcon: {
    backgroundColor: "#EA815F",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  tagItem: {
    backgroundColor: "#EA815F",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },

  tagText: {
    color: "#fff",
    fontWeight: "600",
  },

  /********* AI Card *********/
  aiCard: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#5E7EB3",
  },

  aiLeft: {
    width: 80,
    height: 80,
    backgroundColor: "#FFFFFF20",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  aiTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  aiDesc: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 12,
  },

  /********* 8 Themes *********/
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },

  themeNumber: {
    fontSize: 60,
    color: "#EA815F",
    fontWeight: "bold",
  },

  themeTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },

  themeSubtitle: {
    color: "#fff",
    fontSize: 16,
  },

  /********* Grid *********/
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 40,
  },

  gridCard: {
    backgroundColor: "#E39B74",
    width: "48%",
    aspectRatio: 1.8,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  gridIcon: {
    fontSize: 28,
  },

  gridLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
