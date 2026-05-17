// React/components/common/LoadingScreen.jsx

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import colors from '../styles/tokens/colors';
import {fontSize, fontWeight} from '../styles/tokens/typography';

// context: 'boot' (default) | 'creating_ride'
const LoadingScreen = ({context = 'boot'}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(barAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const barWidth = barAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: ['0%', '100%', '100%'],
  });

  const barOpacity = barAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });

  const message =
    context === 'creating_ride' ? 'Creating your ride...' : 'Starting up...';

  return (
    <Animated.View style={[styles.root, {opacity: fadeAnim}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <View style={[styles.bgRing, styles.bgRingTopLeft]} />
      <View style={[styles.bgRing, styles.bgRingBottomRight]} />
      <View style={[styles.bgRing, styles.bgRingSmall]} />

      <View style={styles.logoWrap}>
        <Animated.View
          style={[styles.spinRing, {transform: [{rotate: spin}]}]}
        />
        <View style={styles.iconBox}>
          {/* Replace with your actual logo/icon */}
          <Text style={styles.iconText}>🏍</Text>
        </View>
      </View>

      <Text style={styles.wordmark}>
        RIDE<Text style={styles.wordmarkAccent}>GO</Text>
      </Text>
      <Text style={styles.tagline}>YOUR RIDE, YOUR ROUTE</Text>

      <View style={styles.barWrap}>
        <Animated.View
          style={[styles.barFill, {width: barWidth, opacity: barOpacity}]}
        />
      </View>

      <Text style={styles.message}>{message}</Text>

      <Text style={styles.version}>v1.0</Text>
    </Animated.View>
  );
};

const RING_SIZE = 90;
const RING_BORDER = 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(140, 35, 35, 0.12)',
  },
  bgRingTopLeft: {
    width: 500,
    height: 500,
    top: -230,
    left: -220,
  },
  bgRingBottomRight: {
    width: 340,
    height: 340,
    bottom: -160,
    right: -140,
  },
  bgRingSmall: {
    width: 160,
    height: 160,
    bottom: 130,
    left: 20,
    opacity: 0.5,
  },
  logoWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  spinRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
    borderRightColor: 'rgba(140, 35, 35, 0.3)',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  wordmark: {
    color: colors.white,
    fontSize: 32,
    fontWeight: fontWeight.bold,
    letterSpacing: 3,
    marginBottom: 6,
  },
  wordmarkAccent: {
    color: colors.primary,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 3,
    marginBottom: 56,
  },
  barWrap: {
    width: 160,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: fontSize.sm,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 11,
    letterSpacing: 1,
  },
});

export default LoadingScreen;
