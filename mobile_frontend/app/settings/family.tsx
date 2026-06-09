import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Baby, Check, Crown, UserCog, Users } from 'lucide-react-native';
import { Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';

export default function FamilySettingsScreen() {
  const [familyRole, setFamilyRole] = useState('member');

  const familyRoles = [
    { value: 'member', label: 'Member', desc: 'Standard account access', icon: Users },
    { value: 'parent', label: 'Parent', desc: 'Supervise child accounts', icon: Crown },
    { value: 'child', label: 'Child', desc: 'Under parental supervision', icon: Baby },
    { value: 'admin', label: 'Admin', desc: 'Full platform management', icon: UserCog },
  ];

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Family & Roles</Text>
            <Text style={styles.headerSubtitle}>Manage family group and supervision</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Glass style={styles.card}>
            <Text style={styles.cardDesc}>
              Family roles control supervision permissions and activity visibility within your family group.
            </Text>
            {familyRoles.map((role, idx) => {
              const Icon = role.icon;
              const isSelected = familyRole === role.value;
              return (
                <TouchableOpacity 
                  key={role.value} 
                  style={[styles.roleRow, idx > 0 && styles.roleRowBorder, isSelected && styles.roleRowSelected]} 
                  activeOpacity={0.7} 
                  onPress={() => setFamilyRole(role.value)}
                >
                  <View style={[styles.roleIconBox, isSelected && styles.roleIconBoxSelected]}>
                    <Icon color={isSelected ? '#fff' : colors.muted} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleTitle}>{role.label}</Text>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                  </View>
                  {isSelected && <Check color={colors.pink} size={18} />}
                </TouchableOpacity>
              );
            })}
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
  cardDesc: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, padding: 14, paddingBottom: 6, lineHeight: 18 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  roleRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  roleRowSelected: { backgroundColor: 'rgba(255,255,255,0.03)' },
  roleIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  roleIconBoxSelected: { backgroundColor: colors.pink },
  roleTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  roleDesc: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, marginTop: 2 },
});
