import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import api from '../services/api';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold,
    Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
    Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, Outfit_900Black
  });
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Prevent routing before segments are mounted
      if (!segments.length) return;

      try {
        const inAuthGroup = segments[0] === '(auth)';
        let isAuthenticated = false;

        try {
          await api.get('/api/profile/me');
          isAuthenticated = true;
        } catch (e) {
          isAuthenticated = false;
        }

        if (!isAuthenticated && !inAuthGroup) {
          router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, [segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event-detail" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
