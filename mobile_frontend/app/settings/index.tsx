import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, ChevronRight, Lock, LogOut, Moon, ShieldCheck, Tag, Trash2, Users } from 'lucide-react-native';
import { BrandHeader, Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';
import { clearSession, profileApi } from '@/services/api';

export default function SettingsScreen() {
  async function handleLogout() {
    await clearSession();
    router.replace('/(auth)/login');
  }

  function handleSection(route: string) {
    router.push(`/settings/${route}` as any);
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <BrandHeader 
          title="Settings" 
          subtitle="Manage your account preferences" 
        />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <SettingSection title="Privacy & Safety">
            <SettingRow icon={<Lock color={colors.text} size={18} />} label="Privacy" onPress={() => handleSection('privacy')} />
            <SettingRow icon={<ShieldCheck color={colors.text} size={18} />} label="Safety & Verification" onPress={() => handleSection('safety')} />
          </SettingSection>

          <SettingSection title="Social & Family">
            <SettingRow icon={<Tag color={colors.text} size={18} />} label="Social Permissions" onPress={() => handleSection('social')} />
            <SettingRow icon={<Users color={colors.text} size={18} />} label="Family & Roles" onPress={() => handleSection('family')} />
          </SettingSection>

          <SettingSection title="Preferences">
            <SettingRow icon={<Bell color={colors.text} size={18} />} label="Notifications" onPress={() => handleSection('notifications')} />
            <SettingRow icon={<Moon color={colors.text} size={18} />} label="Appearance" onPress={() => handleSection('appearance')} />
          </SettingSection>

          <SettingSection title="Account">
            <SettingRow icon={<LogOut color={colors.danger} size={18} />} label="Sign Out" onPress={handleLogout} danger />
            <SettingRow icon={<Trash2 color={colors.danger} size={18} />} label="Delete Account" onPress={() => {
              Alert.alert(
                "Delete Account",
                "Are you sure you want to permanently delete your account? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: async () => {
                    try {
                      await profileApi.deleteAccount();
                      await clearSession();
                      Alert.alert("Success", "Account deleted successfully.");
                      router.replace('/(auth)/login');
                    } catch (error) {
                      Alert.alert("Error", "Failed to delete account. Please try again.");
                    }
                  }}
                ]
              );
            }} danger />
          </SettingSection>

        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function SettingSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Glass style={styles.sectionCard}>
        {children}
      </Glass>
    </View>
  );
}

function SettingRow({ icon, label, onPress, danger }: { icon: React.ReactNode, label: string, onPress: () => void, danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.iconContainer, danger && styles.iconDanger]}>
        {icon}
      </View>
      <Text style={[styles.rowLabel, danger && styles.labelDanger]}>{label}</Text>
      <ChevronRight color={colors.muted} size={16} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 10 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 },
  sectionCard: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  iconContainer: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconDanger: { backgroundColor: 'rgba(255,79,79,0.1)' },
  rowLabel: { flex: 1, fontFamily: fonts.semibold, color: colors.text, fontSize: 15 },
  labelDanger: { color: colors.danger },
});
