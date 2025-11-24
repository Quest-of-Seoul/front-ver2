// React Native에서 localhost 접근을 위한 URL 설정
// Expo Go 앱 사용 시: 컴퓨터의 로컬 IP 주소 필요
// iOS 시뮬레이터 (네이티브 빌드): localhost
// Android 에뮬레이터: 10.0.2.2
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Expo Go를 사용하는 경우 로컬 IP 사용
    // 변경 필요시 여기를 수정하세요
    return 'http://192.168.200.214:8000';

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
  district?: string;
  place_image_url?: string;
  distance_km?: number;
}

export interface QuestListResponse {
  quests: Quest[];
}

export interface FilterRequest {
  categories?: string[];
  districts?: string[];
  sort_by?: 'nearest' | 'rewarded' | 'newest';
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  limit?: number;
}

export interface FilterResponse {
  success: boolean;
  count: number;
  quests: Quest[];
  filters_applied: {
    categories: string[];
    districts: string[];
    sort_by: string;
  };
}

export interface SearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  count: number;
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

  async getFilteredQuests(filterParams: FilterRequest): Promise<FilterResponse> {
    try {
      console.log('Fetching filtered quests from:', `${API_BASE_URL}/map/filter`);
      console.log('Filter params:', filterParams);

      const response = await fetch(`${API_BASE_URL}/map/filter`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterParams),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FilterResponse = await response.json();
      console.log('Fetched filtered quest count:', data.count);
      return data;
    } catch (error) {
      console.error('Failed to fetch filtered quests:', error);
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('서버에 연결할 수 없습니다. API 서버가 실행 중인지 확인해주세요.');
      }
      throw error;
    }
  },

  async searchQuests(searchParams: SearchRequest): Promise<SearchResponse> {
    try {
      console.log('Searching quests from:', `${API_BASE_URL}/map/search`);
      console.log('Search params:', searchParams);

      const response = await fetch(`${API_BASE_URL}/map/search`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      console.log('Search result count:', data.count);
      return data;
    } catch (error) {
      console.error('Failed to search quests:', error);
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

      const response = await fetch(`${API_BASE_URL}/docent/quiz?landmark=${encodeURIComponent(landmark)}&language=${language}`, {
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
