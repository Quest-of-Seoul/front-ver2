import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

export default function QuestRecommendationScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Quest Recommendation</ThemedText>
      <ThemedText style={styles.subtitle}>
        AI Docent will help you find the best tour route
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  subtitle: {
    marginTop: 12,
    textAlign: "center",
    opacity: 0.7,
  },
});
