import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass } from 'lucide-react-native';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.bgWrapper}>
          <LinearGradient
            colors={['rgba(7, 11, 23, 0.96)', 'rgba(7, 11, 23, 0.86)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.orb, styles.orbViolet]} />
          <View style={[styles.orb, styles.orbCyan]} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Compass color="#d946ef" size={48} />
          </View>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Coming Soon</Text>
          <Text style={styles.desc}>
            Discover trending events, featured hosts, and curated experiences near you.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b17' },
  container: { flex: 1, backgroundColor: '#070b17', justifyContent: 'center', alignItems: 'center' },
  bgWrapper: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.18 },
  orbViolet: { top: -100, right: '-30%', backgroundColor: '#ff4fd8' },
  orbCyan: { bottom: -100, left: '-20%', backgroundColor: '#47e8ff' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.2)',
  },
  title: { fontFamily: 'Syne_800ExtraBold', fontSize: 32, color: '#f8f9ff', marginBottom: 4 },
  subtitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 12, color: '#d946ef', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 },
  desc: { fontFamily: 'Sora_400Regular', fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 24 },
});
