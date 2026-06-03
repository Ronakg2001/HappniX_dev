import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bell, Heart, UserPlus, Calendar, Ticket, MessageCircle, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { notificationApi, profileApi } from '../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [notifRes, reqRes] = await Promise.allSettled([
        notificationApi.getAll(),
        profileApi.getFollowRequests(),
      ]);

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data.notifications || []);
      }
      if (reqRes.status === 'fulfilled') {
        setFollowRequests(reqRes.value.data.requests || []);
      }

      // Mark notifications as read
      notificationApi.markRead().catch(() => {});
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      await profileApi.handleFollowRequest(userId, 'approve');
      setFollowRequests(prev => prev.filter(r => r.sql_user_id !== userId));
    } catch (e) {
      console.error('Failed to approve:', e);
    }
  };

  const handleDeny = async (userId: number) => {
    try {
      await profileApi.handleFollowRequest(userId, 'deny');
      setFollowRequests(prev => prev.filter(r => r.sql_user_id !== userId));
    } catch (e) {
      console.error('Failed to deny:', e);
    }
  };

  const renderIcon = (activityType: string) => {
    switch (activityType) {
      case 'follow':
      case 'follow_request':
      case 'follow_request_accepted':
        return <UserPlus color="#47e8ff" size={20} />;
      case 'like':
        return <Heart color="#ff4fd8" size={20} />;
      case 'ticket_purchase':
        return <Ticket color="#d946ef" size={20} />;
      case 'event':
      case 'event_created':
        return <Calendar color="#d946ef" size={20} />;
      case 'message':
        return <MessageCircle color="#22d3ee" size={20} />;
      default:
        return <Bell color="#94a3b8" size={20} />;
    }
  };

  const renderFollowRequest = (item: any) => (
    <View key={item.sql_user_id || item.username} style={styles.requestCard}>
      {item.profile_picture_url ? (
        <Image source={{ uri: item.profile_picture_url }} style={styles.requestAvatar} />
      ) : (
        <View style={[styles.requestAvatar, { backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 14 }}>
            {(item.username || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.requestUsername}>{item.username}</Text>
        <Text style={styles.requestSubtext}>{item.full_name || 'Wants to follow you'}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.denyBtn} onPress={() => handleDeny(item.sql_user_id)}>
          <X color="#9ca3af" size={16} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleApprove(item.sql_user_id)} activeOpacity={0.8}>
          <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.approveBtn}>
            <Check color="#fff" size={16} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotificationItem = ({ item }: { item: any }) => {
    const activityType = item.activity_type || '';
    const body = item.body || item.title || 'You have a new notification';
    const actorUsername = item.actor_username || '';
    const actorAvatar = item.actor_profile_picture_url || '';
    const isRead = item.is_read ?? true;
    const createdAt = item.created_at;

    return (
      <TouchableOpacity style={styles.notificationCard} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          {actorAvatar ? (
            <Image source={{ uri: actorAvatar }} style={styles.actorAvatar} />
          ) : (
            renderIcon(activityType)
          )}
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.messageText}>
            {actorUsername ? <Text style={styles.actorName}>{actorUsername} </Text> : null}
            {body}
          </Text>
          <Text style={styles.timeText}>
            {createdAt ? timeAgo(createdAt) : ''}
          </Text>
        </View>
        {!isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.orb, styles.orbViolet]} />
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#47e8ff" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item, idx) => (item._id || item.id || idx).toString()}
            renderItem={renderNotificationItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              followRequests.length > 0 ? (
                <View style={styles.requestsSection}>
                  <View style={styles.requestsHeader}>
                    <Text style={styles.requestsSectionTitle}>FOLLOW REQUESTS</Text>
                    <View style={styles.requestsBadge}>
                      <Text style={styles.requestsBadgeText}>{followRequests.length}</Text>
                    </View>
                  </View>
                  {followRequests.map(renderFollowRequest)}
                </View>
              ) : null
            }
            ListEmptyComponent={
              followRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyCircle}>
                    <Bell color="#9ca3af" size={32} />
                  </View>
                  <Text style={styles.emptyText}>No notifications yet</Text>
                  <Text style={styles.emptyHint}>When people follow you or interact with your events, you will see it here.</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  orbViolet: { top: -100, left: '-30%', backgroundColor: '#ff4fd8' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  // Follow Requests Section
  requestsSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  requestsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  requestsSectionTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 11, color: '#94a3b8', letterSpacing: 1.5 },
  requestsBadge: { backgroundColor: '#d946ef', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  requestsBadgeText: { fontFamily: 'Sora_700Bold', fontSize: 10, color: '#fff' },

  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  requestAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  requestUsername: { fontFamily: 'Sora_700Bold', fontSize: 13, color: '#fff' },
  requestSubtext: { fontFamily: 'Sora_400Regular', fontSize: 11, color: '#94a3b8' },
  requestActions: { flexDirection: 'row', gap: 8 },
  denyBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  approveBtn: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },

  // Notification Card
  notificationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14, overflow: 'hidden',
  },
  actorAvatar: { width: 44, height: 44, borderRadius: 22 },
  contentContainer: { flex: 1 },
  actorName: { fontFamily: 'Sora_700Bold', color: '#47e8ff' },
  messageText: { fontFamily: 'Sora_400Regular', color: '#f8f9ff', fontSize: 13, lineHeight: 20 },
  timeText: { fontFamily: 'Sora_400Regular', color: '#64748b', fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#47e8ff', marginLeft: 10 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontFamily: 'Sora_700Bold', color: '#94a3b8', fontSize: 16, marginBottom: 6 },
  emptyHint: { fontFamily: 'Sora_400Regular', color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
