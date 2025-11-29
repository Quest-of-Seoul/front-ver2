import { View, Image, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";

export default function DayPassScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Day Pass Purchase</ThemedText>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Background Image */}
      <Image
        source={require("@/assets/images/store_pass.png")}
        style={styles.bgImage}
      />

      {/* Tiger Character */}
      <Image
        source={require("@/assets/images/c_3.png")}
        style={styles.tiger}
        resizeMode="contain"
      />

      {/* Title */}
      <View style={styles.titleBox}>
        <ThemedText style={styles.title}>Quest of Seoul{'\n'}Day Pass Trials</ThemedText>
      </View>

      {/* 3-day pass option */}
      <View style={styles.passCard}>
        <ThemedText style={styles.passTitle}>3 Day</ThemedText>

        <ThemedText style={styles.passDesc}>⚡ Mint 1.3X collects</ThemedText>
        <ThemedText style={styles.passDesc}>∞ Infinite AI Docent Chat</ThemedText>
        <ThemedText style={styles.passDesc}>✨ Automatic tour route generate</ThemedText>

        <ThemedText style={styles.price}>12 $ (72hrs)</ThemedText>
      </View>

      {/* CTA Button */}
      <Pressable style={styles.ctaButton}>
        <ThemedText style={styles.ctaText}>Get Day Pass Trial · 3 Day</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  bgImage: {
    width: "100%",
    height: 180,
    opacity: 0.7,
  },

  tiger: {
    width: 150,
    height: 150,
    position: "absolute",
    top: 120,
    right: 10,
  },

  titleBox: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },

  passCard: {
    backgroundColor: "#1A2D48",
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  passTitle: {
    color: "#7DFFA4",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  passDesc: {
    color: "#C7D5EB",
    fontSize: 14,
    marginBottom: 6,
  },
  price: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },

  ctaButton: {
    backgroundColor: "#FF865E",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },
  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
