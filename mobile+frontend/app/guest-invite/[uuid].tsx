import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { groupTicketApi } from '../../services/api';

export default function GuestInviteScreen() {
  const { uuid } = useLocalSearchParams();

  useEffect(() => {
    if (!uuid) {
      Alert.alert('Invalid Link', 'This invite link appears to be broken.');
      router.replace('/(tabs)');
      return;
    }

    const processInvite = async () => {
      try {
        await groupTicketApi.acceptInvite(uuid as string);
        Alert.alert('Success!', 'You have successfully joined the group ticket! See your Wallet.');
        router.replace('/(tabs)/tickets');
      } catch (err: any) {
        // If unauthenticated (401), we usually want to route to login, but Expo Secure Storage 
        // handles auth logic. Standard error handling applies here.
        if (err.response?.status === 401) {
           Alert.alert('Login Required', 'Please login to accept this ticket invite.');
           router.replace('/login');
        } else {
           Alert.alert('Invite Error', err.response?.data?.error || 'Failed to accept the invite.');
           router.replace('/(tabs)');
        }
      }
    };

    processInvite();
  }, [uuid]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.orb, styles.orbViolet]} />
        </View>

        <View style={styles.center}>
          <Ticket color="#47e8ff" size={64} style={{ marginBottom: 24, opacity: 0.8 }} />
          <ActivityIndicator size="large" color="#d946ef" />
          <Text style={styles.loadingText}>Processing your VIP invite...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  orbViolet: { top: 100, left: '-30%', backgroundColor: '#ff4fd8' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { fontFamily: 'Sora_600SemiBold', fontSize: 16, color: '#f8f9ff', marginTop: 16, textAlign: 'center' }
});
