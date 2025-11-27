import { useState } from 'react';
import { Pressable, StyleSheet, View, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useQuestStore } from '@/store/useQuestStore';

export default function AIStationScreen() {
  const router = useRouter();
  const { activeQuest, endQuest } = useQuestStore();
  const [mode, setMode] = useState<'explore' | 'quest'>('explore');
  const [input, setInput] = useState('');

  // navigation handlers
  const openImageFind = () => router.push({
    pathname: '/(tabs)/find/quest-recommendation',
    params: { from: 'ai-station' }
  });
  const openAIChat = () => router.push('/general-chat');
  const openPlanChat = () => router.push('/travel-plan');
  const openAIPlusChat = () => router.push('/quest-chat');
  const openQuest = () => router.push('/quiz-mode');
  const openStampQuest = () => router.push('/stamp/stamp-quest' as any);

  const submitFromStation = () => {
    if (!input.trim()) return;
    router.push({
      pathname: '/general-chat',
      params: { init: input.trim() }
    });
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.menuButton} onPress={() => {
            Keyboard.dismiss();
            router.push('/chat-history');
          }}>
            <Ionicons name="menu" size={28} color="#fff" />
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>
            AI Station
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeTab, mode === 'explore' && styles.activeTab]}
            onPress={() => {
              Keyboard.dismiss();
              setMode('explore');
            }}
          >
            <ThemedText style={styles.tabText}>Explore Mode</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'quest' && styles.activeTab]}
            onPress={() => {
              Keyboard.dismiss();
              setMode('quest');
            }}
          >
            <ThemedText style={styles.tabText}>Quest Mode</ThemedText>
          </Pressable>
        </View>

        {/* Buttons Area */}
        <View style={styles.buttonWrapper}>
          {/* Explore Mode Buttons */}
          {mode === 'explore' && (
            <>
              <Pressable style={styles.modeButton} onPress={() => {
                Keyboard.dismiss();
                openAIChat();
              }}>
                <ThemedText style={styles.buttonText}>AI Chat</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable style={styles.modeButton} onPress={() => {
                Keyboard.dismiss();
                openPlanChat();
              }}>
                <ThemedText style={styles.buttonText}>Plan Chat</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable style={styles.modeButton} onPress={() => {
                Keyboard.dismiss();
                openImageFind();
              }}>
                <ThemedText style={styles.buttonText}>Image Find</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
            </>
          )}

          {/* Quest Mode Buttons */}
          {mode === 'quest' && (
            <>
              {/* Active Quest Status */}
              {activeQuest && (
                <View style={styles.activeQuestBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <ThemedText style={styles.activeQuestTitle}>Quest in Progress</ThemedText>
                    <ThemedText style={styles.activeQuestName}>{activeQuest.quest.name}</ThemedText>
                  </View>
                </View>
              )}
              
              <Pressable style={styles.modeButton} onPress={() => {
                Keyboard.dismiss();
                openAIPlusChat();
              }}>
                <ThemedText style={styles.buttonText}>AI Plus Chat</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable style={styles.modeButton} onPress={() => {
                Keyboard.dismiss();
                openQuest();
              }}>
                <ThemedText style={styles.buttonText}>Quest</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable style={styles.modeButton} onPress={() => {
                Keyboard.dismiss();
                openStampQuest();
              }}>
                <ThemedText style={styles.buttonText}>Stamp Quest</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable style={styles.modeButton} onPress={() => {
                Keyboard.dismiss();
                openImageFind();
              }}>
                <ThemedText style={styles.buttonText}>Image Find</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </Pressable>
              
              {activeQuest && (
                <Pressable style={styles.quitButton} onPress={() => {
                  Keyboard.dismiss();
                  endQuest();
                }}>
                  <ThemedText style={styles.quitText}>Quit this Quest</ThemedText>
                </Pressable>
              )}
            </>
          )}
        </View>

      </ThemedView>

      {/* Bottom Chat Input */}
      <View style={styles.bottomInputRow}>
        <TextInput
          style={styles.bottomInput}
          placeholder="Enter message..."
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submitFromStation}
          returnKeyType="send"
        />
        <Pressable style={styles.bottomSend} onPress={submitFromStation}>
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  menuButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#2F3F5B',
    padding: 4,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#5B7DFF',
  },
  tabText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  buttonWrapper: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  modeButton: {
    backgroundColor: '#5B7DFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeQuestBanner: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  activeQuestTitle: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  activeQuestName: {
    color: '#1B5E20',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  quitButton: {
    backgroundColor: '#FF884D',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  quitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E293B',
  },
  bottomInput: {
    flex: 1,
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    color: '#fff',
  },
  bottomSend: {
    marginLeft: 10,
    backgroundColor: '#5B7DFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
