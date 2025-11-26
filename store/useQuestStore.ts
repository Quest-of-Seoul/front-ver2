import { create } from 'zustand';
import type { Quest } from '@/services/api';

interface ActiveQuest {
  quest_id: number;
  place_id: string | null;
  quest: Quest;
}

interface QuestStore {
  selectedQuests: Quest[];
  activeQuest: ActiveQuest | null;
  addQuest: (quest: Quest) => void;
  removeQuest: (questId: number) => void;
  clearQuests: () => void;
  isQuestSelected: (questId: number) => boolean;
  startQuest: (quest: Quest) => void;
  endQuest: () => void;
}

export const useQuestStore = create<QuestStore>((set, get) => ({
  selectedQuests: [],
  activeQuest: null,

  addQuest: (quest: Quest) => {
    const { selectedQuests } = get();

    // 이미 선택된 퀘스트인지 확인
    if (selectedQuests.some(q => q.id === quest.id)) {
      return;
    }

    // 최대 4개까지만 선택 가능
    if (selectedQuests.length >= 4) {
      console.log('Maximum 4 quests can be selected');
      return;
    }

    set({ selectedQuests: [...selectedQuests, quest] });
  },

  removeQuest: (questId: number) => {
    set(state => ({
      selectedQuests: state.selectedQuests.filter(q => q.id !== questId)
    }));
  },

  clearQuests: () => {
    set({ selectedQuests: [] });
  },

  isQuestSelected: (questId: number) => {
    return get().selectedQuests.some(q => q.id === questId);
  },

  startQuest: (quest: Quest) => {
    set({
      activeQuest: {
        quest_id: quest.id,
        place_id: quest.place_id,
        quest: quest,
      }
    });
  },

  endQuest: () => {
    set({ activeQuest: null });
  },
}));
