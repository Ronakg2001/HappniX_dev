import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Image, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MessageSquare, Search, X, Plus, Users as UsersIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { messagingApi, userApi } from '../../services/api';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await messagingApi.getConversations();
      setConversations(res.data.conversations || []);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  // #10: Start new conversation — search users
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
        setSearchResults(res.data.users || []);
      } catch (e) {
        console.error('User search failed:', e);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    setSearchTimer(timer);
  };

  const startChatWithUser = async (userId: number | string) => {
    try {
      const res = await messagingApi.startConversation(userId);
      const convId = res.data.conversation?.id || res.data.id;
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      if (convId) {
        router.push(`/messages/${convId}` as any);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not start conversation.');
    }
  };

  // #18: Delete conversation via long-press
  const handleLongPress = (convId: number) => {
    Alert.alert(
      'Conversation Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Chat',
          onPress: async () => {
            try {
              await messagingApi.clearConversation(convId);
              Alert.alert('Cleared', 'Chat history cleared.');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear conversation.');
            }
          },
        },
        {
          text: 'Delete Conversation',
          style: 'destructive',
          onPress: async () => {
            try {
              await messagingApi.deleteConversation(convId);
              setConversations(prev => prev.filter(c => c.id !== convId));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete conversation.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isGroup = item.isGroup || item.is_group || item.type === 'group';
    const groupName = item.name || item.title || 'Group Chat';
    const otherUser = item.otherUser || item.other_user || {};
    const displayTitle = isGroup ? groupName : (otherUser.username || otherUser.full_name || 'User');
    
    const lastMsg = item.lastMessage;
    const previewText = item.previewText || lastMsg?.body || 'Start typing a message...';
    const unreadCount = item.unreadCount || 0;
    const isUnread = unreadCount > 0;
    const timestamp = item.updatedAt || item.updated_at || lastMsg?.createdAt;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/messages/${item.id}` as any)}
        onLongPress={() => handleLongPress(item.id)}
      >
        <View style={styles.avatarContainer}>
          {isGroup ? (
            item.imageUrl || item.avatarUrl ? (
              <Image source={{ uri: item.imageUrl || item.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <UsersIcon color="#fff" size={24} />
            )
          ) : otherUser.profile_picture_url ? (
            <Image source={{ uri: otherUser.profile_picture_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{displayTitle.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.row}>
            <Text style={styles.usernameText}>
              {displayTitle} {isGroup && <Text style={{ color: '#d946ef', fontSize: 10 }}> (Group)</Text>}
            </Text>
            <Text style={styles.timeText}>
              {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
          <Text style={[styles.messageText, isUnread && styles.unreadText]} numberOfLines={1}>
            {previewText}
          </Text>
        </View>
        {isUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
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
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity onPress={() => setShowNewChat(!showNewChat)} style={styles.headerBtn}>
            <Plus color="#fff" size={22} />
          </TouchableOpacity>
        </View>

        {/* New Chat Search Panel */}
        {showNewChat && (
          <View style={styles.newChatPanel}>
            <Text style={styles.newChatLabel}>START NEW CHAT</Text>
            <View style={styles.searchBox}>
              <Search color="#64748b" size={16} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or name"
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
            {searchLoading && <ActivityIndicator color="#47e8ff" style={{ marginTop: 12 }} />}
            {searchResults.map(user => (
              <TouchableOpacity
                key={user.sql_user_id || user.username}
                style={styles.searchResultCard}
                activeOpacity={0.7}
                onPress={() => startChatWithUser(user.sql_user_id || user.id)}
              >
                <View style={styles.searchResultAvatar}>
                  {user.profile_picture_url ? (
                    <Image source={{ uri: user.profile_picture_url }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{(user.username || 'U').charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.usernameText}>{user.username}</Text>
                  {user.full_name ? <Text style={styles.messageText}>{user.full_name}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#47e8ff" />
          </View>
        ) : conversations.length > 0 ? (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <MessageSquare color="#9ca3af" size={32} />
            </View>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptyHint}>Tap + to start a new conversation</Text>
          </View>
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
  orbViolet: { top: -100, right: '-30%', backgroundColor: '#47e8ff' },

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

  // New Chat Panel
  newChatPanel: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  newChatLabel: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, color: '#64748b', letterSpacing: 1.5, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, fontFamily: 'Sora_400Regular', color: '#fff', fontSize: 14 },
  searchResultCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12,
  },
  searchResultAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#7c3aed',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  
  conversationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarContainer: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14, overflow: 'hidden'
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarText: { fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 },
  
  contentContainer: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  usernameText: { fontFamily: 'Sora_700Bold', color: '#f8f9ff', fontSize: 15 },
  timeText: { fontFamily: 'Sora_400Regular', color: '#64748b', fontSize: 11 },
  messageText: { fontFamily: 'Sora_400Regular', color: '#94a3b8', fontSize: 14 },
  unreadText: { fontFamily: 'Sora_700Bold', color: '#f8f9ff' },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: '#d946ef',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6, marginLeft: 10,
  },
  unreadBadgeText: { fontFamily: 'Sora_700Bold', fontSize: 10, color: '#fff' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontFamily: 'Sora_700Bold', color: '#94a3b8', fontSize: 16, marginBottom: 6 },
  emptyHint: { fontFamily: 'Sora_400Regular', color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
