import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Sun, Heart, MessageCircle, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import PartyLoader from '../../components/ui/party-loader';
import { eventApi } from '../../services/api';
import { HX_LOGO } from '../../constants/images';

const { width } = Dimensions.get('window');

// Add the live events API helper
const liveEventsApi = {
  getLive: () => require('../../services/api').default.get('/api/events/live'),
};

export default function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, []);

  const fetchAllData = async () => {
    try {
      // #24: Try to get real GPS location
      let lat = 28.7041;
      let lon = 77.1025;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      } catch (locErr) {
        console.warn('Location unavailable, using default:', locErr);
      }

      const [nearbyRes, liveRes] = await Promise.allSettled([
        eventApi.nearby(lat, lon, 500),
        liveEventsApi.getLive(),
      ]);

      if (nearbyRes.status === 'fulfilled') {
        setEvents(nearbyRes.value.data.events || []);
      }
      if (liveRes.status === 'fulfilled') {
        setLiveEvents(liveRes.value.data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFeedItem = (item: any, index: number, isLeft: boolean) => {
    // Event Card — all items from the backend are events
    return (
      <TouchableOpacity
        key={`event-${item.id}-${index}`}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/event-detail', params: {
          id: item.id?.toString(),
          title: item.title,
          description: item.description,
          hostUsername: item.hostUsername,
          locationName: item.locationName,
          latitude: item.latitude?.toString(),
          longitude: item.longitude?.toString(),
          startAt: item.startAt,
          startLabel: item.startLabel,
          price: item.price?.toString(),
          currency: item.currency,
          imageUrl: item.imageUrl,
          eventCategory: item.eventCategory,
          maxAttendees: item.maxAttendees?.toString(),
          ticketsSold: item.ticketsSold?.toString(),
          canBook: item.canBook?.toString(),
          mapUrl: item.mapUrl,
          ticketType: item.ticketType || 'Free',
          ticketTiers: JSON.stringify(item.ticketTiers || []),
          mediaUrls: JSON.stringify((item.mediaAssets || []).map((m: any) => m.file_url || m.fileUrl).filter(Boolean)),
        }})}
        style={[styles.feedCard, { marginBottom: 16 }]}
      >
        <LinearGradient
          colors={['rgba(17, 23, 48, 0.7)', 'rgba(10, 14, 29, 0.58)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={[styles.cardImageContainer, { aspectRatio: isLeft ? 4/5 : 3/4 }]}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                 <LinearGradient colors={['#7c3aed', '#c026d3']} style={StyleSheet.absoluteFillObject} />
                 <Text style={styles.placeholderText}>Vibe</Text>
              </View>
            )}
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>
                {item.isLive ? 'LIVE' : item.isEnded ? 'ENDED' : 'UPCOMING'}
              </Text>
            </View>
          </View>

          <View style={styles.eventCardBody}>
            <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.eventVenue} numberOfLines={1}>{item.locationName}</Text>
            <View style={styles.eventFooterRow}>
              <Text style={styles.eventTimeText}>
                {item.startAt ? new Date(item.startAt).toLocaleDateString() : item.startLabel || ''}
              </Text>
              <Text style={styles.eventPriceText}>
                {item.price > 0 ? `${item.currency || 'INR'} ${item.price}` : 'Free'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
           <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
           <View style={[styles.orb, styles.orbViolet]} />
           <View style={[styles.orb, styles.orbCyan]} />
        </View>

        <View style={styles.header}>
          <Image source={HX_LOGO} style={styles.brandLogo} resizeMode="contain" />
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconCircle}><MapPin color="#f8f9ff" size={24} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle}><Sun color="#f8f9ff" size={24} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/notifications')}>
              <Heart color="#f8f9ff" size={24} />
              <View style={styles.pulseDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/messages')}>
              <MessageCircle color="#f8f9ff" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <PartyLoader />
          </View>
        ) : (
          <>
            {refreshing && (
              <View style={{ position: 'absolute', top: 120, left: 0, right: 0, zIndex: 50, alignItems: 'center' }}>
                <PartyLoader />
              </View>
            )}
            <ScrollView 
              contentContainerStyle={styles.listContent} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="transparent" colors={['transparent']} />
              }
            >

              {/* Live Now — only show if there are live events */}
            {liveEvents.length > 0 && (
              <View style={styles.liveNowContainer}>
                <View style={styles.liveNowHeaderRow}>
                  <View style={styles.liveNowDot} />
                  <Text style={styles.sectionTitle}>LIVE NOW</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveNowScroll}>
                  {liveEvents.map((item, idx) => (
                    <TouchableOpacity 
                      key={`livenow-${item.id}-${idx}`} 
                      style={styles.liveNowCard} 
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: '/event-detail', params: { id: item.id?.toString() } })}
                    >
                      <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400' }} style={styles.liveNowImage} />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} />
                      <View style={styles.liveNowContent}>
                        <Text style={styles.liveNowEventTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={{flexDirection:'row', alignItems:'center', gap: 4, marginTop: 4}}>
                          <MapPin color="#22d3ee" size={10} />
                          <Text style={styles.liveNowVenue} numberOfLines={1}>{item.locationName}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Empty State */}
            {events.length === 0 && liveEvents.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No vibes nearby</Text>
                <Text style={styles.emptyStateDesc}>Events and posts from your area will show up here. Create one to get started!</Text>
              </View>
            )}

            {/* Masonry Grid */}
            {events.length > 0 && (
              <View style={styles.masonryGrid}>
                <View style={styles.masonryCol}>
                  {events.filter((_, i) => i % 2 === 0).map((item, index) => renderFeedItem(item, index, true))}
                </View>
                <View style={styles.masonryCol}>
                  {events.filter((_, i) => i % 2 !== 0).map((item, index) => renderFeedItem(item, index, false))}
                </View>
              </View>
            )}
          </ScrollView>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.18 },
  orbViolet: { top: -50, left: '-10%', backgroundColor: '#ff4fd8' },
  orbCyan: { top: '30%', right: '-30%', backgroundColor: '#47e8ff' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(14, 20, 44, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.14)',
    zIndex: 10,
  },
  brandLogo: { width: 120, height: 34 },
  headerIcons: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  iconCircle: { position: 'relative', width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  pulseDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4fd8' },

  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  masonryGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  masonryCol: { flex: 1 },

  feedCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardImageContainer: { width: '100%', aspectRatio: 4/5, backgroundColor: 'rgba(7, 11, 23, 0.8)' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18, letterSpacing: 1 },

  // Event specifics
  eventBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#47e8ff' },
  eventBadgeText: { fontFamily: 'Outfit_800ExtraBold', color: '#47e8ff', fontSize: 8, letterSpacing: 1 },
  eventCardBody: { padding: 12 },
  eventTitle: { fontFamily: 'Sora_700Bold', fontSize: 13, color: '#f8f9ff', marginBottom: 4 },
  eventVenue: { fontFamily: 'Sora_400Regular', fontSize: 11, color: '#94a3b8', marginBottom: 8 },
  eventFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTimeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  eventPriceText: { fontFamily: 'Sora_700Bold', fontSize: 11, color: '#d946ef' },

  // Live Now
  liveNowContainer: { marginBottom: 24, marginTop: 16 },
  liveNowHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 0, marginBottom: 12 },
  liveNowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: {width:0,height:0}, shadowRadius:8, shadowOpacity:1, elevation: 5 },
  sectionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 12, color: '#fff', letterSpacing: 1 },
  liveNowScroll: { paddingHorizontal: 0, gap: 12 },
  liveNowCard: { width: 140, height: 180, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor:'rgba(255,255,255,0.1)' },
  liveNowImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  liveNowContent: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  liveNowEventTitle: { fontFamily: 'Sora_700Bold', fontSize: 12, color: '#fff' },
  liveNowVenue: { fontFamily: 'Sora_400Regular', fontSize: 10, color: '#94a3b8' },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyStateTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#fff', marginBottom: 8 },
  emptyStateDesc: { fontFamily: 'Sora_400Regular', fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
});
