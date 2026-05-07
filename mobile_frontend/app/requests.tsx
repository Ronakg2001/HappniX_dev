import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { profileApi } from '../services/api';

export default function FollowRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await profileApi.getFollowRequests();
      setRequests(res.data.requests || []);
    } catch (e) {
      console.error('Failed to fetch follow requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      await profileApi.handleFollowRequest(userId, 'approve');
      setRequests(current => current.filter(r => r.sql_user_id !== userId));
    } catch (e) {
      console.error('Failed to approve request:', e);
    }
  };

  const handleDeny = async (userId: number) => {
    try {
      await profileApi.handleFollowRequest(userId, 'deny');
      setRequests(current => current.filter(r => r.sql_user_id !== userId));
    } catch (e) {
      console.error('Failed to deny request:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Follow Requests</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#47e8ff" style={{ marginTop: 40 }} />
          ) : requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No pending requests</Text>
              <Text style={styles.emptyStateDesc}>When users request to follow your private account, they will appear here.</Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={item => (item.sql_user_id || item.id || Math.random()).toString()}
              contentContainerStyle={styles.flatListContent}
              renderItem={({ item }) => (
                <View style={styles.requestCard}>
                  {item.profile_picture_url ? (
                    <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontFamily: 'Syne_800ExtraBold', color: '#fff', fontSize: 18 }}>
                        {(item.username || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.name}>{item.full_name || ''}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtnReject} onPress={() => handleDeny(item.sql_user_id)}>
                      <X color="#9ca3af" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleApprove(item.sql_user_id)} activeOpacity={0.8}>
                      <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.actionBtnApprove}>
                        <Check color="#fff" size={20} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 18,
    color: '#fff',
  },
  listContainer: { flex: 1 },
  flatListContent: { padding: 16, gap: 16 },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: { flex: 1 },
  username: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#fff',
    marginBottom: 2
  },
  name: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#94a3b8'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnReject: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  actionBtnApprove: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#fff', marginBottom: 8 },
  emptyStateDesc: { fontFamily: 'Sora_400Regular', fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }
});
