import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { ChevronRight } from 'lucide-react-native';

interface SettingCardProps {
  title: string;
  children: React.ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
}

export function SettingCard({ title, children, onPress, showArrow = false }: SettingCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showArrow && <ChevronRight size={20} color={Colors.textMuted} />}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    gap: 12,
  },
});
