import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCheck, Bell, Calendar, Edit3, Lock, LogOut, Settings, ShieldCheck, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Avatar, BrandHeader, EmptyState, EventArt, Glass, GradientButton, GhostButton, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';
import { clearSession, eventApi, profileApi } from '@/services/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [profileResult, eventsResult] = await Promise.allSettled([profileApi.me(), eventApi.mine()]);
        if (!alive) return;
        if (profileResult.status === 'fulfilled') {
          const data = profileResult.value.data?.profile || profileResult.value.data || {};
          setProfile(data);
          setBio(data.bio || '');
          setIsPrivate(Boolean(data.is_private || data.isPrivate));
        }
        if (eventsResult.status === 'fulfilled') {
          setEvents(eventsResult.value.data?.events || []);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  async function saveProfile() {
    try {
      await profileApi.updateProfile({ bio });
      setProfile((prev: any) => ({ ...prev, bio }));
      setEditOpen(false);
    } catch (error: any) {
      Alert.alert('Could not update profile', error.message);
    }
  }

  async function togglePrivate(value: boolean) {
    setIsPrivate(value);
    try {
      await profileApi.setPrivacy(value);
    } catch {
      setIsPrivate(!value);
    }
  }

  async function logout() {
    await clearSession();
    router.replace('/(auth)/login');
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}><ActivityIndicator color={colors.blue} /></View>
      </Screen>
    );
  }

  const username = profile?.username || profile?.user?.username || 'happnix_user';
  const name = profile?.full_name || profile?.fullName || username;
  const verified = Boolean(profile?.gov_id_verified || profile?.verified);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <BrandHeader
          title="Profile"
          subtitle={`@${username}`}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
                <Bell color={colors.text} size={19} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
                <Settings color={colors.text} size={19} />
              </TouchableOpacity>
            </View>
          }
        />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Glass style={styles.profileCard}>
            <View style={styles.banner} />
            <View style={styles.profileBody}>
              <View style={styles.avatarRow}>
                <Avatar name={name} uri={profile?.profile_picture_url} size={88} />
                <GhostButton label="Edit Profile" icon={<Edit3 color={colors.text} size={15} />} onPress={() => setEditOpen(true)} />
              </View>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}</Text>
                {verified ? <BadgeCheck color={colors.blue} size={21} /> : null}
              </View>
              <Text style={styles.handle}>@{username}</Text>
              <Text style={styles.bio}>{profile?.bio || 'Add a bio to tell people what kind of nights you love.'}</Text>

              <View style={styles.stats}>
                <Stat label="Vibes" value={events.length} />
                <Stat label="Fans" value={profile?.followers_count ?? 0} />
                <Stat label="Following" value={profile?.following_count ?? 0} />
              </View>
            </View>
          </Glass>

          {!verified ? (
            <Glass style={styles.verifyCard}>
              <ShieldCheck color={colors.blue} size={24} />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifyTitle}>Verify your identity</Text>
                <Text style={styles.verifyBody}>Aadhaar verification unlocks hosting trust signals.</Text>
              </View>
              <GhostButton label="Verify" />
            </Glass>
          ) : null}

          {/* Settings moved to dedicated screen */}

          <Text style={styles.section}>Organizer</Text>
          <TouchableOpacity style={styles.organizerCard} activeOpacity={0.8} onPress={() => router.push('/my-events')}>
            <View style={styles.organizerIconBox}>
              <Calendar color="#fff" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.organizerTitle}>Organizer Dashboard</Text>
              <Text style={styles.organizerDesc}>Manage your events, guests, and analytics</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.section}>Vibes</Text>
          {events.length ? (
            <View style={styles.grid}>
              {events.slice(0, 9).map((event) => (
                <TouchableOpacity key={event.id} style={styles.gridItem}>
                  <EventArt uri={event.imageUrl} title={event.title || 'Event'} height={112} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyState title="No vibes yet" body="Hosted events and your Happnix moments will collect here." />
          )}

          {/* Logout moved to dedicated settings screen */}
        </ScrollView>

        <Modal transparent visible={editOpen} animationType="slide">
          <View style={styles.modalOverlay}>
            <Glass style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)}><X color={colors.muted} size={22} /></TouchableOpacity>
              </View>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Describe your vibe..."
                placeholderTextColor={colors.faint}
                multiline
                style={styles.input}
              />
              <GradientButton label="Save Changes" onPress={saveProfile} />
            </Glass>
          </View>
        </Modal>
      </SafeAreaView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  profileCard: { marginBottom: 16 },
  banner: { height: 118, backgroundColor: 'rgba(255,79,216,0.22)' },
  profileBody: { padding: 16, marginTop: -48 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontFamily: fonts.black, color: colors.text, fontSize: 25 },
  handle: { fontFamily: fonts.semibold, color: colors.faint, fontSize: 14, marginTop: 2 },
  bio: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20, marginTop: 12 },
  stats: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row' },
  stat: { flex: 1 },
  statValue: { fontFamily: fonts.black, color: colors.text, fontSize: 21 },
  statLabel: { fontFamily: fonts.black, color: colors.faint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  verifyCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  verifyTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 14 },
  verifyBody: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, marginTop: 2 },
  settingCard: { padding: 14, marginBottom: 18 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { flex: 1 },
  settingTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 14 },
  settingBody: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  section: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  organizerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,79,216,0.1)', borderWidth: 1, borderColor: 'rgba(255,79,216,0.3)', borderRadius: 16, padding: 16, marginBottom: 20, gap: 14 },
  organizerIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  organizerTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 15 },
  organizerDesc: { fontFamily: fonts.semibold, color: colors.pink, fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridItem: { width: '31.9%', borderRadius: 12, overflow: 'hidden' },
  logout: { marginTop: 20, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', padding: 15 },
  logoutText: { fontFamily: fonts.black, color: colors.danger, fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)', padding: 16 },
  modalCard: { padding: 16, gap: 13, marginBottom: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 20 },
  label: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  input: { minHeight: 110, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.07)', padding: 14, color: colors.text, fontFamily: fonts.regular, textAlignVertical: 'top' },
});
