import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Moon } from 'lucide-react-native';
import { Glass, Screen } from '@/components/happnix/kit';
import { colors, fonts } from '@/constants/brand';

export default function AppearanceSettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Appearance</Text>
            <Text style={styles.headerSubtitle}>Customize the app's look and feel</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Glass style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.iconBox}>
                <Moon color={colors.text} size={16} />
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.title}>Dark Mode</Text>
                <Text style={styles.desc}>Use dark theme across the app</Text>
              </View>
              <Switch 
                value={darkMode} 
                onValueChange={setDarkMode} 
                thumbColor={darkMode ? colors.pink : '#d1d5db'} 
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,79,216,0.42)' }} 
              />
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
  card: { overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  desc: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, marginTop: 2 },
});
