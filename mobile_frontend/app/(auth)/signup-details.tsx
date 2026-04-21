import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../services/api';
import DatePickerModal from '@/components/ui/date-picker';
import { HX_LOGO } from '../../constants/images';

const SEX_OPTIONS = [
  { label: 'Mr.', value: 'mr.' },
  { label: 'Miss.', value: 'miss.' },
  { label: 'Mrs.', value: 'mrs.' },
  { label: 'Other', value: 'other' },
];

export default function SignupDetailsScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sex, setSex] = useState('');
  const [dob, setDob] = useState('');
  const [govId, setGovId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !username || !email || !password || !sex || !dob) {
      return Alert.alert('Error', 'All fields except Gov ID are required.');
    }
    if (fullName.length < 3) {
      return Alert.alert('Error', 'Please enter a valid full name (min 3 chars).');
    }

    setLoading(true);
    try {
      const response = await authApi.registerDetails({
        fullName,
        username,
        password,
        email,
        sex,
        dateOfBirth: dob,
        govId,
      });
      Alert.alert('Success', response.data.message || 'Details saved!');
      router.replace('/(auth)/signup-profile');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed.');
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
              <Text style={styles.brandTitle}>Complete Your Profile</Text>
              <Text style={styles.brandSub}>
                Just a few more details to get you started.
              </Text>
            </LinearGradient>

            <View style={styles.formsSection}>
              <Text style={styles.formTitle}>Sign-up Details</Text>
              <Text style={styles.formDesc}>Fill out all required fields to create your account.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a unique username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email *</Text>
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

              <View style={styles.field}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 chars, uppercase, lowercase, number, special"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Sex *</Text>
                <View style={styles.sexRow}>
                  {SEX_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.sexChip, sex === opt.value && styles.sexChipActive]}
                      onPress={() => setSex(opt.value)}
                    >
                      <Text style={[styles.sexChipText, sex === opt.value && styles.sexChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Date of Birth *</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                  <View style={styles.input}>
                    <Text style={{ color: dob ? '#f8fafc' : '#64748b', fontSize: 15 }}>
                      {dob || 'Select your date of birth'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Government ID (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12-digit Aadhaar number"
                  value={govId}
                  onChangeText={setGovId}
                  keyboardType="number-pad"
                  maxLength={12}
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8} style={{ marginTop: 20 }}>
                <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.formLinks}>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.formLink}>Already have an account? Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSave={(d) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          setDob(`${year}-${month}-${day}`);
          setShowDatePicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.28 },
  orbViolet: { width: 280, height: 280, top: -80, left: -80, backgroundColor: '#7c3aed' },
  orbFuchsia: { width: 340, height: 340, right: -120, bottom: -120, backgroundColor: '#c026d3' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, paddingBottom: 40 },
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
  formTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: '#f8fafc', marginBottom: 6 },
  formDesc: { fontFamily: 'Sora_400Regular', fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontFamily: 'Sora_600SemiBold', fontSize: 13, color: '#f8fafc', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: '#f8fafc',
    fontFamily: 'Sora_400Regular',
  },
  sexRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sexChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  sexChipActive: {
    borderColor: '#d946ef',
    backgroundColor: 'rgba(217, 70, 239, 0.15)',
  },
  sexChipText: { fontFamily: 'Sora_600SemiBold', fontSize: 13, color: '#94a3b8' },
  sexChipTextActive: { color: '#d946ef' },
  formLink: { fontFamily: 'Sora_600SemiBold', color: '#e879f9', fontSize: 14 },
  btnPrimary: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { fontFamily: 'Sora_700Bold', color: '#fff', fontSize: 16 },
  formLinks: { marginTop: 24, alignItems: 'center' },
});
