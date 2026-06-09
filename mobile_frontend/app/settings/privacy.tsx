import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Globe, Lock, UserPlus } from 'lucide-react-native';
import { Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';

export default function PrivacySettingsScreen() {
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Privacy</Text>
            <Text style={styles.headerSubtitle}>Manage who can see your activity</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Glass style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.iconBox}>
                {isPrivate ? <Lock color={colors.text} size={16} /> : <Globe color={colors.text} size={16} />}
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.title}>{isPrivate ? 'Private Account' : 'Public Account'}</Text>
                <Text style={styles.desc}>
                  {isPrivate ? 'Only approved followers can see your content' : 'Anyone can discover and view your profile'}
                </Text>
              </View>
              <Switch 
                value={isPrivate} 
                onValueChange={setIsPrivate} 
                thumbColor={isPrivate ? colors.pink : '#d1d5db'} 
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,79,216,0.42)' }} 
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.toggleRow} activeOpacity={0.7}>
              <View style={styles.iconBox}><UserPlus color={colors.text} size={16} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Follow Requests</Text>
                <Text style={styles.desc}>
                  {isPrivate ? '2 pending requests — review them in Notifications' : 'Enable private account to manage requests'}
                </Text>
              </View>
            </TouchableOpacity>
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
  card: { overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  desc: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
});
