import { Tabs } from 'expo-router';
import { Calendar, Compass, Home, MessageSquarePlus, User } from 'lucide-react-native';
import { colors, fonts } from '@/constants/brand';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.48)',
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          height: 72,
          borderRadius: 22,
          paddingTop: 8,
          paddingBottom: 9,
          backgroundColor: 'rgba(18,18,26,0.92)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color }) => <Compass color={color} size={22} /> }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: ({ color }) => <MessageSquarePlus color={color} size={24} /> }} />
      <Tabs.Screen name="tickets" options={{ title: 'Events', tabBarIcon: ({ color }) => <Calendar color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
