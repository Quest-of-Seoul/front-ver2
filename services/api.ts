import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

export interface Quest {
  id: number;
  place_id: string | null;
  name: string;
  title: string | null;
  description: string;
  category: string | null;
  latitude: number;
  longitude: number;
  reward_point: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  completion_count: number;
  created_at: string;
}

export interface QuestListResponse {
  quests: Quest[];
}

export const questApi = {
  async getQuestList(): Promise<Quest[]> {
    try {
      console.log('Fetching quests from:', `${API_URL}/quest/list`);

      const response = await fetch(`${API_URL}/quest/list`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QuestListResponse = await response.json();
      console.log('Fetched quest count:', data.quests.length);
      return data.quests;
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해주세요.');
      }
      throw error;
    }
  },
};

export interface QuizResponse {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizItem {
  id: number;
  place: string;
  question: string;
  choices: string[];
  answer: string;
  description: string;
  hint: string;
}

export const quizApi = {
  async getQuiz(landmark: string, language: string = 'en'): Promise<QuizResponse> {
    try {
      console.log('Fetching quiz for:', landmark);

      const response = await fetch(`${API_URL}/docent/quiz?landmark=${encodeURIComponent(landmark)}&language=${language}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QuizResponse = await response.json();
      console.log('Fetched quiz:', data.question);
      return data;
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해주세요.');
      }
      throw error;
    }
  },

  async getMultipleQuizzes(landmark: string, count: number = 5, language: string = 'en'): Promise<QuizItem[]> {
    try {
      console.log(`Fetching ${count} quizzes for:`, landmark);

      const quizPromises = Array.from({ length: count }, () =>
        this.getQuiz(landmark, language)
      );

      const responses = await Promise.all(quizPromises);

      const quizItems: QuizItem[] = responses.map((response, index) => ({
        id: index + 1,
        place: landmark,
        question: response.question,
        choices: response.options,
        answer: response.options[response.correct_answer],
        description: response.explanation || '',
        hint: 'Think carefully about this question!',
      }));

      console.log(`Fetched ${quizItems.length} quizzes`);
      return quizItems;
    } catch (error) {
      console.error('Failed to fetch multiple quizzes:', error);
      throw error;
    }
  },
};
