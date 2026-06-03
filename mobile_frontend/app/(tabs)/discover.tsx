import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { BrandHeader, Chip, EmptyState, EventCard, PersonCard, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';
import { mockEvents, suggestedPeople } from '@/data/happnixMock';
import { EVENT_CATEGORIES, eventApi, userApi } from '@/services/api';

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const response = await eventApi.nearby(26.9124, 75.7873, 75);
      const nextEvents = response.data?.events || [];
      if (nextEvents.length) setEvents(nextEvents);
    } catch {
      setEvents(mockEvents);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setUsers([]);
        return;
      }
      setLoading(true);
      try {
        const response = await userApi.search(query.trim());
        setUsers(response.data?.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const filteredEvents = category
    ? events.filter((event) => `${event.eventCategory || event.category || ''}`.toLowerCase() === category.toLowerCase())
    : events;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <BrandHeader title="Discover" subtitle="Events, squads, and hosts nearby" />
        <View style={styles.searchBar}>
          <Search color={colors.faint} size={19} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people, DJs, events..."
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            style={styles.input}
          />
          {loading ? <ActivityIndicator color={colors.pink} /> : null}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {query.length >= 2 ? (
            users.length ? (
              users.map((user) => <PersonCard key={user.id || user.sql_user_id || user.username} person={user} actionLabel={user.is_following ? 'Following' : 'View'} />)
            ) : (
              <EmptyState title="No people found" body="Try a username, host name, or DJ alias." />
            )
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip label="All" active={!category} onPress={() => setCategory('')} />
                {EVENT_CATEGORIES.slice(0, 12).map((item) => (
                  <Chip key={item} label={item} active={category === item} onPress={() => setCategory(category === item ? '' : item)} />
                ))}
              </ScrollView>

              {suggestedPeople.map((person) => <PersonCard key={person.id} person={person} />)}

              {filteredEvents.length ? (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => router.push({ pathname: '/event-detail', params: { id: String(event.id), title: event.title } })}
                  />
                ))
              ) : (
                <EmptyState title="No events found" body="Try another category or expand your radius." />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  chips: { gap: 8, paddingBottom: 16 },
});
