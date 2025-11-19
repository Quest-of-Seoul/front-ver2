import { Platform } from 'react-native';
import Constants from "expo-constants";

const getApiBaseUrl = () => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (apiUrl) {
    console.log('API URL:', apiUrl);
    return apiUrl;
  }

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:8000';
    }
  }
};

const API_BASE_URL = getApiBaseUrl();

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
      console.log('Fetching quests from:', `${API_BASE_URL}/quest/list`);

      const response = await fetch(`${API_BASE_URL}/quest/list`, {
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
