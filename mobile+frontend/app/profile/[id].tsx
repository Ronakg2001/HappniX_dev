import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Dimensions, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { BadgeCheck, ArrowLeft, UserPlus, UserCheck, Clock, Lock, MessageCircle, MapPin } from 'lucide-react-native';
import { userApi, messagingApi } from '../../services/api';
import { eventToParams } from '../../utils/navigation';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 48 - 8) / 3;

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await userApi.publicProfile(id as string);
      const data = res.data.profile || res.data;
      setProfile(data);
      setIsSelf(res.data.is_self || false);
    } catch (e) {
      console.error('Failed to fetch public profile', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        // Unfollow
        await userApi.unfollow(id as string);
        setProfile((prev: any) => ({
          ...prev,
          is_following: false,
          follow_request_pending: false,
          followers_count: Math.max(0, (prev.followers_count || 0) - 1),
        }));
      } else {
        // Follow (or send request if private)
        const res = await userApi.follow(id as string);
        const follow = res.data.follow || {};
        setProfile((prev: any) => ({
          ...prev,
          is_following: follow.is_following ?? true,
          follow_request_pending: follow.follow_request_pending ?? false,
          followers_count: follow.followers_count ?? prev.followers_count,
        }));
      }
    } catch (e) {
      console.error('Failed to follow/unfollow', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      const res = await messagingApi.startConversation(id as string);
      const convId = res.data.conversation?.id || res.data.id;
      if (convId) {
        router.push(`/messages/${convId}` as any);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not start conversation.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#47e8ff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAlt}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const username = profile.username || 'User';
  const fullName = profile.full_name || username;
  const bio = profile.bio || '';
  const isVerified = profile.gov_id_verified || false;
  const profilePicUrl = profile.profile_picture_url || '';
  const followersCount = profile.followers_count || 0;
  const followingCount = profile.following_count || 0;
  const eventsCount = profile.hosted_events_count || 0;
  const isFollowing = profile.is_following || false;
  const followRequestPending = profile.follow_request_pending || false;
  const isPrivate = profile.is_private || false;
  const followsYou = profile.follows_you || false;
  const events = profile.events || [];

  // Can view content: not private, or is following, or is self
  const canViewContent = !isPrivate || isFollowing || isSelf;

  // Follow button label and style
  let followButtonLabel = 'Follow';
  let followButtonStyle = styles.followBtn;
  let followButtonTextStyle = styles.followBtnText;
  let followIcon = <UserPlus color="#070b17" size={16} />;

  if (isFollowing) {
    followButtonLabel = 'Following';
    followButtonStyle = styles.followingBtn;
    followButtonTextStyle = styles.followingBtnText;
    followIcon = <UserCheck color="#f8f9ff" size={16} />;
  } else if (followRequestPending) {
    followButtonLabel = 'Requested';
    followButtonStyle = styles.requestedBtn;
    followButtonTextStyle = styles.requestedBtnText;
    followIcon = <Clock color="#d946ef" size={16} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(76, 29, 149, 0.8)', 'rgba(34, 211, 238, 0.4)', 'rgba(7, 11, 23, 0.8)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <ArrowLeft color="#fff" size={22} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.profileSection}>
          {/* Avatar + Action Buttons */}
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

            {!isSelf && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.followBtnBase, followButtonStyle]}
                  onPress={handleFollow}
                  disabled={followLoading}
                  activeOpacity={0.8}
                >
                  {followLoading ? (
                    <ActivityIndicator color={isFollowing ? "#fff" : "#070b17"} size="small" />
                  ) : (
                    <>
                      {followIcon}
                      <Text style={followButtonTextStyle}>{followButtonLabel}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} activeOpacity={0.8}>
                  <MessageCircle color="#f8f9ff" size={18} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* User Info */}
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
            {followsYou && (
              <View style={styles.followsYouBadge}>
                <Text style={styles.followsYouText}>Follows you</Text>
              </View>
            )}
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{eventsCount}</Text>
              <Text style={styles.statLabel}>VIBES</Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={styles.statNum}>{followersCount}</Text>
              <Text style={styles.statLabel}>FANS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{followingCount}</Text>
              <Text style={styles.statLabel}>FOLLOWING</Text>
            </View>
          </View>

          {/* Private Account Gating */}
          {!canViewContent ? (
            <View style={styles.privateGate}>
              <Lock color="#94a3b8" size={32} />
              <Text style={styles.privateTitle}>This account is private</Text>
              <Text style={styles.privateDesc}>Follow this account to see their posts and events.</Text>
            </View>
          ) : (
            /* Events Grid */
            events.length > 0 ? (
              <View>
                <Text style={styles.gridSectionTitle}>EVENTS</Text>
                <View style={styles.eventsGrid}>
                  {events.map((event: any) => (
                    <TouchableOpacity
                      key={event.id || event.eventId}
                      style={styles.gridItem}
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: '/event-detail', params: eventToParams(event) })}
                    >
                      {event.imageUrl || event.image_url ? (
                        <Image source={{ uri: event.imageUrl || event.image_url }} style={styles.gridImage} />
                      ) : (
                        <LinearGradient colors={['#7c3aed', '#c026d3']} style={styles.gridImage}>
                          <Text style={styles.gridPlaceholder}>{(event.title || 'E').charAt(0)}</Text>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noContent}>
                <Text style={styles.noContentText}>No events yet</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flexGrow: 1, backgroundColor: '#070b17', paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b17' },
  errorText: { fontFamily: 'Sora_600SemiBold', color: '#94a3b8', fontSize: 16, marginBottom: 20 },
  backBtnAlt: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  backBtnText: { fontFamily: 'Sora_700Bold', color: '#f8f9ff', fontSize: 14 },

  banner: { width: '100%', height: 160 },
  header: { paddingTop: 20, paddingHorizontal: 20 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  profileSection: { paddingHorizontal: 24, paddingBottom: 40 },

  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -50, marginBottom: 16 },
  avatarContainer: { width: 110, height: 110, borderRadius: 24, backgroundColor: '#000', padding: 4 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 20, resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 20, backgroundColor: '#111730', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Syne_800ExtraBold', fontSize: 44, color: '#f8f9ff' },

  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },
  followBtnBase: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 14, borderWidth: 0, borderColor: 'transparent', shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  followBtn: {
    backgroundColor: '#47e8ff',
    shadowColor: '#47e8ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  followBtnText: { fontFamily: 'Sora_800ExtraBold', color: '#070b17', fontSize: 13 },
  followingBtn: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  followingBtnText: { fontFamily: 'Sora_700Bold', color: '#f8f9ff', fontSize: 13 },
  requestedBtn: { backgroundColor: 'rgba(217, 70, 239, 0.15)', borderWidth: 1, borderColor: 'rgba(217, 70, 239, 0.3)', shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  requestedBtnText: { fontFamily: 'Sora_700Bold', color: '#d946ef', fontSize: 13 },
  messageBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  userInfo: { marginBottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { fontFamily: 'Syne_800ExtraBold', fontSize: 28, color: '#f8f9ff', letterSpacing: -0.5 },
  verifiedBadge: { backgroundColor: '#47e8ff', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  handle: { fontFamily: 'Sora_600SemiBold', fontSize: 15, color: '#94a3b8', marginTop: 4 },
  followsYouBadge: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  followsYouText: { fontFamily: 'Sora_600SemiBold', fontSize: 10, color: '#94a3b8' },
  bio: { fontFamily: 'Sora_400Regular', fontSize: 15, color: '#cbd5e1', marginTop: 12, lineHeight: 22 },

  statsRow: { flexDirection: 'row', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 16 },
  statNum: { fontFamily: 'Outfit_900Black', fontSize: 22, color: '#f8f9ff' },
  statLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, color: '#64748b', letterSpacing: 1.5, marginTop: 4 },

  // Private gate
  privateGate: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  privateTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#cbd5e1' },
  privateDesc: { fontFamily: 'Sora_400Regular', fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  // Events grid
  gridSectionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 11, color: '#64748b', letterSpacing: 1.5, marginBottom: 12 },
  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, borderRadius: 8, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover', justifyContent: 'center', alignItems: 'center' },
  gridPlaceholder: { fontFamily: 'Syne_800ExtraBold', fontSize: 24, color: 'rgba(255,255,255,0.3)' },

  noContent: { alignItems: 'center', paddingVertical: 40 },
  noContentText: { fontFamily: 'Sora_400Regular', fontSize: 14, color: '#64748b' },
});
