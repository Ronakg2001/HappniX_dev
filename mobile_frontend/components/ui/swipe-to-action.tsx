import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  interpolateColor,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';

interface SwipeToActionProps {
  onSwipeRight: () => void;
  onSwipeLeft?: () => void;
  loading?: boolean;
  rightLabel?: string;
  leftLabel?: string;
  trackWidth?: number;
}

export default function SwipeToAction({
  onSwipeRight,
  onSwipeLeft,
  loading = false,
  rightLabel = 'PUBLISH',
  leftLabel = 'CANCEL',
  trackWidth = 340,
}: SwipeToActionProps) {
  const THUMB_SIZE = 50;
  const PADDING = 12;
  const maxDrag = (trackWidth / 2) - (THUMB_SIZE / 2) - PADDING;
  const triggerThreshold = maxDrag * 0.85;

  const translateX = useSharedValue(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const resetThumb = () => {
    'worklet';
    translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
    runOnJS(setIsCompleted)(false);
  };

  const handleCompleteRight = () => {
    setIsCompleted(true);
    onSwipeRight();
    setTimeout(resetThumb, 1500);
  };

  const handleCompleteLeft = () => {
    if (onSwipeLeft) {
      setIsCompleted(true);
      onSwipeLeft();
      setTimeout(resetThumb, 1500);
    } else {
      resetThumb();
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (isCompleted || loading) return;
      let val = e.translationX;
      if (val > maxDrag) val = maxDrag;
      if (!onSwipeLeft && val < 0) val = 0;
      if (onSwipeLeft && val < -maxDrag) val = -maxDrag;
      translateX.value = val;
    })
    .onEnd(() => {
      if (isCompleted || loading) return;
      if (translateX.value > triggerThreshold) {
        translateX.value = withSpring(maxDrag);
        runOnJS(handleCompleteRight)();
      } else if (onSwipeLeft && translateX.value < -triggerThreshold) {
        translateX.value = withSpring(-maxDrag);
        runOnJS(handleCompleteLeft)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: Math.abs(translateX.value) > triggerThreshold ? withSpring(1.1) : withSpring(1) },
      ],
    };
  });

  const animatedBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(Math.abs(translateX.value), [0, maxDrag], [0, 0.8], Extrapolation.CLAMP);
    const color = translateX.value > 0 ? '#0D3A63' : '#C84C49';
    return {
      opacity,
      backgroundColor: color,
    };
  });

  // Re-map colors using SVGs native interpolations
  const AnimatedChevron = Animated.createAnimatedComponent(ChevronRight);

  const iconStyle = useAnimatedStyle(() => {
    const rotation = interpolate(translateX.value, [-maxDrag, 0, maxDrag], [90, 0, -90], Extrapolation.CLAMP);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const rightTextOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(translateX.value, [0, maxDrag], [1, 0], Extrapolation.CLAMP),
    };
  });

  const leftTextOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(translateX.value, [-maxDrag, 0], [1, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <View style={[styles.container, { width: trackWidth }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.bg, animatedBgStyle]} />

      {onSwipeLeft && (
        <Animated.Text style={[styles.label, styles.leftLabel, leftTextOpacity]}>
          {leftLabel}
        </Animated.Text>
      )}
      <Animated.Text style={[styles.label, styles.rightLabel, rightTextOpacity]}>
        {rightLabel}
      </Animated.Text>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.thumb, animatedThumbStyle]}>
          {loading ? (
            <ActivityIndicator color="#0D3A63" size="small" />
          ) : (
            <Animated.View style={iconStyle}>
              <AnimatedChevron color="#121212" strokeWidth={3} size={24} />
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 74,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 37,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 12,
    alignSelf: 'center',
  },
  bg: {
    borderRadius: 37,
  },
  thumb: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  label: {
    position: 'absolute',
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none',
  },
  leftLabel: {
    left: 24,
  },
  rightLabel: {
    right: 24,
  },
});
