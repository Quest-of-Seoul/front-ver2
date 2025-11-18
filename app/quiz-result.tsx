import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function QuizResultScreen() {
  const router = useRouter();
  const { score, detail } = useLocalSearchParams();

  const detailList: number[] = detail ? JSON.parse(detail as string) : [];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Quiz Results</ThemedText>

      <ThemedText style={styles.totalScore}>Total Score: {score}</ThemedText>

      <View style={styles.listBox}>
        {detailList.map((value, index) => (
          <ThemedText key={index} style={styles.item}>
            Q{index + 1}: +{value}p
          </ThemedText>
        ))}
      </View>

      <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/map')}>
        <ThemedText style={styles.buttonText}>Back to Map</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  totalScore: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '800',
  },
  listBox: {
    marginTop: 20,
    width: '100%',
    gap: 8,
  },
  item: {
    fontSize: 16,
  },
  button: {
    marginTop: 40,
    backgroundColor: '#5B7DFF',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});

