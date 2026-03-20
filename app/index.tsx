import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Settings, Shield, TestTube, Activity, Power, Globe } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ListeningIndicator } from '@/components/ListeningIndicator';
import { useDetection } from '@/contexts/DetectionContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isListening, startListening, stopListening, lastDetection, permissionError, clearPermissionError, isWebMode, isPocketModeActive } = useDetection();

  React.useEffect(() => {
    if (permissionError) {
      Alert.alert(
        'Permission Required',
        permissionError,
        [
          { text: 'OK', onPress: clearPermissionError }
        ]
      );
    }
  }, [permissionError, clearPermissionError]);

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      const success = await startListening();
      if (!success) {
        console.log('Failed to start listening - check permissions');
      }
    }
  };

  const menuItems = [
    {
      icon: Settings,
      title: 'Finder Modes',
      subtitle: 'Clap & whistle detection',
      onPress: () => router.push('/finder-modes'),
      color: Colors.primary,
    },
    {
      icon: Mic,
      title: 'Alarm Settings',
      subtitle: 'Sound & flashlight',
      onPress: () => router.push('/alarm-settings'),
      color: Colors.yellow,
    },
    {
      icon: Shield,
      title: 'Anti-Theft Mode',
      subtitle: 'Motion & charging alerts',
      onPress: () => router.push('/anti-theft'),
      color: Colors.alert,
    },
    {
      icon: TestTube,
      title: 'Test Detection',
      subtitle: 'Try clap or whistle',
      onPress: () => router.push('/test-detection'),
      color: Colors.purple,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Clap Phone Finder</Text>
          <Text style={styles.subtitle}>Find Phone by Clap or Whistle</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            {isListening ? (
              <Activity size={16} color={Colors.active} />
            ) : (
              <Power size={16} color={Colors.textMuted} />
            )}
            <Text style={[styles.statusText, isListening && styles.statusActive]}>
              {isListening ? 'Listening' : 'Not Listening'}
            </Text>
          </View>
          {isWebMode && (
            <View style={[styles.statusBadge, styles.webBadge]}>
              <Globe size={14} color={Colors.primary} />
              <Text style={styles.webText}>Web Mode</Text>
            </View>
          )}
        </View>

        <View style={styles.indicatorContainer}>
          <ListeningIndicator isListening={isListening} isPocketModeActive={isPocketModeActive} size={140} />
          <Text style={styles.indicatorText}>
            {isListening ? 'Listening for claps...' : 'Tap start to listen'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.mainButton, isListening && styles.mainButtonActive]}
          onPress={toggleListening}
          activeOpacity={0.8}
        >
          {isListening ? (
            <Activity size={32} color={Colors.text} />
          ) : (
            <Power size={32} color={Colors.text} />
          )}
          <Text style={styles.mainButtonText}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>

        {lastDetection && (
          <View style={styles.detectionCard}>
            <Text style={styles.detectionText}>{lastDetection}</Text>
          </View>
        )}

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                <item.icon size={24} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  statusActive: {
    color: Colors.active,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  indicatorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
  },
  webBadge: {
    marginTop: 8,
    backgroundColor: `${Colors.primary}20`,
  },
  webText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  mainButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  mainButtonActive: {
    backgroundColor: Colors.alert,
  },
  mainButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  detectionCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  detectionText: {
    color: Colors.active,
    fontSize: 14,
    fontWeight: '500',
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 16,
  },
  menuTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
