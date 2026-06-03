import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '@/services/api';
import { colors, fonts } from '@/constants/brand';
import { BrandHeader, Glass, GradientButton, Screen } from '@/components/happnix/kit';

export default function SignupScreen() {
  const params = useLocalSearchParams<{ mobile?: string; region?: string }>();
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.username || !form.fullName || !form.email || !form.dateOfBirth || !form.gender || !form.password) {
      Alert.alert('Missing details', 'Fill all fields to create your Happnix account.');
      return;
    }
    setLoading(true);
    try {
      await authApi.registerDetails({
        ...form,
        mobile: params.mobile,
        region: params.region || 'IN',
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Signup failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <BrandHeader title="Create account" subtitle={params.mobile ? `Verified ${params.mobile}` : 'Finish your Happnix profile'} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Glass style={styles.card}>
              <Input label="Username" value={form.username} onChangeText={(v) => update('username', v.toLowerCase().replace(/\s/g, ''))} placeholder="aaravm" />
              <Input label="Full name" value={form.fullName} onChangeText={(v) => update('fullName', v)} placeholder="Aarav Mehta" />
              <Input label="Email" value={form.email} onChangeText={(v) => update('email', v)} placeholder="you@example.com" keyboardType="email-address" />
              <View style={styles.row}>
                <Input label="DOB" value={form.dateOfBirth} onChangeText={(v) => update('dateOfBirth', v)} placeholder="YYYY-MM-DD" style={{ flex: 1 }} />
                <Input label="Gender" value={form.gender} onChangeText={(v) => update('gender', v)} placeholder="Male" style={{ flex: 1 }} />
              </View>
              <Input label="Password" value={form.password} onChangeText={(v) => update('password', v)} placeholder="Strong password" secureTextEntry />
              <GradientButton label="Create Account" onPress={submit} loading={loading} />
            </Glass>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

function Input({ label, style, ...props }: TextInputProps & { label: string; style?: any }) {
  return (
    <View style={[{ gap: 7 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.faint} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },
  card: { padding: 16, gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontFamily: fonts.black, fontSize: 11, color: colors.faint, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
});
