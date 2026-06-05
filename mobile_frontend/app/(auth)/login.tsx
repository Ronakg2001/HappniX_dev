import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '@/services/api';
import { colors, fonts } from '@/constants/brand';
import HappnixLogo from '@/assets/images/Happnix_logo';
import { Glass, GradientButton, GhostButton, Screen } from '@/components/happnix/kit';

type Mode = 'mobile' | 'otp' | 'password';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fullMobile = mobile.startsWith('+') ? mobile : `+91${mobile.replace(/\D/g, '')}`;

  async function sendOtp() {
    const local = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(local) && !/^\+\d{10,15}$/.test(mobile)) {
      Alert.alert('Check number', 'Enter a valid mobile number.');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendMobileOtp(fullMobile, 'IN');
      setMode('otp');
    } catch (error: any) {
      Alert.alert('Could not send OTP', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.verifyMobileOtp(fullMobile, otp);
      if (result.data?.userStatus === 'new') {
        router.replace({ pathname: '/(auth)/signup', params: { mobile: fullMobile, region: 'IN' } });
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Verification failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPassword() {
    if (!identifier || !password) {
      Alert.alert('Missing details', 'Enter username/email and password.');
      return;
    }
    setLoading(true);
    try {
      await authApi.loginWithPassword(identifier, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign in failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
            <View style={styles.logo}>
              <HappnixLogo />
            </View>
            <Text style={styles.title}>
              {mode === 'mobile' && 'Continue with mobile'}
              {mode === 'otp' && 'Verify your number'}
              {mode === 'password' && 'Sign in'}
            </Text>
            <Text style={styles.subtitle}>
              Discover, host, book, and chat around Happnix experiences.
            </Text>

            <Glass style={styles.card}>
              {mode === 'mobile' ? (
                <>
                  <Field label="Mobile number">
                    <TextInput
                      value={mobile}
                      onChangeText={setMobile}
                      placeholder="9876543210"
                      placeholderTextColor={colors.faint}
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  </Field>
                  <GradientButton label="Send OTP" icon={<Phone color="#fff" size={17} />} onPress={sendOtp} loading={loading} />
                  <GhostButton label="Sign in with username or email" icon={<LockKeyhole color={colors.blue} size={16} />} onPress={() => setMode('password')} />
                </>
              ) : null}

              {mode === 'otp' ? (
                <>
                  <Text style={styles.helper}>OTP sent to {fullMobile}</Text>
                  <Field label="OTP code">
                    <TextInput
                      value={otp}
                      onChangeText={(value) => setOtp(value.replace(/\D/g, ''))}
                      placeholder="000000"
                      placeholderTextColor={colors.faint}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[styles.input, styles.otpInput]}
                    />
                  </Field>
                  <GradientButton label="Verify OTP" onPress={verifyOtp} loading={loading} />
                  <View style={styles.row}>
                    <GhostButton label="Resend" onPress={sendOtp} />
                    <GhostButton label="Back" onPress={() => setMode('mobile')} />
                  </View>
                </>
              ) : null}

              {mode === 'password' ? (
                <>
                  <Field label="Username or email">
                    <TextInput
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholder="aaravm"
                      placeholderTextColor={colors.faint}
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  </Field>
                  <Field label="Password">
                    <View style={styles.passwordRow}>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={colors.faint}
                        secureTextEntry={!showPassword}
                        style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent' }]}
                      />
                      <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.eyeBtn}>
                        {showPassword ? <EyeOff color={colors.muted} size={19} /> : <Eye color={colors.muted} size={19} />}
                      </TouchableOpacity>
                    </View>
                  </Field>
                  <GradientButton label="Sign in" onPress={loginWithPassword} loading={loading} />
                  <GhostButton label="Use mobile OTP instead" onPress={() => setMode('mobile')} />
                </>
              ) : null}
            </Glass>

            <Text style={styles.terms}>By continuing, you agree to Happnix Terms and Privacy Policy.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 },
  logo: { width: 146, height: 58, alignSelf: 'center', marginBottom: 8 },
  title: { fontFamily: fonts.black, fontSize: 28, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  card: { padding: 18, gap: 16 },
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
    fontSize: 16,
  },
  otpInput: { textAlign: 'center', fontFamily: fonts.black, fontSize: 22, letterSpacing: 4 },
  helper: { fontFamily: fonts.semibold, color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.07)' },
  eyeBtn: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  terms: { fontFamily: fonts.regular, color: colors.faint, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
