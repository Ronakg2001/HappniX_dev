import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, MapPin, MessageCircle, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { BrandHeader, EventCard, GhostButton, PostCard, Screen, SponsoredEventCard } from '@/components/happnix/kit';
import { colors } from '@/constants/brand';
import { featuredEvent, mockEvents, mockPosts } from '@/data/happnixMock';
import { eventApi, ticketApi } from '@/services/api';

export default function HomeScreen() {
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await eventApi.nearby(26.9124, 75.7873, 50);
      const nextEvents = response.data?.events || response.data?.items || [];
      if (nextEvents.length) setEvents(nextEvents);
    } catch {
      setEvents(mockEvents);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function book(event: any) {
    try {
      if (!event.id?.toString().startsWith('e') && !event.id?.toString().startsWith('sp')) {
        await ticketApi.book(event.id, 'General', 1);
      }
      Alert.alert('Booking started', `${event.title} has been added to your tickets.`);
    } catch (error: any) {
      Alert.alert('Booking unavailable', error.message);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <BrandHeader
          title="Jaipur"
          subtitle="10 km around you"
          right={
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
                <Bell color={colors.text} size={19} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/messages')}>
                <MessageCircle color={colors.text} size={19} />
              </TouchableOpacity>
            </View>
          }
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.pink} />}
        >
          <View style={styles.locationRow}>
            <GhostButton label="Jaipur" icon={<MapPin color={colors.pink} size={16} />} />
            <GhostButton label="Create Event" icon={<Plus color={colors.blue} size={16} />} onPress={() => router.push('/(tabs)/create')} />
          </View>

          <SponsoredEventCard event={featuredEvent} onBook={() => book(featuredEvent)} />

          {mockPosts.map((post) => <PostCard key={post.id} post={post} />)}
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => router.push({ pathname: '/event-detail', params: eventToParams(event) })}
              onBook={() => book(event)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function eventToParams(event: any) {
  return {
    id: String(event.id || ''),
    title: event.title || '',
    locationName: event.locationName || '',
    price: String(event.price || 0),
    currency: event.currency || 'INR',
    imageUrl: event.imageUrl || '',
    startLabel: event.date || event.startLabel || '',
    description: event.description || event.musicGenre || '',
  };
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  headerActions: { flexDirection: 'row', gap: 9 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
});
