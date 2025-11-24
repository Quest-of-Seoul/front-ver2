import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Images } from '@/constants/images';

export default function AIStationScreen() {
  const router = useRouter();

  const openCamera = () => {
    router.push('/camera-mode');
  };

  const openChat = () => {
    router.push('/chat-mode');
  };

  const openImageRecommendation = () => {
    router.push('/(tabs)/find/quest-recommendation');
  };

  const openQuestChat = () => {
    router.push('/quest-chat');
  };

  const openGeneralChat = () => {
    router.push('/general-chat');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Hi! I am your AI Docent
      </ThemedText>

      <View style={styles.buttonWrapper}>
        <Pressable style={styles.modeButton} onPress={openCamera}>
          <ThemedText style={styles.buttonText}>Camera Mode</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.modeButton} onPress={openChat}>
          <ThemedText style={styles.buttonText}>AI Chat Mode</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.modeButton} onPress={openImageRecommendation}>
          <ThemedText style={styles.buttonText}>Image Recommendation</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.modeButton} onPress={openQuestChat}>
          <ThemedText style={styles.buttonText}>Quest Chat</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.modeButton} onPress={openGeneralChat}>
          <ThemedText style={styles.buttonText}>General Chat</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.circleButtonRow}>
        <Pressable style={styles.circleButton} onPress={openCamera}>
          <Ionicons name="camera" size={28} color="#fff" />
        </Pressable>
        <Pressable style={styles.circleButton} onPress={openChat}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </Pressable>
      </View>

      <Image source={Images.docentTiger} style={styles.character} resizeMode="contain" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
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
  circleButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    marginTop: 10,
    marginBottom: 20,
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#76A7FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  character: {
    width: 240,
    height: 240,
    position: 'absolute',
    bottom: 30,
  },
});
