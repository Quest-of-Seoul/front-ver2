import { useState } from 'react';
import { Pressable, StyleSheet, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

type ChatItem = {
  id: string;
  message: string;
  location?: string;
  timestamp: Date;
};

export default function ChatHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'ai' | 'plus' | 'plan'>('ai');

  // dummy data
  const chatsAI: ChatItem[] = [
    {
      id: '1',
      message: 'Where is the gangnam style statue?',
      timestamp: new Date('2024-11-25T11:38:00'),
    },
  ];

  const chatsPlus: ChatItem[] = [
    {
      id: '2',
      message: `What is 'gung'? I see lots of gung in the map.`,
      location: 'Gyeongbokgung Palace',
      timestamp: new Date('2024-11-25T11:38:00'),
    },
  ];

  const chatsPlan: ChatItem[] = [
    {
      id: '3',
      message: 'Jongno-gu,History/Culture',
      timestamp: new Date('2024-11-25T11:38:00'),
    },
  ];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin} mins ago`;
    return `${date.getDate()}/${date.getMonth()+1}/${String(date.getFullYear()).slice(2)} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
  };

  const renderItem = ({ item }: { item: ChatItem }) => (
    <View style={styles.chatCard}>
      <ThemedText style={styles.message}>{item.message}</ThemedText>
      {item.location && (
        <ThemedText style={styles.location}>{item.location}</ThemedText>
      )}
      <ThemedText style={styles.time}>{formatTime(item.timestamp)}</ThemedText>
    </View>
  );

  const getData = () => {
    if (tab === 'ai') return chatsAI;
    if (tab === 'plus') return chatsPlus;
    return chatsPlan;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>
          Chat History
        </ThemedText>
        <View>
          <ThemedText style={styles.modeBadge}>Explore Mode</ThemedText>
        </View>
      </View>

      {/* Chat Type Intro */}
      <View style={styles.typeBox}>
        {tab === 'ai' && (
          <>
            <Ionicons name="sparkles" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>AI Chat</ThemedText>
            <ThemedText style={styles.typeDesc}>
              Check what you've discovered about Seoul!
            </ThemedText>
          </>
        )}
        {tab === 'plus' && (
          <>
            <Ionicons name="star" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>AI PLUS Chat</ThemedText>
            <ThemedText style={styles.typeDesc}>
              You went to the landmark and learned more! that's a plus!
            </ThemedText>
          </>
        )}
        {tab === 'plan' && (
          <>
            <Ionicons name="trail-sign" size={36} color="#fff" />
            <ThemedText style={styles.typeTitle}>Plan Chat</ThemedText>
            <ThemedText style={styles.typeDesc}>
              Keep these plans in mind and just get started to move
            </ThemedText>
          </>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabItem, tab === 'ai' && styles.tabActive]}
          onPress={() => setTab('ai')}
        >
          <ThemedText style={styles.tabText}>AI Chat</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'plus' && styles.tabActive]}
          onPress={() => setTab('plus')}
        >
          <ThemedText style={styles.tabText}>AI PLUS Chat</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'plan' && styles.tabActive]}
          onPress={() => setTab('plan')}
        >
          <ThemedText style={styles.tabText}>Plan Chat</ThemedText>
        </Pressable>
      </View>

      {/* Chat list */}
      <FlatList
        data={getData()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modeBadge: {
    backgroundColor: '#3E4A63',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
  },
  typeBox: {
    backgroundColor: '#2F3F5B',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  typeTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  typeDesc: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
    color: '#C7D3EA',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#2F3F5B',
    padding: 4,
    borderRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#5B7DFF',
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
  },
  chatCard: {
    backgroundColor: '#1F2A3D',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#8FB5FF',
  },
  time: {
    marginTop: 6,
    fontSize: 12,
    color: '#A5B4CC',
  },
});

