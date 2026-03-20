import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface ListeningIndicatorProps {
  isListening: boolean;
  isPocketModeActive?: boolean;
  size?: number;
}

export function ListeningIndicator({ 
  isListening, 
  isPocketModeActive = false,
  size = 120 
}: ListeningIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pocketPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening && !isPocketModeActive) {
      // Active listening animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (isListening && isPocketModeActive) {
      // Pocket mode animation - slower, amber pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pocketPulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pocketPulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations
      pulseAnim.setValue(1);
      scaleAnim.setValue(1);
      pocketPulseAnim.setValue(1);
    }
  }, [isListening, isPocketModeActive, pulseAnim, scaleAnim, pocketPulseAnim]);

  // Get status text and colors
  const getStatusText = () => {
    if (!isListening) return 'Not Listening';
    if (isPocketModeActive) return 'Pocket Mode Active';
    return 'Listening';
  };

  const getIndicatorColor = () => {
    if (!isListening) return Colors.card;
    if (isPocketModeActive) return Colors.yellow;
    return Colors.active;
  };

  const indicatorColor = getIndicatorColor();

  return (
    <View style={styles.container}>
      <View style={[styles.indicatorContainer, { width: size, height: size }]}>
        {isListening && !isPocketModeActive && (
          <>
            <Animated.View
              style={[
                styles.pulse,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.3],
                    outputRange: [0.5, 0],
                  }),
                  backgroundColor: Colors.active,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulse,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  transform: [{ scale: Animated.multiply(pulseAnim, 1.2) }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.3],
                    outputRange: [0.3, 0],
                  }),
                  backgroundColor: Colors.active,
                },
              ]}
            />
          </>
        )}
        
        {isListening && isPocketModeActive && (
          <Animated.View
            style={[
              styles.pulse,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                transform: [{ scale: pocketPulseAnim }],
                opacity: pocketPulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.4, 0],
                }),
                backgroundColor: Colors.yellow,
              },
            ]}
          />
        )}
        
        <Animated.View
          style={[
            styles.core,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: (size * 0.7) / 2,
              transform: [{ scale: scaleAnim }],
              backgroundColor: indicatorColor,
            },
          ]}
        />
      </View>
      
      <View style={styles.statusContainer}>
        <View 
          style={[
            styles.statusDot, 
            { backgroundColor: indicatorColor }
          ]} 
        />
        <Text style={[
          styles.statusText,
          isPocketModeActive && styles.pocketStatusText
        ]}>
          {getStatusText()}
        </Text>
      </View>
      
      {isPocketModeActive && (
        <Text style={styles.pocketSubText}>
          Detection paused - phone in pocket
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  core: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  pocketStatusText: {
    color: Colors.yellow,
  },
  pocketSubText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
