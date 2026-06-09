import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Ban, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { GhostButton, Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';

export default function SafetySettingsScreen() {
  const [verified, setVerified] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState(['shadow_x', 'neon_ghost']);
  const [restrictedUsers, setRestrictedUsers] = useState(['dj_phantom']);

  function unblock(user: string) {
    setBlockedUsers(prev => prev.filter(u => u !== user));
  }

  function unrestrict(user: string) {
    setRestrictedUsers(prev => prev.filter(u => u !== user));
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Safety & Verification</Text>
            <Text style={styles.headerSubtitle}>Manage blocked accounts and identity</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Identity Verification</Text>
          <Glass style={[styles.verifyCard, verified ? styles.verifySuccess : styles.verifyAlert]}>
            {verified ? <ShieldCheck color={colors.blue} size={24} /> : <ShieldAlert color={colors.danger} size={24} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyTitle}>{verified ? 'Aadhaar Verified' : 'Identity Not Verified'}</Text>
              <Text style={styles.verifyBody}>
                {verified ? 'Your identity is confirmed. Cyan badge is active.' : 'Verify your Aadhaar to host and join parties.'}
              </Text>
            </View>
            {!verified && <GhostButton label="Verify" />}
          </Glass>

          <Text style={styles.sectionTitle}>Moderation</Text>
          <Glass style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,79,79,0.1)' }]}>
                <Ban color={colors.danger} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Blocked Users</Text>
                <Text style={styles.cardSubtitle}>{blockedUsers.length} blocked</Text>
              </View>
            </View>
            <View style={styles.list}>
              {blockedUsers.length === 0 ? (
                <Text style={styles.emptyText}>No blocked users.</Text>
              ) : (
                blockedUsers.map(u => (
                  <View key={u} style={styles.userRow}>
                    <Text style={styles.username}>@{u}</Text>
                    <TouchableOpacity onPress={() => unblock(u)}>
                      <Text style={[styles.actionText, { color: colors.danger }]}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </Glass>

          <Glass style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(114,183,255,0.1)' }]}>
                <EyeOff color={colors.blue} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Restricted Users</Text>
                <Text style={styles.cardSubtitle}>{restrictedUsers.length} restricted</Text>
              </View>
            </View>
            <View style={styles.list}>
              {restrictedUsers.length === 0 ? (
                <Text style={styles.emptyText}>No restricted users.</Text>
              ) : (
                restrictedUsers.map(u => (
                  <View key={u} style={styles.userRow}>
                    <Text style={styles.username}>@{u}</Text>
                    <TouchableOpacity onPress={() => unrestrict(u)}>
                      <Text style={[styles.actionText, { color: colors.blue }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </Glass>

        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 18 },
  headerSubtitle: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 12, marginTop: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 10 },
  sectionTitle: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 4, marginTop: 16 },
  verifyCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  verifyAlert: { backgroundColor: 'rgba(255,79,79,0.03)', borderColor: 'rgba(255,79,79,0.2)' },
  verifySuccess: { backgroundColor: 'rgba(114,183,255,0.03)', borderColor: 'rgba(114,183,255,0.2)' },
  verifyTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 14 },
  verifyBody: { fontFamily: fonts.regular, color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  cardSubtitle: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, marginTop: 2 },
  list: { padding: 14, paddingTop: 10 },
  emptyText: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  username: { fontFamily: fonts.semibold, color: colors.text, fontSize: 13 },
  actionText: { fontFamily: fonts.bold, fontSize: 12 },
});
