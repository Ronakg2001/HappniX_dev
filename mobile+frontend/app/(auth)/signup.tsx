import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../services/api';
import { HX_LOGO } from '../../constants/images';

const { width } = Dimensions.get('window');

export default function SignupScreen() {
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (mobile.length < 10) return Alert.alert('Invalid', 'Please enter a valid 10-digit mobile number.');
    
    setLoading(true);
    try {
      const res = await authApi.sendMobileOtp(mobile);
      setOtpSent(true);
      Alert.alert('Success', res.data.message || 'OTP Sent successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter OTP');
    setLoading(true);
    try {
      const response = await authApi.verifyMobileOtp(mobile, otp);
      const data = response.data;
      if (data.userStatus === 'new') {
        Alert.alert('Verified', 'Mobile verified! Complete your sign-up.');
        router.replace('/(auth)/signup-details');
      } else {
        Alert.alert('Welcome back!', data.message || 'Signed in successfully.');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Verification Error', error.response?.data?.error || 'Invalid OTP');
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
            
            {/* Brand Header */}
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.35)', 'rgba(15, 23, 42, 0.32)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.brandSection}
            >
              <Image source={HX_LOGO} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.brandTitle}>Feel Your Vibe</Text>
              <Text style={styles.brandSub}>
                Secure access for hosts, guests, and event managers.
              </Text>
            </LinearGradient>

            {/* Forms Content */}
            <View style={styles.formsSection}>
              {!otpSent ? (
                <>
                  <Text style={styles.formTitle}>Continue with mobile</Text>
                  <Text style={styles.formDesc}>Enter your phone number.</Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                      placeholderTextColor="#64748b"
                      maxLength={10}
                    />
                  </View>

                  <TouchableOpacity onPress={handleSendOtp} disabled={loading} activeOpacity={0.8} style={{ marginTop: 20 }}>
                    <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.formTitle}>Verify mobile OTP</Text>
                  <Text style={styles.formDesc}>OTP verification</Text>

                  <View style={styles.field}>
                    <Text style={styles.infoText}>OTP sent to +91 {mobile}</Text>
                    <Text style={styles.label}>OTP Code</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      placeholderTextColor="#64748b"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} activeOpacity={0.8} style={{ marginTop: 20 }}>
                    <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify OTP</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.formLinks}>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.formLink}>Sign-in with Username/Email</Text>
                </TouchableOpacity>
              </View>
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
  brandSection: { paddingVertical: 40, paddingHorizontal: 30, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  brandLogo: { width: 140, height: 40, marginBottom: 16 },
  brandTitle: { fontSize: 28, fontWeight: '800', color: '#f8fafc', lineHeight: 34, marginBottom: 12 },
  brandSub: { fontSize: 15, color: '#cbd5e1', lineHeight: 24 },
  formsSection: { paddingVertical: 34, paddingHorizontal: 30 },
  formTitle: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  formDesc: { fontSize: 15, color: '#94a3b8', marginBottom: 24 },
  infoText: { fontSize: 14, color: '#d946ef', marginBottom: 16, fontWeight: '500' },
  field: { marginBottom: 16 },
  label: { display: 'flex', fontSize: 14, fontWeight: '600', color: '#f8fafc', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.16)', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#f8fafc' },
  formLink: { color: '#e879f9', fontSize: 14, fontWeight: '600' },
  btnPrimary: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  formLinks: { marginTop: 24, alignItems: 'center' }
});
