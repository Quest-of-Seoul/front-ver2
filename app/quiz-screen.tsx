import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Images } from '@/constants/images';
import { quizApi, QuizItem } from '@/services/api';

export default function QuizScreen() {
  const router = useRouter();
  const { landmark } = useLocalSearchParams<{ landmark: string }>();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const quiz = quizzes[step];

  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const [totalScore, setTotalScore] = useState(25);
  const [scoreList, setScoreList] = useState<number[]>([]);
  const [progress, setProgress] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await quizApi.getMultipleQuizzes(landmark || 'Gyeongbokgung Palace', 5, 'en');
        setQuizzes(data);
      } catch (err) {
        console.error('Failed to load quizzes:', err);
        setError('Failed to load quizzes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [landmark]);

  const onSelect = (choice: string) => {
    if (isCorrect !== null) return;

    const correct = choice === quiz.answer;
    setSelected(choice);
    setIsCorrect(correct);

    const earned = correct ? 60 : 5;
    setTotalScore(prev => prev + earned);
    setScoreList(prev => [...prev, earned]);
    setProgress(prev => [...prev, correct ? 'correct' : 'wrong']);

    setShowResult(true);
  };

  const onHintPress = () => {
    if (hintUsed) {
      setShowHint(true);
      return;
    }

    setTotalScore(prev => prev - 5);
    setHintUsed(true);
    setShowHint(true);
  };

  const onContinue = () => {
    const isLast = step === quizzes.length - 1;

    if (isLast) {
      router.push({
        pathname: '/quiz-result',
        params: { score: totalScore, detail: JSON.stringify(scoreList) },
      });
    } else {
      setStep(step + 1);
      setSelected(null);
      setIsCorrect(null);
      setShowResult(false);
      setHintUsed(false);
    }
  };

  const isLastProblem = step === quizzes.length - 1;

  if (loading) {
    return (
      <ImageBackground source={Images.quizBackground} style={styles.background}>
        <View style={styles.overlay} />
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#FFA46F" />
          <ThemedText style={{ color: '#fff', marginTop: 20 }}>Loading quizzes...</ThemedText>
        </View>
      </ImageBackground>
    );
  }

  if (error || !quiz) {
    return (
      <ImageBackground source={Images.quizBackground} style={styles.background}>
        <View style={styles.overlay} />
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <ThemedText style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>
            {error || 'No quiz available'}
          </ThemedText>
          <Pressable style={styles.hintBtn} onPress={() => router.back()}>
            <ThemedText style={styles.hintBtnText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={Images.quizBackground} style={styles.background}>
      <View style={styles.overlay} />

      <Modal transparent visible={showHint} animationType="fade">
        <View style={styles.hintOverlay}>
          <View style={styles.hintBox}>
            <View style={styles.hintHeader}>
              <ThemedText style={styles.hintTitle}>HINT</ThemedText>
              <Pressable onPress={() => setShowHint(false)}>
                <Ionicons name="close" size={26} color="#fff" />
              </Pressable>
            </View>
            <ThemedText style={styles.hintText}>{quiz.hint}</ThemedText>
            <View style={styles.hintTail} />
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>

          <View style={styles.scoreListBox}>
            {scoreList.map((value, index) => (
              <ThemedText
                key={index}
                style={[
                  styles.scoreItem,
                  progress[index] === 'correct' ? styles.scoreCorrect : styles.scoreWrong,
                ]}
              >
                {value}
              </ThemedText>
            ))}
          </View>

          <View style={styles.totalBox}>
            <ThemedText style={styles.totalText}>{totalScore}</ThemedText>
          </View>
        </View>

        <View style={styles.progressRow}>
          {quizzes.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    progress[i] === 'correct'
                      ? '#FFA46F'
                      : progress[i] === 'wrong'
                      ? '#58CC7B'
                      : 'rgba(255,255,255,0.2)',
                },
              ]}
            />
          ))}
        </View>

        <Image source={Images.docentFace} style={styles.docent} />

        {showResult && (
          <View style={styles.resultCard}>
            <ThemedText
              style={[
                styles.resultTitle,
                isCorrect ? styles.correctText : styles.wrongText,
              ]}
            >
              {isCorrect ? 'Correct!' : 'Oops!'}
            </ThemedText>
            <ThemedText style={styles.resultDesc}>{quiz.description}</ThemedText>
            <View style={styles.resultTail} />
          </View>
        )}

        {!showResult && (
          <View style={styles.questionCard}>
            <ThemedText type="subtitle" style={styles.qIndex}>
              Q{quiz.id}
            </ThemedText>
            <ThemedText style={styles.question}>{quiz.question}</ThemedText>
          </View>
        )}

        <View style={styles.choiceWrapper}>
          {quiz.choices.map((c, i) => {
            const isAnswer = c === quiz.answer;
            const isSelectedChoice = selected === c;

            let bg = 'transparent';
            if (showResult) {
              if (isAnswer) bg = 'rgba(88,204,123,0.35)';
              if (isSelectedChoice && !isAnswer) bg = 'rgba(255,100,80,0.35)';
            }

            return (
              <Pressable
                key={i}
                style={[styles.choice, { backgroundColor: bg }]}
                disabled={showResult}
                onPress={() => onSelect(c)}
              >
                <ThemedText style={styles.choiceText}>{c}</ThemedText>

                {showResult && isSelectedChoice && (
                  <ThemedText style={styles.choicePoint}>
                    {isCorrect ? '+60p' : '+5p'}
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </View>

        {!showResult && (
          <Pressable style={styles.hintBtn} onPress={onHintPress}>
            <Ionicons
              name={hintUsed ? 'lock-open' : 'lock-closed'}
              size={20}
              color="#fff"
            />
            <ThemedText style={styles.hintBtnText}>
              {hintUsed ? 'Unlocked Hint' : 'Need Hint?   - $5'}
            </ThemedText>
          </Pressable>
        )}

        {showResult && (
          <Pressable
            style={[
              styles.continueBtn,
              isCorrect ? styles.continueCorrect : styles.continueWrong,
            ]}
            onPress={onContinue}
          >
            <ThemedText style={styles.continueText}>
              {isLastProblem
                ? isCorrect
                  ? '+ 60p  See Results!'
                  : '+ 5p  See Results!'
                : isCorrect
                ? '+ 60p  Continue'
                : '+ 5p  Continue'}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  scoreListBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  scoreItem: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreCorrect: { color: '#FFA46F' },
  scoreWrong: { color: '#58CC7B' },
  totalBox: {
    backgroundColor: '#76A7FF',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  totalText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 40,
    height: 6,
    borderRadius: 4,
  },
  docent: {
    width: 70,
    height: 70,
    marginBottom: 20,
  },
  questionCard: {
    width: '100%',
    backgroundColor: '#FDF2E9',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  qIndex: { marginBottom: 10, color: '#000' },
  question: { textAlign: 'center', fontSize: 16, lineHeight: 22, color: '#000' },
  choiceWrapper: {
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  choice: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  choiceText: { color: '#fff', fontSize: 16 },
  choicePoint: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -10,
    color: '#fff',
    fontWeight: '700',
  },
  hintBtn: {
    marginTop: 25,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  continueBtn: {
    marginTop: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  continueCorrect: {
    backgroundColor: '#FFA46F',
  },
  continueWrong: {
    backgroundColor: '#58CC7B',
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    backgroundColor: '#FDF2E9',
  },
  resultTail: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    backgroundColor: '#FDF2E9',
    transform: [{ rotate: '45deg' }],
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  correctText: { color: '#FF6F41' },
  wrongText: { color: '#58CC7B' },
  resultDesc: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#000',
  },
  hintOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintBox: {
    width: '85%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
    borderRadius: 20,
    position: 'relative',
  },
  hintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hintTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hintText: { color: '#fff', fontSize: 16, lineHeight: 22 },
  hintTail: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    transform: [{ rotate: '45deg' }],
  },
});

