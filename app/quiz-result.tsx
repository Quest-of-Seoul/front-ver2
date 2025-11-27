import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function QuizResultScreen() {
  const router = useRouter();
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
  const isQuestMode = params.isQuestMode === 'true';
  const questCompleted = params.questCompleted === 'true';
  const rewardPoint = params.rewardPoint ? parseInt(params.rewardPoint) : 0;
  const questName = params.questName || 'Quest';
  const alreadyCompleted = params.alreadyCompleted === 'true';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">
        {isQuestMode ? 'Quest Complete!' : 'Quiz Results'}
      </ThemedText>

      {isQuestMode && (
        <ThemedText style={styles.questName}>{questName}</ThemedText>
      )}

      <ThemedText style={styles.totalScore}>
        Quiz Score: {score}
      </ThemedText>

      {isQuestMode && (
        alreadyCompleted ? (
          <View style={styles.infoBox}>
            <ThemedText style={styles.infoTitle}>ℹ️ Already Completed</ThemedText>
            <ThemedText style={styles.infoText}>
              You've already completed this quest before
            </ThemedText>
            <ThemedText style={styles.infoSubtext}>
              No additional points awarded
            </ThemedText>
          </View>
        ) : (
          <View style={styles.rewardBox}>
            <ThemedText style={styles.rewardTitle}>🎉 Quest Completed!</ThemedText>
            <ThemedText style={styles.rewardText}>
              Earned: +{score} points
            </ThemedText>
          </View>
        )
      )}

      <View style={styles.listBox}>
        <ThemedText style={styles.detailTitle}>Score Breakdown:</ThemedText>
        {detailList.map((value, index) => (
          <ThemedText key={index} style={styles.item}>
            Q{index + 1}: +{value}p {value === 20 ? '✓' : value === 10 ? '⚠️' : ''}
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
  questName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },
  totalScore: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '800',
  },
  rewardBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  failBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  failText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  failSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  infoBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#FFA726',
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  listBox: {
    marginTop: 20,
    width: '100%',
    gap: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
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

