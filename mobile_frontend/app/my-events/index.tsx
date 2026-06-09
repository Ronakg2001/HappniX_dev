import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Plus } from 'lucide-react-native';
import { BrandHeader, Chip, EmptyState, EventCard, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';
import { eventApi } from '@/services/api';

const FILTERS = ['All', 'Draft', 'Upcoming', 'Live', 'Completed', 'Archived'];

export default function MyEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await eventApi.mine();
        if (alive) setEvents(res.data?.events || []);
      } catch (err) {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const filtered = events.filter(e => filter === 'All' || e.status === filter);
  const liveCount = events.filter(e => e.status === 'Live').length;

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Organizer Dashboard</Text>
            <Text style={styles.headerTitle}>My Events</Text>
            {liveCount > 0 && (
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{liveCount} event{liveCount > 1 ? 's' : ''} live right now</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(tabs)/create')}>
            <Plus color="#fff" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterStrip}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTERS}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <Chip 
                label={item} 
                active={filter === item} 
                onPress={() => setFilter(item)} 
              />
            )}
          />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.pink} /></View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState 
              title="No Events Found" 
              body={`No events matching "${filter}".`} 
              icon={<Calendar color={colors.faint} size={32} />} 
            />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id || Math.random().toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <EventCard 
                event={item} 
                onPress={() => router.push(`/my-events/workspace?id=${item.id}` as any)} 
                onBook={() => router.push(`/my-events/workspace?id=${item.id}` as any)} 
              />
            )}
          />
        )}

      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { fontFamily: fonts.black, color: colors.pink, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 22, marginTop: 1 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  liveText: { fontFamily: fonts.bold, color: '#4ade80', fontSize: 11 },
  createBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', shadowColor: colors.pink, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  filterStrip: { paddingBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { paddingHorizontal: 16, paddingTop: 30 },
  list: { paddingHorizontal: 16, paddingBottom: 60, gap: 16 },
});
