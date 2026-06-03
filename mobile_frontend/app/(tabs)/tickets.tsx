import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Ticket, Trash2 } from 'lucide-react-native';
import { BrandHeader, Chip, EmptyState, EventArt, EventCard, Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';
import { mockEvents } from '@/data/happnixMock';
import { eventApi, ticketApi } from '@/services/api';

export default function TicketsScreen() {
  const [tab, setTab] = useState<'tickets' | 'events'>('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'tickets') {
        const response = await ticketApi.getAll();
        setTickets(response.data?.tickets || []);
      } else {
        const response = await eventApi.mine();
        const nextEvents = response.data?.events || [];
        setEvents(nextEvents.length ? nextEvents : mockEvents);
      }
    } catch {
      if (tab === 'events') setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function deleteEvent(event: any) {
    Alert.alert('Delete event', `Delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await eventApi.delete(event.id);
            setEvents((prev) => prev.filter((item) => item.id !== event.id));
          } catch (error: any) {
            Alert.alert('Could not delete', error.message);
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <BrandHeader title="My Events" subtitle="Tickets you own and experiences you host" />
        <View style={styles.tabs}>
          <Chip label="Tickets" active={tab === 'tickets'} onPress={() => setTab('tickets')} />
          <Chip label="Hosted Events" active={tab === 'events'} onPress={() => setTab('events')} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.pink} />}
        >
          {loading ? <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} /> : null}

          {!loading && tab === 'tickets' && (
            tickets.length ? (
              tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
            ) : (
              <EmptyState icon={<Ticket color={colors.faint} size={32} />} title="No passes yet" body="Tickets for events you attend will show up here." />
            )
          )}

          {!loading && tab === 'events' && (
            events.length ? (
              events.map((event) => (
                <View key={event.id}>
                  <EventCard event={event} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEvent(event)}>
                    <Trash2 color={colors.danger} size={16} />
                    <Text style={styles.deleteText}>Delete event</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <EmptyState icon={<Calendar color={colors.faint} size={32} />} title="No hosted events" body="Create one from the Create tab to start inviting guests." />
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function TicketCard({ ticket }: { ticket: any }) {
  const event = ticket.event || {};
  return (
    <Glass style={styles.ticketCard}>
      <EventArt uri={event.imageUrl} title={event.title || 'Ticket'} height={92} />
      <View style={styles.ticketBody}>
        <Text style={styles.ticketTitle}>{event.title || 'Happnix Pass'}</Text>
        <Text style={styles.ticketMeta}>{ticket.pass_type || 'General'} pass - Qty {ticket.quantity || 1}</Text>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 9, paddingHorizontal: 16, marginBottom: 14 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  ticketCard: { marginBottom: 14, flexDirection: 'row' },
  ticketBody: { flex: 1, padding: 14, justifyContent: 'center' },
  ticketTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 16 },
  ticketMeta: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 12, marginTop: 4 },
  deleteBtn: { marginTop: -6, marginBottom: 16, alignSelf: 'flex-end', flexDirection: 'row', gap: 6, alignItems: 'center', padding: 9 },
  deleteText: { fontFamily: fonts.bold, color: colors.danger, fontSize: 12 },
});
