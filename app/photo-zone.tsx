import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { useQuestStore } from '@/store/useQuestStore';

export default function PhotoZoneScreen() {
  const router = useRouter();
  const { activeQuest } = useQuestStore();
  const params = useLocalSearchParams();

  // quest_id로부터 이미지 URL 가져오기
  const questImageUrl = activeQuest?.quest.place_image_url || params.questImageUrl as string;
  const questName = activeQuest?.quest.name || params.questName as string || 'Gyeongbokgung Palace';

  const handleStart = () => {
    router.push({
      pathname: '/photo-zone-camera',
      params: {
        questId: activeQuest?.quest_id?.toString() || params.questId as string,
        questImageUrl: questImageUrl,
        questName: questName,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="camera" size={20} color="#fff" />
          <ThemedText style={styles.headerTitle}>{questName}</ThemedText>
        </View>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Photo Zone Title */}
      <View style={styles.titleContainer}>
        <LinearGradient
          colors={['#FF7F50', '#76C7AD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.titleGradient}
        >
          <ThemedText style={styles.photoZoneTitle}>Photo Zone</ThemedText>
        </LinearGradient>
      </View>

      {/* Quest Image and Placeholder */}
      <View style={styles.imageContainer}>
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={40} color="#666" />
          <Ionicons name="add-circle" size={24} color="#fff" style={styles.addIcon} />
        </View>
        {questImageUrl && (
          <Image
            source={{ uri: questImageUrl }}
            style={styles.questImage}
            resizeMode="cover"
          />
        )}
      </View>

      <ThemedText style={styles.questName}>{questName}</ThemedText>

      {/* Sparkle Background Effect */}
      <View style={styles.sparkleContainer}>
        {/* Sparkle effects can be added here */}
      </View>

      {/* START Button */}
      <Pressable style={styles.startButton} onPress={handleStart}>
        <ThemedText style={styles.startButtonText}>START!</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleGradient: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 20,
  },
  photoZoneTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  placeholderContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  addIcon: {
    position: 'absolute',
    bottom: 4,
    left: 4,
  },
  questImage: {
    flex: 1,
    height: 200,
    borderRadius: 12,
  },
  questName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  sparkleContainer: {
    flex: 1,
    // Sparkle effects can be added here
  },
  startButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  startButtonText: {
    color: '#5B7DFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
