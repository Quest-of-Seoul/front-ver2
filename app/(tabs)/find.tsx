import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FindScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Find</ThemedText>
      <ThemedText style={styles.description}>
        검색 기능이 들어갈 화면입니다.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    marginTop: 12,
    textAlign: 'center',
  },
});
