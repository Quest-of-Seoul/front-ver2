import { create } from 'zustand';
import { pointsApi, type PointsResponse, type PointTransaction } from '@/services/api';

interface PointsStore {
  totalPoints: number;
  transactions: PointTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPoints: () => Promise<void>;
  refreshPoints: () => Promise<void>;
}

export const usePointsStore = create<PointsStore>((set, get) => ({
  totalPoints: 0,
  transactions: [],
  isLoading: false,
  error: null,

  fetchPoints: async () => {
    set({ isLoading: true, error: null });
    try {
      const response: PointsResponse = await pointsApi.getPoints();
      set({
        totalPoints: response.total_points || 0,
        transactions: response.transactions || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch points:', error);
      set({
        error: error instanceof Error ? error.message : '포인트를 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  },

  refreshPoints: async () => {
    await get().fetchPoints();
  },
}));

