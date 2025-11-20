// React Native에서 localhost 접근을 위한 URL 설정
// Expo Go 앱 사용 시: 컴퓨터의 로컬 IP 주소 필요
// iOS 시뮬레이터 (네이티브 빌드): localhost
// Android 에뮬레이터: 10.0.2.2
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Expo Go를 사용하는 경우 로컬 IP 사용
    // 변경 필요시 여기를 수정하세요
    return 'http://192.168.219.114:8000';

    // 네이티브 빌드를 사용하는 경우 아래 코드 주석 해제
    // if (Platform.OS === 'android') {
    //   return 'http://10.0.2.2:8000';
    // }
    // return 'http://localhost:8000';
  }
  // 프로덕션 환경
  return 'https://your-production-api.com';
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
