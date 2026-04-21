import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { authApi } from '../../services/api';
import ImagePickerButton from '@/components/ui/image-picker-button';
import { HX_LOGO } from '../../constants/images';

export default function SignupProfileScreen() {
  const [bio, setBio] = useState('');
  const [avatarImages, setAvatarImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleComplete = async (skip = false) => {
    setLoading(true);
    try {
      await authApi.completeProfile({
        bio: skip ? '' : bio,
        skip,
      });
      Alert.alert('Welcome!', 'Your profile is all set.');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to complete profile.');
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
              <Text style={styles.brandTitle}>Almost There!</Text>
              <Text style={styles.brandSub}>
                Add a profile photo and bio — or skip and come back later.
              </Text>
            </LinearGradient>

            <View style={styles.formsSection}>
              <View style={styles.avatarSection}>
                <ImagePickerButton
                  onImagesSelected={setAvatarImages}
                  selectedImages={avatarImages}
                  compact
                  aspectRatio={[1, 1]}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell the world about your vibe..."
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity onPress={() => handleComplete(false)} disabled={loading} activeOpacity={0.8} style={{ marginTop: 16 }}>
                <LinearGradient colors={['#7c3aed', '#d946ef']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save & Continue</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleComplete(true)} disabled={loading} style={styles.skipBtn} activeOpacity={0.7}>
                <Text style={styles.skipText}>Skip for now →</Text>
              </TouchableOpacity>
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
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  avatarHint: { fontFamily: 'Sora_600SemiBold', fontSize: 12, color: '#94a3b8' },
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
  textArea: { height: 100, textAlignVertical: 'top' },
  btnPrimary: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { fontFamily: 'Sora_700Bold', color: '#fff', fontSize: 16 },
  skipBtn: { marginTop: 16, alignItems: 'center', padding: 14 },
  skipText: { fontFamily: 'Sora_600SemiBold', color: '#94a3b8', fontSize: 15 },
});
