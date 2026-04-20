import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => void;
  initialTime?: { hour: number; minute: number; period: 'AM' | 'PM' };
}

export default function TimePickerModal({ visible, onClose, onSave, initialTime }: TimePickerProps) {
  const [hour, setHour] = useState(initialTime?.hour || 10);
  const [minute, setMinute] = useState(initialTime?.minute || 0);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialTime?.period || 'PM');
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  // Animated rotation values
  const hourAngle = useSharedValue(0);
  const minuteAngle = useSharedValue(0);

  useEffect(() => {
    // Calculate angles
    const hAngle = (hour % 12) * 30 + (minute / 2);
    const mAngle = minute * 6;
    hourAngle.value = withSpring(hAngle, { damping: 14, stiffness: 100 });
    minuteAngle.value = withSpring(mAngle, { damping: 14, stiffness: 100 });
  }, [hour, minute]);

  const animatedHourStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: '-50%' },
        { rotate: `${hourAngle.value}deg` }
      ],
    };
  });

  const animatedMinuteStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: '-50%' },
        { rotate: `${minuteAngle.value}deg` }
      ],
    };
  });

  // Cycle handlers for simple interaction
  const handleHourPress = () => {
    setMode('hour');
    setHour((h) => (h % 12) + 1);
  };

  const handleMinutePress = () => {
    setMode('minute');
    setMinute((m) => (m + 5) % 60);
  };

  const togglePeriod = () => {
    setPeriod((p) => (p === 'AM' ? 'PM' : 'AM'));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2, 6, 23, 0.75)' }]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </View>
      </Animated.View>

      <View style={styles.modalContainer} pointerEvents="box-none">
        <Animated.View 
          entering={SlideInDown.springify().damping(18).stiffness(150)} 
          exiting={SlideOutDown.duration(250)}
          style={styles.cardContainer}
        >
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.92)', 'rgba(15, 23, 42, 0.85)', 'rgba(46, 16, 101, 0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Time</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#9ca3af" size={20} />
              </TouchableOpacity>
            </View>

            {/* Digital Display */}
            <View style={styles.digitalDisplayWrap}>
              <View style={styles.analogDigitalClock}>
                <TouchableOpacity onPress={handleHourPress} style={[styles.segment, mode === 'hour' && styles.segmentActive]}>
                  <Text style={[styles.segmentText, mode === 'hour' && styles.segmentTextActive]}>
                    {hour.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.separator}>:</Text>
                <TouchableOpacity onPress={handleMinutePress} style={[styles.segment, mode === 'minute' && styles.segmentActive]}>
                  <Text style={[styles.segmentText, mode === 'minute' && styles.segmentTextActive]}>
                    {minute.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={togglePeriod} 
                  style={[styles.periodBtn, period === 'AM' ? styles.periodAm : styles.periodPm]}
                >
                  <Text style={[styles.periodText, period === 'AM' ? styles.periodTextAm : styles.periodTextPm]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.hintText}>Tap hour or minute to cycle values</Text>

            {/* Analog Clock Dial */}
            <View style={styles.dialWrap}>
              <View style={styles.dial}>
                {/* Minute Hand */}
                <Animated.View style={[styles.minuteHand, animatedMinuteStyle]} />
                {/* Hour Hand */}
                <Animated.View style={[styles.hourHand, animatedHourStyle]} />
                {/* Center Node */}
                <View style={styles.clockCenter} />
              </View>
            </View>

            {/* Subtext */}
            <Text style={styles.subText}>Only future time is allowed for selected date.</Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={() => { setHour(10); setMinute(0); setPeriod('AM'); }}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => onSave({ hour, minute, period })}>
                <Text style={styles.saveBtnText}>Save time</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '94%',
    maxWidth: 420,
    borderRadius: 24,
    shadowColor: '#d946ef',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  cardGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.2)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_900Black',
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  digitalDisplayWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  analogDigitalClock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  segment: {
    minWidth: 46,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(219, 39, 119, 0.45)', // Pink gradient fallback
    borderColor: 'rgba(71, 232, 255, 0.5)',
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(248, 249, 255, 0.94)',
  },
  segmentTextActive: {
    color: '#fff',
  },
  separator: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(248, 249, 255, 0.75)',
  },
  periodBtn: {
    marginLeft: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  periodAm: {
    backgroundColor: 'rgba(255, 214, 102, 0.9)',
    borderColor: 'rgba(255, 222, 144, 0.95)',
    shadowColor: '#ffb74d',
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  periodPm: {
    backgroundColor: 'rgba(66, 91, 255, 0.82)',
    borderColor: 'rgba(124, 154, 255, 0.9)',
    shadowColor: '#6774ff',
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  periodText: {
    fontWeight: '700',
    fontSize: 12,
  },
  periodTextAm: {
    color: '#2e1b00',
  },
  periodTextPm: {
    color: '#eef2ff',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 20,
  },
  dialWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dial: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(71, 232, 255, 0.25)',
    backgroundColor: 'rgba(12, 17, 36, 0.6)', 
    position: 'relative',
    shadowColor: 'rgba(255, 79, 216, 0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  hourHand: {
    position: 'absolute',
    left: '50%',
    top: '25%', // Length adjustment
    width: 4,
    height: 60,
    backgroundColor: '#47e8ff',
    borderRadius: 2,
    transformOrigin: 'bottom center', // Note: React Native style doesn't use standard CSS transform-origin. We must offset the center safely!
  },
  minuteHand: {
    position: 'absolute',
    left: '50%',
    top: '15%', 
    width: 2,
    height: 84,
    backgroundColor: '#fb7185',
    borderRadius: 1,
    transformOrigin: 'bottom center',
  },
  clockCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    borderRadius: 7,
    backgroundColor: '#47e8ff',
    shadowColor: '#47e8ff',
    shadowOpacity: 0.8,
    shadowRadius: 14,
  },
  subText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearBtnText: {
    color: '#d1d5db',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.4)',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#a5f3fc',
    fontWeight: '600',
    fontSize: 15,
  }
});
