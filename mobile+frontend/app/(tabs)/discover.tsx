import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  Dimensions, TouchableOpacity, Image, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, BadgeCheck, MapPin, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { userApi, eventApi, EVENT_CATEGORIES } from '../../services/api';
import { eventToParams } from '../../utils/navigation';
import PartyLoader from '../../components/ui/party-loader';

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNearbyEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNearbyEvents().finally(() => setRefreshing(false));
  }, []);

  const fetchNearbyEvents = async () => {
    try {
      const res = await eventApi.nearby(28.7041, 77.1025, 50);
      setEvents(res.data.events || []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    try {
      const res = await userApi.search(q);
      setUsers(res.data.users || []);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => searchUsers(text), 400);
    setSearchTimer(timer);
  };

  const filteredEvents = selectedCategory
    ? events.filter((e: any) => (e.eventCategory || '').toLowerCase() === selectedCategory)
    : events;

  const renderUserItem = (user: any) => {
    let badge = '';
    if (user.is_following) badge = 'Following';
    else if (user.follow_request_pending) badge = 'Requested';
    else if (user.follows_you) badge = 'Follows you';

    return (
      <TouchableOpacity
        key={user.username || user.sql_user_id || user.id}
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: `/profile/${user.id || user.sql_user_id}` as any })}
      >
        <View style={styles.userAvatar}>
          {user.profile_picture_url ? (
            <Image source={{ uri: user.profile_picture_url }} style={styles.userAvatarImg} />
          ) : (
            <Text style={styles.userAvatarText}>{(user.username || 'U').charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>{user.username}</Text>
            {user.gov_id_verified && <BadgeCheck color="#47e8ff" size={14} />}
          </View>
          {user.full_name ? <Text style={styles.userFullName} numberOfLines={1}>{user.full_name}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.followStateBadge}>
            <Text style={styles.followStateBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderEventCard = (event: any) => (
    <TouchableOpacity
      key={event.id}
      style={styles.eventCard}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/event-detail', params: eventToParams(event) })}
    >
      <View style={styles.eventImageWrap}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
        ) : (
          <LinearGradient colors={['#7c3aed', '#c026d3']} style={styles.eventImagePlaceholder}>
            <Text style={styles.eventImageChar}>{(event.title || 'E').charAt(0)}</Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <View style={styles.eventMeta}>
          <MapPin color="#d946ef" size={12} />
          <Text style={styles.eventMetaText} numberOfLines={1}>{event.locationName}</Text>
        </View>
        <View style={styles.eventMeta}>
          <Calendar color="#22d3ee" size={12} />
          <Text style={styles.eventMetaText}>
            {event.startAt ? new Date(event.startAt).toLocaleDateString() : 'TBD'}
          </Text>
        </View>
        <Text style={styles.eventPrice}>
          {parseFloat(event.price) === 0 ? 'Free' : `${event.currency} ${event.price}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.orb, styles.orbViolet]} />
          <View style={[styles.orb, styles.orbCyan]} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Search color="#64748b" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search people, DJs, events..."
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
            />
            {loadingUsers && <ActivityIndicator size="small" color="#d946ef" />}
          </View>
        </View>

        {refreshing && (
          <View style={{ position: 'absolute', top: 120, left: 0, right: 0, zIndex: 50, alignItems: 'center' }}>
            <PartyLoader />
          </View>
        )}
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="transparent" colors={['transparent']} />
          }
        >
          {/* User Search Results */}
          {users.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PEOPLE</Text>
              {users.map(renderUserItem)}
            </View>
          )}

          {query.length >= 2 && users.length === 0 && !loadingUsers && (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No people found for "{query}"</Text>
            </View>
          )}

          {/* Category Chips */}
          {!query && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CATEGORIES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !selectedCategory && styles.chipActive]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {EVENT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, selectedCategory === cat.toLowerCase() && styles.chipActive]}
                    onPress={() => setSelectedCategory(prev => prev === cat.toLowerCase() ? '' : cat.toLowerCase())}
                  >
                    <Text style={[styles.chipText, selectedCategory === cat.toLowerCase() && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Events Grid */}
          {!query && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NEARBY EVENTS</Text>
              {loadingEvents ? (
                <ActivityIndicator size="large" color="#47e8ff" style={{ marginTop: 30 }} />
              ) : filteredEvents.length > 0 ? (
                <View style={styles.eventsGrid}>
                  {filteredEvents.map(renderEventCard)}
                </View>
              ) : (
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>No events found nearby</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.18 },
  orbViolet: { top: -50, right: '-20%', backgroundColor: '#ff4fd8' },
  orbCyan: { bottom: -100, left: '-30%', backgroundColor: '#47e8ff' },

  searchWrapper: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, zIndex: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  searchIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Sora_400Regular', color: '#f8f9ff', padding: 0 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 150 },

  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, color: '#9ca3af', letterSpacing: 2, marginBottom: 12 },

  // User cards
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center',
  },
  userAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  userAvatarText: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#f8f9ff' },
  userFullName: { fontFamily: 'Sora_400Regular', fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Category chips
  chipRow: { gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: { backgroundColor: 'rgba(217, 70, 239, 0.15)', borderColor: '#d946ef' },
  chipText: { fontFamily: 'Sora_600SemiBold', fontSize: 12, color: '#9ca3af' },
  chipTextActive: { color: '#d946ef' },

  // Event cards
  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  eventCard: {
    width: (width - 42) / 2,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  eventImageWrap: { width: '100%', height: 120 },
  eventImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  eventImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  eventImageChar: { fontFamily: 'Syne_800ExtraBold', color: 'rgba(255,255,255,0.3)', fontSize: 40 },
  eventInfo: { padding: 12, gap: 4 },
  eventTitle: { fontFamily: 'Sora_700Bold', fontSize: 13, color: '#f8f9ff' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMetaText: { fontFamily: 'Sora_400Regular', fontSize: 11, color: '#94a3b8', flex: 1 },
  eventPrice: { fontFamily: 'Sora_800ExtraBold', fontSize: 13, color: '#47e8ff', marginTop: 4 },

  emptySearch: { alignItems: 'center', paddingVertical: 30 },
  emptySearchText: { fontFamily: 'Sora_600SemiBold', color: '#64748b', fontSize: 14 },

  followStateBadge: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  followStateBadgeText: { fontFamily: 'Sora_600SemiBold', fontSize: 10, color: '#94a3b8' },
});
