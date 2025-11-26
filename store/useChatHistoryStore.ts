import { aiStationApi, type ChatSession, type ChatSessionResponse } from '@/services/api';
import { create } from 'zustand';

interface ChatHistoryStore {
    sessions: ChatSession[];
    currentSession: ChatSessionResponse | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchChatList: (params?: {
        limit?: number;
        mode?: 'explore' | 'quest';
        function_type?: 'rag_chat' | 'vlm_chat' | 'route_recommend';
    }) => Promise<void>;
    fetchChatSession: (sessionId: string) => Promise<void>;
    clearCurrentSession: () => void;
}

export const useChatHistoryStore = create<ChatHistoryStore>((set, get) => ({
    sessions: [],
    currentSession: null,
    isLoading: false,
    error: null,

    fetchChatList: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const response = await aiStationApi.getChatList(params);
            set({ sessions: response.sessions, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch chat list:', error);
            set({
                error: error instanceof Error ? error.message : '채팅 목록을 불러오는데 실패했습니다.',
                isLoading: false,
            });
        }
    },

    fetchChatSession: async (sessionId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await aiStationApi.getChatSession(sessionId);
            set({ currentSession: response, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch chat session:', error);
            set({
                error: error instanceof Error ? error.message : '채팅 내역을 불러오는데 실패했습니다.',
                isLoading: false,
            });
        }
    },

    clearCurrentSession: () => {
        set({ currentSession: null });
    },
}));

