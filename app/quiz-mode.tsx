import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Images } from '@/constants/images';
import { useQuestStore } from '@/store/useQuestStore';

export default function QuizModeScreen() {
  const router = useRouter();
  const { activeQuest } = useQuestStore();

  // Access quest_id and place_id from active quest
  const questId = activeQuest?.quest_id;
  const placeId = activeQuest?.place_id;
  const questName = activeQuest?.quest.name || 'Unknown Place';
  const rewardPoint = activeQuest?.quest.reward_point || 300;

  console.log('Quiz Mode - Active Quest:', { questId, placeId, questName, rewardPoint });

  const close = () => router.back();
  const startQuiz = () => {
    if (questId) {
      // Quest mode: pass quest_id to use quest quizzes with scoring system
      router.push({
        pathname: '/quiz-screen',
        params: { 
          questId: questId.toString(),
          questName: questName,
          rewardPoint: rewardPoint.toString(),
          quizScoreMax: "100",
          perQuestionScore: "20",
          hintPenaltyScore: "10",
        },
      });
    } else {
      // Fallback to general quiz mode
      router.push({
        pathname: '/quiz-screen',
        params: { landmark: questName },
      });
    }
  };

  return (
    <ImageBackground source={Images.quizBackground} style={styles.background} resizeMode="cover">
      <ThemedView style={styles.overlay} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={close} style={styles.closeBtn}>
            <Ionicons name="close" size={32} color="#fff" />
          </Pressable>
          <View style={styles.pointBox}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <ThemedText style={styles.pointText}>25</ThemedText>
          </View>
        </View>

        <Image source={Images.docentTiger} style={styles.logo} resizeMode="contain" />
        <ThemedText style={styles.title}>QuestTime</ThemedText>

        <Image source={Images.quizThumbnail} style={styles.thumbnail} resizeMode="cover" />

        <ThemedText type="subtitle" style={styles.placeName}>
          {questName}
        </ThemedText>

        {questId ? (
          <>
            <ThemedText style={styles.points}>Quiz Score: 100 pts</ThemedText>
            <ThemedText style={styles.subPoints}>5 questions × 20 pts each</ThemedText>
            <ThemedText style={[styles.points, { marginTop: 8, fontSize: 16 }]}>
              Quest Reward: {rewardPoint} pts
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={styles.points}>Total {rewardPoint} pts</ThemedText>
            <ThemedText style={styles.subPoints}>5 questions × 60 pts each</ThemedText>
          </>
        )}

        <Pressable style={styles.startBtn} onPress={startQuiz}>
          <ThemedText style={styles.startBtnText}>START!</ThemedText>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    padding: 8,
  },
  pointBox: {
    flexDirection: 'row',
    backgroundColor: '#5B7DFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  pointText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    color: '#FFA46F',
    fontWeight: '900',
    marginBottom: 40,
  },
  thumbnail: {
    width: 180,
    height: 140,
    borderRadius: 18,
    marginBottom: 20,
  },
  placeName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 25,
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFA46F',
  },
  subPoints: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 40,
    color: '#fff',
  },
  startBtn: {
    backgroundColor: '#FF8A47',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 30,
    marginTop: 10,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});

