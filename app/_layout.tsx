import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="camera-mode" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="chat-mode" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="quiz-mode" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="quiz-screen" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="quiz-result" options={{ title: 'Quiz Results' }} />
        <Stack.Screen name="quest-ai-chat" options={{ title: 'Quest AI Chat' }} />
        <Stack.Screen name="quest-recommendation" options={{ title: 'AI Docent Recommendations' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
