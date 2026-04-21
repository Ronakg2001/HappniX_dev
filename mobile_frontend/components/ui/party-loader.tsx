import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function PartyLoader() {
  const h1 = useSharedValue(10);
  const h2 = useSharedValue(10);
  const h3 = useSharedValue(10);
  const h4 = useSharedValue(10);

  useEffect(() => {
    const config = { duration: 350, easing: Easing.inOut(Easing.ease) };
    h1.value = withRepeat(withSequence(withTiming(40, config), withTiming(10, config)), -1, true);
    
    // Staggered starts for equalizer effect
    const t2 = setTimeout(() => { h2.value = withRepeat(withSequence(withTiming(50, config), withTiming(15, config)), -1, true) }, 100);
    const t3 = setTimeout(() => { h3.value = withRepeat(withSequence(withTiming(45, config), withTiming(10, config)), -1, true) }, 200);
    const t4 = setTimeout(() => { h4.value = withRepeat(withSequence(withTiming(35, config), withTiming(20, config)), -1, true) }, 300);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const s1 = useAnimatedStyle(() => ({ height: h1.value }));
  const s2 = useAnimatedStyle(() => ({ height: h2.value }));
  const s3 = useAnimatedStyle(() => ({ height: h3.value }));
  const s4 = useAnimatedStyle(() => ({ height: h4.value }));

  return (
    <View style={styles.container}>
      <AnimatedGradient colors={['#3b82f6', '#8b5cf6']} style={[styles.bar, s1]} />
      <AnimatedGradient colors={['#8b5cf6', '#d946ef']} style={[styles.bar, s2]} />
      <AnimatedGradient colors={['#d946ef', '#f43f5e']} style={[styles.bar, s3]} />
      <AnimatedGradient colors={['#f43f5e', '#f97316']} style={[styles.bar, s4]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 60,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  }
});
