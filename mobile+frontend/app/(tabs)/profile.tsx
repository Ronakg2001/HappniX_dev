import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Alert, Image, ScrollView, Dimensions, TextInput, Modal, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BadgeCheck, Shield, X, Edit3, Lock, ChevronRight, Calendar, Camera } from 'lucide-react-native';
import { profileApi, authApi, eventApi } from '../../services/api';
import { eventToParams } from '../../utils/navigation';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 48 - 8) / 3;

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Aadhaar verification state
  const [aadhaarModalVisible, setAadhaarModalVisible] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  // Privacy State
  const [isPrivate, setIsPrivate] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Connections State
  const [connectionsModalVisible, setConnectionsModalVisible] = useState(false);
  const [connectionType, setConnectionType] = useState<'fans' | 'following'>('fans');
  const [connectionsList, setConnectionsList] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // User's own events
  const [myEvents, setMyEvents] = useState<any[]>([]);

  const openConnections = async (type: 'fans' | 'following') => {
    setConnectionType(type);
    setConnectionsModalVisible(true);
    setConnectionsLoading(true);
    try {
      const res = type === 'fans' 
        ? await profileApi.getFollowers()
        : await profileApi.getFollowing();
      setConnectionsList(res.data.users || []);
    } catch (e) {
      console.error('Failed to fetch connections:', e);
      setConnectionsList([]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileApi.me();
      const data = response.data.profile || response.data;
      setProfile(data);
      setEditBio(data?.bio || '');
      setIsPrivate(data?.is_private || false);
      setPendingRequests(data?.pending_follow_requests_count || 0);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's own events
  const fetchMyEvents = async () => {
    try {
      const res = await eventApi.mine();
      setMyEvents(res.data.events || []);
    } catch (e) {
      console.error('Failed to fetch my events:', e);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [profile]);

  const togglePrivacy = async (value: boolean) => {
    setIsPrivate(value);
    try {
      await profileApi.setPrivacy(value);
    } catch (e) {
      console.error('Failed to update privacy:', e);
      setIsPrivate(!value); // Revert on failure
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.logout();
          } catch (e) {
            console.error('Backend logout failed', e);
          }
          await SecureStore.deleteItemAsync('userToken');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await authApi.completeProfile({ bio: editBio });
      setProfile((prev: any) => ({ ...prev, bio: editBio }));
      setEditModalVisible(false);
      Alert.alert('Updated', 'Profile updated successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendAadhaarOtp = async () => {
    if (aadhaarNumber.length !== 12) {
      return Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number.');
    }
    setAadhaarLoading(true);
    try {
      const res = await profileApi.sendAadhaarOtp(aadhaarNumber);
      setAadhaarOtpSent(true);
      Alert.alert('OTP Sent', res.data.message || 'Check your Aadhaar-linked phone.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setAadhaarLoading(false);
    }
  };

  const handleVerifyAadhaar = async () => {
    if (!aadhaarOtp) return Alert.alert('Error', 'Please enter the OTP.');
    setAadhaarLoading(true);
    try {
      const res = await profileApi.verifyAadhaarOtp(aadhaarOtp);
      Alert.alert('Verified!', res.data.message || 'Your Aadhaar has been verified.');
      setAadhaarModalVisible(false);
      setAadhaarOtpSent(false);
      setAadhaarOtp('');
      fetchProfile(); // Refresh profile to get updated verification status
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Verification failed.');
    } finally {
      setAadhaarLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#47e8ff" />
      </View>
    );
  }

  const username = profile?.username || profile?.user?.username || 'User';
  const fullName = profile?.full_name || username;
  const bio = profile?.bio || '';
  const isVerified = profile?.gov_id_verified ?? false;
  const profilePicUrl = profile?.profile_picture_url || '';
  const followersCount = profile?.followers_count ?? 0;
  const followingCount = profile?.following_count ?? 0;
  const vibesCount = myEvents.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(76, 29, 149, 0.8)', 'rgba(112, 26, 117, 0.8)', 'rgba(7, 11, 23, 0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        />

        <View style={styles.profileSection}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              {profilePicUrl ? (
                <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}>
              <Edit3 color="#f8f9ff" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{fullName || username}</Text>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <BadgeCheck color="#000" size={14} strokeWidth={3} />
                </View>
              )}
            </View>
            <Text style={styles.handle}>@{username}</Text>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{vibesCount}</Text>
              <Text style={styles.statLabel}>VIBES</Text>
            </View>
            <TouchableOpacity 
               style={[styles.statBox, styles.statBorder]} 
               onPress={() => openConnections('fans')}
               activeOpacity={0.7}
            >
              <Text style={styles.statNum}>{followersCount}</Text>
              <Text style={styles.statLabel}>FANS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
               style={styles.statBox}
               onPress={() => openConnections('following')}
               activeOpacity={0.7}
            >
              <Text style={styles.statNum}>{followingCount}</Text>
              <Text style={styles.statLabel}>FOLLOWING</Text>
            </TouchableOpacity>
          </View>

          {/* Aadhaar Verification Section */}
          {!isVerified && (
            <TouchableOpacity
              style={styles.verifySection}
              onPress={() => setAadhaarModalVisible(true)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(34, 211, 238, 0.1)', 'rgba(217, 70, 239, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifySectionInner}
              >
                <Shield color="#22d3ee" size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifyTitle}>Get Verified</Text>
                  <Text style={styles.verifyDesc}>Verify your Aadhaar to host events</Text>
                </View>
                <Text style={styles.verifyArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Account Settings */}
          <View style={styles.settingsGroup}>
            <Text style={styles.settingsHeader}>ACCOUNT SETTINGS</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                 <Lock color="#f8f9ff" size={20} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Private Account</Text>
                <Text style={styles.settingDesc}>Only approved fans can view your content</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={togglePrivacy}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(217, 70, 239, 0.5)' }}
                thumbColor={isPrivate ? '#d946ef' : '#94a3b8'}
              />
            </View>

            {isPrivate && (
              <TouchableOpacity style={styles.navRow} activeOpacity={0.7} onPress={() => router.push('/requests')}>
                <Text style={styles.navTitle}>Follow Requests</Text>
                <View style={styles.navRight}>
                  {pendingRequests > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{pendingRequests}</Text>
                    </View>
                  )}
                  <ChevronRight color="#64748b" size={20} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* MY EVENTS (Grid) #25 */}
          {myEvents.length > 0 && (
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsHeader}>MY EVENTS</Text>
              <View style={styles.eventsGrid}>
                {myEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.gridItem}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/event-detail', params: eventToParams(event) })}
                  >
                    {event.imageUrl ? (
                      <Image source={{ uri: event.imageUrl }} style={styles.gridImage} />
                    ) : (
                      <LinearGradient colors={['#7c3aed', '#c026d3']} style={styles.gridImage}>
                        <Text style={styles.gridPlaceholder}>{(event.title || 'E').charAt(0)}</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal (#26: with avatar editing) */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            {/* Avatar Picker */}
            <TouchableOpacity
              style={styles.avatarPickerWrap}
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                if (!result.canceled && result.assets?.[0]?.uri) {
                  try {
                    await authApi.completeProfile({ profilePictureUrl: result.assets[0].uri });
                    setProfile((prev: any) => ({ ...prev, profile_picture_url: result.assets[0].uri }));
                    Alert.alert('Updated', 'Profile picture updated!');
                  } catch (e) {
                    Alert.alert('Error', 'Failed to update profile picture.');
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.avatarPickerCircle}>
                {profilePicUrl ? (
                  <Image source={{ uri: profilePicUrl }} style={styles.avatarPickerImg} />
                ) : (
                  <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
                )}
                <View style={styles.cameraBadge}>
                  <Camera color="#fff" size={14} />
                </View>
              </View>
              <Text style={styles.avatarPickerLabel}>Change Photo</Text>
            </TouchableOpacity>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Bio</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                placeholder="Describe your vibe..."
                placeholderTextColor="#64748b"
              />
            </View>
            <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile} activeOpacity={0.8}>
              <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Save Changes</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Aadhaar Verification Modal */}
      <Modal visible={aadhaarModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aadhaar Verification</Text>
              <TouchableOpacity onPress={() => { setAadhaarModalVisible(false); setAadhaarOtpSent(false); }}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            {!aadhaarOtpSent ? (
              <>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>12-Digit Aadhaar Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={aadhaarNumber}
                    onChangeText={setAadhaarNumber}
                    keyboardType="number-pad"
                    maxLength={12}
                    placeholder="Enter Aadhaar number"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <TouchableOpacity onPress={handleSendAadhaarOtp} disabled={aadhaarLoading} activeOpacity={0.8}>
                  <LinearGradient colors={['#22d3ee', '#0891b2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                    {aadhaarLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Send OTP</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.aadhaarSentText}>OTP sent to mobile linked with Aadhaar ending in {aadhaarNumber.slice(-4)}</Text>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Enter OTP</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={aadhaarOtp}
                    onChangeText={setAadhaarOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <TouchableOpacity onPress={handleVerifyAadhaar} disabled={aadhaarLoading} activeOpacity={0.8}>
                  <LinearGradient colors={['#4ade80', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                    {aadhaarLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Verify</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Connections Modal */}
      <Modal visible={connectionsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 24, height: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{connectionType === 'fans' ? 'Fans' : 'Following'}</Text>
              <TouchableOpacity onPress={() => setConnectionsModalVisible(false)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
              {connectionsLoading ? (
                <ActivityIndicator size="large" color="#47e8ff" style={{ marginTop: 40 }} />
              ) : connectionsList.length === 0 ? (
                <Text style={{ fontFamily: 'Sora_400Regular', color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>
                  {connectionType === 'fans' ? 'No fans yet' : 'Not following anyone yet'}
                </Text>
              ) : (
                connectionsList.map((user: any) => (
                  <View key={user.sql_user_id || user.username} style={styles.connectionCard}>
                    {user.profile_picture_url ? (
                      <Image source={{ uri: user.profile_picture_url }} style={styles.connectionAvatar} />
                    ) : (
                      <View style={[styles.connectionAvatar, { backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 16 }}>
                          {(user.username || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.connectionUsername}>{user.username}</Text>
                      <Text style={styles.connectionName}>{user.full_name || ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.connectionActionBtn}>
                      <Text style={styles.connectionActionTxt}>{connectionType === 'fans' ? 'Remove' : 'Unfollow'}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b17' },
  container: { flexGrow: 1, backgroundColor: '#070b17', paddingBottom: 120 },

  banner: { width: '100%', height: 160 },

  profileSection: { paddingHorizontal: 24 },

  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40, marginBottom: 16 },
  avatarContainer: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#000', padding: 4 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 16, backgroundColor: '#111730', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Syne_800ExtraBold', fontSize: 40, color: '#f8f9ff' },

  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  editBtnText: { fontFamily: 'Sora_700Bold', color: '#f8f9ff', fontSize: 13 },

  userInfo: { marginBottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { fontFamily: 'Syne_800ExtraBold', fontSize: 24, color: '#f8f9ff' },
  verifiedBadge: { backgroundColor: '#47e8ff', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  handle: { fontFamily: 'Sora_600SemiBold', fontSize: 15, color: '#94a3b8', marginTop: 4 },
  bio: { fontFamily: 'Sora_400Regular', fontSize: 15, color: '#94a3b8', marginTop: 12, lineHeight: 22 },

  statsRow: { flexDirection: 'row', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'flex-start' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 16 },
  statNum: { fontFamily: 'Outfit_900Black', fontSize: 20, color: '#f8f9ff' },
  statLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 11, color: '#64748b', letterSpacing: 1, marginTop: 4 },

  verifySection: { marginBottom: 16 },
  verifySectionInner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  verifyTitle: { fontFamily: 'Sora_700Bold', color: '#f8f9ff', fontSize: 14 },
  verifyDesc: { fontFamily: 'Sora_400Regular', color: '#94a3b8', fontSize: 12, marginTop: 2 },
  verifyArrow: { fontFamily: 'Outfit_900Black', color: '#22d3ee', fontSize: 20 },

  settingsGroup: { marginBottom: 24 },
  settingsHeader: { fontFamily: 'Outfit_800ExtraBold', color: '#64748b', fontSize: 11, letterSpacing: 1, marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  settingIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontFamily: 'Sora_600SemiBold', color: '#f8f9ff', fontSize: 15 },
  settingDesc: { fontFamily: 'Sora_400Regular', color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 8 },
  navTitle: { fontFamily: 'Sora_600SemiBold', color: '#f8f9ff', fontSize: 15 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontFamily: 'Outfit_800ExtraBold', color: '#fff', fontSize: 10 },

  logoutBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center' },
  logoutText: { fontFamily: 'Sora_700Bold', color: '#fca5a5', fontSize: 16 },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: '#f8f9ff' },
  modalField: { marginBottom: 16 },
  modalLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 13, color: '#f8f9ff', marginBottom: 6 },
  modalInput: {
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.16)', borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: '#f8fafc', fontFamily: 'Sora_400Regular',
  },
  modalTextArea: { height: 100, textAlignVertical: 'top' },
  modalBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  modalBtnText: { fontFamily: 'Sora_700Bold', color: '#fff', fontSize: 16 },
  aadhaarSentText: { fontFamily: 'Sora_400Regular', color: '#22d3ee', fontSize: 14, marginBottom: 16, lineHeight: 22 },

  connectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  connectionAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  connectionUsername: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#fff' },
  connectionName: { fontFamily: 'Sora_400Regular', fontSize: 12, color: '#94a3b8' },
  connectionActionBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  connectionActionTxt: { fontFamily: 'Sora_600SemiBold', fontSize: 12, color: '#f8f9ff' },

  myEventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
  myEventImage: { width: 50, height: 50, borderRadius: 12, marginRight: 12 },
  myEventPrice: { fontFamily: 'Sora_700Bold', fontSize: 12, color: '#d946ef' },

  // #25: Events Grid
  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, borderRadius: 8, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover', justifyContent: 'center', alignItems: 'center' },
  gridPlaceholder: { fontFamily: 'Syne_800ExtraBold', fontSize: 24, color: 'rgba(255,255,255,0.3)' },

  // #26: Avatar Picker
  avatarPickerWrap: { alignItems: 'center', marginBottom: 20 },
  avatarPickerCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#111730', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 8 },
  avatarPickerImg: { width: 80, height: 80, borderRadius: 40 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0f172a' },
  avatarPickerLabel: { fontFamily: 'Sora_600SemiBold', fontSize: 12, color: '#47e8ff' },
});
