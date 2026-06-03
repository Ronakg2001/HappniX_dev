import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { authApi } from '../../services/api';
import { HX_LOGO } from '../../constants/images';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address.');
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setSent(true);
      Alert.alert('Sent', response.data.message || 'If this email is registered, you will get reset instructions.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.orb, styles.orbViolet]} />
      <View style={[styles.orb, styles.orbFuchsia]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.authShell}>

            <LinearGradient
              colors={['rgba(124, 58, 237, 0.35)', 'rgba(15, 23, 42, 0.32)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.brandSection}
            >
              <Image source={HX_LOGO} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.brandTitle}>Reset Password</Text>
              <Text style={styles.brandSub}>
                Enter your registered email and we will send you reset instructions.
              </Text>
            </LinearGradient>

            <View style={styles.formsSection}>
              {sent ? (
                <View style={styles.successSection}>
                  <View style={styles.successIcon}>
                    <Mail color="#4ade80" size={36} />
                  </View>
                  <Text style={styles.successTitle}>Check Your Inbox</Text>
                  <Text style={styles.successDesc}>
                    If an account exists with {email}, we have sent password reset instructions.
                  </Text>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
                    <ArrowLeft color="#e879f9" size={18} />
                    <Text style={styles.formLink}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8} style={{ marginTop: 16 }}>
                    <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.formLinks}>
                    <TouchableOpacity onPress={() => router.back()}>
                      <Text style={styles.formLink}>← Back to Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.28 },
  orbViolet: { width: 280, height: 280, top: -80, left: -80, backgroundColor: '#7c3aed' },
  orbFuchsia: { width: 340, height: 340, right: -120, bottom: -120, backgroundColor: '#c026d3' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  authShell: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  brandSection: { paddingVertical: 30, paddingHorizontal: 30, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  brandLogo: { width: 140, height: 40, marginBottom: 12 },
  brandTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 24, color: '#f8fafc', lineHeight: 30, marginBottom: 8 },
  brandSub: { fontFamily: 'Sora_400Regular', fontSize: 14, color: '#cbd5e1', lineHeight: 22 },
  formsSection: { paddingVertical: 28, paddingHorizontal: 30 },
  successSection: { alignItems: 'center', paddingVertical: 20 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  successTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: '#f8fafc', marginBottom: 10 },
  successDesc: { fontFamily: 'Sora_400Regular', fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { marginBottom: 14 },
  label: { fontFamily: 'Sora_600SemiBold', fontSize: 13, color: '#f8fafc', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 12, padding: 14, fontSize: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: '#f8fafc',
    fontFamily: 'Sora_400Regular',
  },
  formLink: { fontFamily: 'Sora_600SemiBold', color: '#e879f9', fontSize: 14 },
  btnPrimary: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { fontFamily: 'Sora_700Bold', color: '#fff', fontSize: 16 },
  formLinks: { marginTop: 24, alignItems: 'center' },
});
