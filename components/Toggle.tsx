import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, description, value, onChange, disabled = false }: ToggleProps) {
  const translateX = value ? 22 : 2;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !disabled && onChange(!value)}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
        {description && (
          <Text style={[styles.description, disabled && styles.disabledText]}>{description}</Text>
        )}
      </View>
      <View style={[
        styles.track,
        value && styles.trackActive,
        disabled && styles.trackDisabled,
      ]}>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  disabledText: {
    opacity: 0.5,
  },
  track: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackActive: {
    backgroundColor: Colors.primary,
  },
  trackDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text,
  },
});
