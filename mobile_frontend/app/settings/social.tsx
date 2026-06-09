import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, AtSign, Check, Tag } from 'lucide-react-native';
import { Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';

export default function SocialSettingsScreen() {
  const [tagPermission, setTagPermission] = useState('followers');
  const [mentionPermission, setMentionPermission] = useState('everyone');
  const permOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'followers', label: 'Followers only' },
    { value: 'none', label: 'No one' },
  ];

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Social & Family</Text>
            <Text style={styles.headerSubtitle}>Manage interactions and family group</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Glass style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}><Tag color={colors.text} size={16} /></View>
              <Text style={styles.cardTitle}>Who can tag me?</Text>
            </View>
            <View style={styles.optionsList}>
              {permOptions.map(opt => (
                <RadioRow 
                  key={opt.value} 
                  label={opt.label} 
                  selected={tagPermission === opt.value} 
                  onPress={() => setTagPermission(opt.value)} 
                  color={colors.pink} 
                />
              ))}
            </View>
            <View style={[styles.cardHeader, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.iconBox}><AtSign color={colors.text} size={16} /></View>
              <Text style={styles.cardTitle}>Who can mention me?</Text>
            </View>
            <View style={styles.optionsList}>
              {permOptions.map(opt => (
                <RadioRow 
                  key={opt.value} 
                  label={opt.label} 
                  selected={mentionPermission === opt.value} 
                  onPress={() => setMentionPermission(opt.value)} 
                  color={colors.blue} 
                />
              ))}
            </View>
          </Glass>

        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function RadioRow({ label, selected, onPress, color }: { label: string, selected: boolean, onPress: () => void, color: string }) {
  return (
    <TouchableOpacity style={styles.radioRow} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.radioCircle, selected && { borderColor: color, backgroundColor: color }]}>
        {selected && <Check color="#fff" size={10} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.black, color: colors.text, fontSize: 18 },
  headerSubtitle: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 12, marginTop: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 10 },
  sectionTitle: { fontFamily: fonts.black, color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 4, marginTop: 16 },
  card: { marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  optionsList: { paddingHorizontal: 14, paddingBottom: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  radioLabel: { fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  cardDesc: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, padding: 14, paddingBottom: 6, lineHeight: 18 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  roleRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  roleRowSelected: { backgroundColor: 'rgba(255,255,255,0.03)' },
  roleIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  roleIconBoxSelected: { backgroundColor: colors.pink },
  roleTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  roleDesc: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, marginTop: 2 },
});
