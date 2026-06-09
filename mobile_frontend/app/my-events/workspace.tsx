import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BarChart2, Edit3, Settings, Users } from 'lucide-react-native';
import { GhostButton, Glass, GradientButton, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';
import { eventApi } from '@/services/api';

export default function EventWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function fetchEvent() {
      if (!id) return;
      try {
        const res = await eventApi.getById(id);
        if (alive) setEvent(res.data?.event || res.data);
      } catch (err) {
        Alert.alert('Error', 'Could not load event workspace');
        router.back();
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchEvent();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.center}><ActivityIndicator color={colors.pink} /></View>
        </SafeAreaView>
      </Screen>
    );
  }

  if (!event) return null;

  const ticketsSold = event.maxAttendees ? (event.maxAttendees - (event.ticketsLeft ?? event.maxAttendees)) : 0;
  const revenue = ticketsSold * (event.price || 0);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Workspace</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Glass style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusLabel}>Current Status</Text>
                <Text style={styles.statusValue}>{event.status || 'Live'}</Text>
              </View>
              <GradientButton label="Edit Event" icon={<Edit3 size={14} color="#fff" />} style={styles.editBtn} />
            </View>
          </Glass>

          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <Glass style={styles.statBox}>
              <Users color={colors.blue} size={20} style={{ marginBottom: 8 }} />
              <Text style={styles.statNumber}>{ticketsSold}</Text>
              <Text style={styles.statLabel}>Tickets Sold</Text>
            </Glass>
            <Glass style={styles.statBox}>
              <BarChart2 color={colors.pink} size={20} style={{ marginBottom: 8 }} />
              <Text style={styles.statNumber}>{event.currency || 'INR'} {revenue}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </Glass>
          </View>

          <Text style={styles.sectionTitle}>Management</Text>
          <Glass style={styles.card}>
            <ActionRow icon={<Users color={colors.text} size={18} />} title="Guest List" subtitle="Manage attendees and check-ins" />
            <View style={styles.divider} />
            <ActionRow icon={<Settings color={colors.text} size={18} />} title="Event Settings" subtitle="Visibility, capacity, and refunds" />
          </Glass>

          <GhostButton 
            label="Duplicate Event" 
            onPress={() => Alert.alert('Duplicate', 'Event duplicated successfully.')} 
            style={{ marginTop: 24 }} 
          />

        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function ActionRow({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { fontFamily: fonts.black, color: colors.pink, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 20, marginTop: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusCard: { padding: 16, marginBottom: 20 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontFamily: fonts.black, color: colors.faint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  statusValue: { fontFamily: fonts.black, color: '#4ade80', fontSize: 18, marginTop: 2 },
  editBtn: { paddingHorizontal: 16, minHeight: 40 },
  sectionTitle: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingLeft: 4 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 16 },
  statNumber: { fontFamily: fonts.black, color: colors.text, fontSize: 24 },
  statLabel: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 12, marginTop: 2 },
  card: { overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 15 },
  actionSubtitle: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
