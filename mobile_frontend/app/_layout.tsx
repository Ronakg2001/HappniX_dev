import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import {
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
  useFonts,
} from '@expo-google-fonts/outfit';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#050508' } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event-detail" options={{ presentation: 'card' }} />
          <Stack.Screen name="messages" />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
          <Stack.Screen name="requests" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
