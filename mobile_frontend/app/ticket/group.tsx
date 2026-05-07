import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Image, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft, UserPlus, X, Users, Check, Search, Link as LinkIcon,
} from 'lucide-react-native';
import { groupTicketApi, userApi } from '../../services/api';

export default function GroupTicketScreen() {
  const { ticketId, title } = useLocalSearchParams();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchGroup();
  }, [ticketId]);

  const fetchGroup = async () => {
    try {
      const res = await groupTicketApi.getGroup(ticketId as string);
      setMembers(res.data.members || res.data.tickets || []);
    } catch (e) {
      console.error('Failed to fetch group:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer) clearTimeout(searchTimer);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await userApi.search(text);
        const existingIds = new Set(members.map((m: any) => m.attendee_id || m.sql_user_id || m.id));
        setSearchResults((res.data.users || []).filter((u: any) => !existingIds.has(u.sql_user_id || u.id)));
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    setSearchTimer(timer);
  };

  const handleShareInvite = async () => {
    setActionLoading('share');
    try {
      const res = await groupTicketApi.generateInvite(ticketId as string);
      const uuid = res.data.uuid || res.data.inviteToken;
      const inviteLink = `happnixmobile://guest-invite/${uuid}`;
      await import('react-native').then(({ Share }) => {
        Share.share({
          message: `Join my ticket group on Happnix! Tap here: ${inviteLink}`,
          url: inviteLink,
        });
      });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to generate invite link.');
    } finally {
      setActionLoading('');
    }
  };

  const addMember = async (userId: number) => {
    setActionLoading(`add-${userId}`);
    try {
      await groupTicketApi.updateGroup(ticketId as string, {
        inviteeUserIds: [userId],
      });
      Alert.alert('Added', 'Member added to the group.');
      setSearchQuery('');
      setSearchResults([]);
      setShowAddMember(false);
      fetchGroup();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to add member.');
    } finally {
      setActionLoading('');
    }
  };

  const removeMember = (userId: number, username: string) => {
    Alert.alert('Remove Member', `Remove ${username} from this group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setActionLoading(`remove-${userId}`);
          try {
            await groupTicketApi.updateGroup(ticketId as string, {
              removeUserIds: [userId],
            });
            setMembers(prev => prev.filter(m => (m.attendee_id || m.id) !== userId));
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to remove member.');
          } finally {
            setActionLoading('');
          }
        },
      },
    ]);
  };

  const renderMember = ({ item }: { item: any }) => {
    const userId = item.attendee_id || item.id;
    const username = item.attendee_username || item.username || 'User';
    const profilePic = item.profile_picture_url || '';
    const status = item.invite_status || item.status || 'confirmed';
    const isOwner = item.is_owner || false;

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberAvatar}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.memberAvatarImg} />
          ) : (
            <Text style={styles.memberAvatarText}>{username.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.memberUsername}>{username}</Text>
          <Text style={styles.memberStatus}>
            {isOwner ? 'Organiser' : status === 'pending' ? 'Pending invite' : 'Confirmed'}
          </Text>
        </View>
        {!isOwner && (
          <TouchableOpacity
            style={styles.removeMemberBtn}
            onPress={() => removeMember(userId, username)}
            disabled={!!actionLoading}
          >
            {actionLoading === `remove-${userId}` ? (
              <ActivityIndicator color="#f87171" size="small" />
            ) : (
              <X color="#f87171" size={16} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.orb, styles.orbViolet]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.headerTitle}>Group Pass</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{title || 'Event'}</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { marginRight: 8 }]} onPress={handleShareInvite} disabled={!!actionLoading}>
            {actionLoading === 'share' ? <ActivityIndicator color="#d946ef" size="small" /> : <LinkIcon color="#d946ef" size={18} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddMember(!showAddMember)}>
            <UserPlus color="#47e8ff" size={18} />
          </TouchableOpacity>
        </View>

        {/* Add member search */}
        {showAddMember && (
          <View style={styles.addPanel}>
            <View style={styles.searchBox}>
              <Search color="#64748b" size={16} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users to add..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <X color="#64748b" size={16} />
                </TouchableOpacity>
              )}
            </View>
            {searchLoading && <ActivityIndicator color="#47e8ff" style={{ marginTop: 8 }} />}
            {searchResults.map(user => (
              <TouchableOpacity
                key={user.sql_user_id || user.username}
                style={styles.searchResultItem}
                onPress={() => addMember(user.sql_user_id || user.id)}
                disabled={!!actionLoading}
                activeOpacity={0.7}
              >
                <View style={styles.searchResultAvatar}>
                  {user.profile_picture_url ? (
                    <Image source={{ uri: user.profile_picture_url }} style={styles.memberAvatarImg} />
                  ) : (
                    <Text style={styles.memberAvatarText}>{(user.username || 'U').charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberUsername}>{user.username}</Text>
                  {user.full_name ? <Text style={styles.memberStatus}>{user.full_name}</Text> : null}
                </View>
                {actionLoading === `add-${user.sql_user_id || user.id}` ? (
                  <ActivityIndicator color="#47e8ff" size="small" />
                ) : (
                  <View style={styles.addMemberCircle}>
                    <UserPlus color="#47e8ff" size={14} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Member count */}
        <View style={styles.countBar}>
          <Users color="#d946ef" size={16} />
          <Text style={styles.countText}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#47e8ff" />
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item, idx) => (item.id || item.attendee_id || idx).toString()}
            renderItem={renderMember}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Users color="#94a3b8" size={32} />
                <Text style={styles.emptyText}>No group members yet</Text>
                <Text style={styles.emptyHint}>Tap + to add friends to this ticket group</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  orbViolet: { top: -100, left: '-30%', backgroundColor: '#d946ef' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 },
  headerSubtitle: { fontFamily: 'Sora_400Regular', color: '#94a3b8', fontSize: 12, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(71, 232, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(71, 232, 255, 0.2)',
  },

  addPanel: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, fontFamily: 'Sora_400Regular', color: '#fff', fontSize: 14 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  searchResultAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  addMemberCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(71, 232, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(71, 232, 255, 0.2)',
  },

  countBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  countText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 12, color: '#94a3b8', letterSpacing: 0.5 },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  memberCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center',
    marginRight: 14, overflow: 'hidden',
  },
  memberAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  memberAvatarText: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 },
  memberUsername: { fontFamily: 'Sora_700Bold', fontSize: 14, color: '#f8f9ff' },
  memberStatus: { fontFamily: 'Sora_400Regular', fontSize: 11, color: '#94a3b8', marginTop: 2 },
  removeMemberBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.2)',
  },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontFamily: 'Sora_700Bold', color: '#94a3b8', fontSize: 16 },
  emptyHint: { fontFamily: 'Sora_400Regular', color: '#64748b', fontSize: 13, textAlign: 'center' },
});
