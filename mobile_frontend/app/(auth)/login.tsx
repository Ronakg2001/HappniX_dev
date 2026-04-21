import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../services/api';
import { HX_LOGO } from '../../constants/images';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert('Error', 'Please enter username/mobile and password');
    }
    
    setLoading(true);
    try {
      const response = await authApi.loginWithPassword(username, password);
      if (response.data.token) {
         await SecureStore.setItemAsync('userToken', response.data.token);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Login Failed', error.response?.data?.error || error.response?.data?.message || 'Invalid credentials');
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
                Log in to manage your parties, invites, and group updates in one place. New here? Create an account in under a minute.
              </Text>
            </LinearGradient>

            {/* Forms Content */}
            <View style={styles.formsSection}>
              <Text style={styles.formTitle}>Sign-in with Username/Email</Text>
              <Text style={styles.formDesc}>Enter your Username/Email and Password.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Username or Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username or email"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity style={styles.inlineLinks} onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.formLink}>Forget Password</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8} style={{ marginTop: 20 }}>
                <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign-in</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.formLinks}>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                  <Text style={styles.formLink}>New user? Sign-in with Mobile Number</Text>
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
  field: { marginBottom: 16 },
  label: { display: 'flex', fontSize: 14, fontWeight: '600', color: '#f8fafc', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.16)', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#f8fafc' },
  inlineLinks: { alignItems: 'flex-start', marginTop: 4 },
  formLink: { color: '#e879f9', fontSize: 14, fontWeight: '600' },
  btnPrimary: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  formLinks: { marginTop: 24, alignItems: 'center' }
});
