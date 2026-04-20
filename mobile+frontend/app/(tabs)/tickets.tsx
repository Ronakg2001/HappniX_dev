import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, ActivityIndicator, Image, Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ticket, Calendar, MapPin, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { eventApi, ticketApi } from '../../services/api';
import { eventToParams } from '../../utils/navigation';
import PartyLoader from '../../components/ui/party-loader';

const { width } = Dimensions.get('window');

export default function TicketsScreen() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'events'>('tickets');
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab === 'events') {
      fetchMyEvents();
    } else {
      fetchMyTickets();
    }
  }, [activeTab]);

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketApi.getAll();
      setTickets(res.data.tickets || []);
    } catch (e) {
      console.error('Failed to fetch tickets:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await eventApi.mine();
      setMyEvents(res.data.events || []);
    } catch (e) {
      console.error('Failed to fetch my events:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (eventId: number, title: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventApi.delete(eventId);
              setMyEvents((prev) => prev.filter((e) => e.id !== eventId));
              Alert.alert('Deleted', 'Event deleted successfully.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete event.');
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'events') {
      fetchMyEvents();
    } else {
      fetchMyTickets();
    }
  }, [activeTab]);

  const renderTicketItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.ticketCard}
      activeOpacity={0.8}
      onPress={() => router.push({ 
        pathname: `/ticket/${item.id}` as any,
        params: {
          title: item.event?.title,
          passType: item.pass_type,
          quantity: item.quantity?.toString(),
          date: item.event?.startAt,
          imageUrl: item.event?.imageUrl,
          location: item.event?.locationName,
          host: item.event?.hostUsername
        } 
      })}
    >
      <LinearGradient
        colors={['rgba(124, 58, 237, 0.2)', 'rgba(30, 41, 59, 0.4)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.ticketCardInner}
      >
        <View style={styles.ticketImageContainer}>
           <Image source={{ uri: item.event?.imageUrl || 'https://images.unsplash.com/photo-1540039155732-68087448c3a9' }} style={styles.ticketImage} />
        </View>
        <View style={styles.ticketBody}>
           <Text style={styles.ticketTitle} numberOfLines={1}>{item.event?.title || 'Special Event'}</Text>
           <Text style={styles.ticketPassType}>{item.pass_type} Pass</Text>
           <Text style={styles.ticketMeta}>Qty x{item.quantity}</Text>
        </View>
        <View style={styles.ticketQtyBadge}>
           <Text style={styles.ticketQtyText}>VIEW</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEventItem = (event: any) => (
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
        <View style={[styles.statusBadge, event.status === 'published' ? styles.publishedBadge : styles.draftBadge]}>
          <Text style={[styles.statusText, event.status === 'published' ? styles.publishedText : styles.draftText]}>
            {(event.status || 'published').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.eventBody}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>

        <View style={styles.eventRow}>
          <MapPin color="#d946ef" size={14} />
          <Text style={styles.eventMeta} numberOfLines={1}>{event.locationName}</Text>
        </View>

        <View style={styles.eventRow}>
          <Calendar color="#22d3ee" size={14} />
          <Text style={styles.eventMeta}>
            {event.startAt ? new Date(event.startAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            }) : 'Date TBD'}
          </Text>
        </View>

        <View style={styles.eventFooter}>
          <Text style={styles.priceTag}>
            {parseFloat(event.price) === 0 ? 'Free' : `${event.currency} ${event.price}`}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(event.id, event.title)} style={styles.deleteBtn}>
            <Trash2 color="#fca5a5" size={18} />
          </TouchableOpacity>
        </View>
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

        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Events</Text>
        </View>

        <View style={styles.segmentWrapper}>
          <View style={styles.segmentContainer}>
            <TouchableOpacity style={[styles.segmentBtn, activeTab === 'tickets' && styles.segmentActiveBtn]} onPress={() => setActiveTab('tickets')}>
              <Text style={[styles.segmentBtnText, activeTab === 'tickets' && styles.segmentActiveText]}>Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentBtn, activeTab === 'events' && styles.segmentActiveBtn]} onPress={() => setActiveTab('events')}>
              <Text style={[styles.segmentBtnText, activeTab === 'events' && styles.segmentActiveText]}>My Events</Text>
            </TouchableOpacity>
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
          {activeTab === 'tickets' ? (
            loading ? (
              <ActivityIndicator size="large" color="#47e8ff" style={{ marginTop: 40 }} />
            ) : tickets.length > 0 ? (
              <View style={styles.eventsList}>
                {tickets.map(renderTicketItem)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyCircle}>
                  <Ticket color="#9ca3af" size={32} />
                </View>
                <Text style={styles.emptyText}>No passes yet.</Text>
                <Text style={styles.emptyHint}>Tickets for events you attend will show up here.</Text>
              </View>
            )
          ) : loading ? (
            <ActivityIndicator size="large" color="#47e8ff" style={{ marginTop: 40 }} />
          ) : myEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {myEvents.map(renderEventItem)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}>
                <Calendar color="#9ca3af" size={32} />
              </View>
              <Text style={styles.emptyText}>No hosted events yet.</Text>
              <Text style={styles.emptyHint}>Create your first event from the Create tab!</Text>
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
  orbViolet: { top: -100, right: '-30%', backgroundColor: '#ff4fd8' },
  orbCyan: { bottom: -100, left: '-20%', backgroundColor: '#47e8ff' },

  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10, zIndex: 10 },
  headerTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 32, color: '#f8f9ff', letterSpacing: -0.5 },

  segmentWrapper: { paddingHorizontal: 24, paddingBottom: 24, zIndex: 10 },
  segmentContainer: {
    flexDirection: 'row', backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  segmentActiveBtn: { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  segmentBtnText: { fontFamily: 'Sora_700Bold', color: '#64748b', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  segmentActiveText: { color: '#f8f9ff', textShadowColor: '#d946ef', textShadowRadius: 10 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 150 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontFamily: 'Sora_600SemiBold', color: '#94a3b8', fontSize: 16, marginBottom: 4 },
  emptyHint: { fontFamily: 'Sora_400Regular', color: '#64748b', fontSize: 13, textAlign: 'center' },

  eventsList: { gap: 16 },
  eventCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  eventImageWrap: { width: '100%', height: 140, position: 'relative' },
  eventImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  eventImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  eventImageChar: { fontFamily: 'Syne_800ExtraBold', color: 'rgba(255,255,255,0.2)', fontSize: 50 },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1,
  },
  publishedBadge: { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: '#4ade80' },
  draftBadge: { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: '#f59e0b' },
  statusText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 9, letterSpacing: 1 },
  publishedText: { color: '#4ade80' },
  draftText: { color: '#f59e0b' },
  eventBody: { padding: 14, gap: 6 },
  eventTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#f8f9ff' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventMeta: { fontFamily: 'Sora_400Regular', fontSize: 13, color: '#94a3b8', flex: 1 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  priceTag: { fontFamily: 'Sora_800ExtraBold', fontSize: 14, color: '#47e8ff' },
  deleteBtn: { padding: 6 },

  ticketCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.3)' },
  ticketCardInner: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  ticketImageContainer: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.5)' },
  ticketImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  ticketBody: { flex: 1, marginLeft: 16 },
  ticketTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#f8f9ff', marginBottom: 4 },
  ticketPassType: { fontFamily: 'Outfit_800ExtraBold', fontSize: 11, color: '#d946ef', textTransform: 'uppercase', letterSpacing: 1 },
  ticketMeta: { fontFamily: 'Sora_400Regular', fontSize: 12, color: '#94a3b8', marginTop: 4 },
  ticketQtyBadge: { backgroundColor: 'rgba(71, 232, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#47e8ff' },
  ticketQtyText: { fontFamily: 'Outfit_900Black', color: '#47e8ff', fontSize: 10, letterSpacing: 1 },
});
