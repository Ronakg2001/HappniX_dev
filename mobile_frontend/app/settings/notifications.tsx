import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, AtSign, Bell, Crown, UserPlus } from 'lucide-react-native';
import { Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';

export default function NotificationSettingsScreen() {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [followNotifs, setFollowNotifs] = useState(true);
  const [eventNotifs, setEventNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(false);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Manage your alerts and pushes</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Glass style={styles.card}>
            <ToggleRow 
              icon={<Bell color={colors.text} size={16} />} 
              label="Push Notifications" 
              desc="Receive alerts for activity on your account" 
              value={pushNotifs} 
              onToggle={setPushNotifs} 
            />
            <View style={styles.divider} />
            <ToggleRow 
              icon={<UserPlus color={colors.text} size={16} />} 
              label="Follow Requests" 
              desc="New followers and follow request activity" 
              value={followNotifs} 
              onToggle={setFollowNotifs} 
            />
            <View style={styles.divider} />
            <ToggleRow 
              icon={<Crown color={colors.text} size={16} />} 
              label="Event Alerts" 
              desc="Ticket confirmations and event reminders" 
              value={eventNotifs} 
              onToggle={setEventNotifs} 
            />
            <View style={styles.divider} />
            <ToggleRow 
              icon={<AtSign color={colors.text} size={16} />} 
              label="Messages" 
              desc="New message notifications" 
              value={messageNotifs} 
              onToggle={setMessageNotifs} 
            />
          </Glass>

        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function ToggleRow({ icon, label, desc, value, onToggle }: { icon: React.ReactNode, label: string, desc: string, value: boolean, onToggle: (val: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle} 
        thumbColor={value ? colors.pink : '#d1d5db'} 
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,79,216,0.42)' }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 18 },
  headerSubtitle: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 12, marginTop: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 10 },
  card: { overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  desc: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
