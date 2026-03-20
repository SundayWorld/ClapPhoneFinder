import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { Shield, Move, Zap, Pocket, AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SettingCard } from '@/components/SettingCard';
import { Toggle } from '@/components/Toggle';
import { useSettings } from '@/contexts/SettingsContext';
import { Accelerometer } from 'expo-sensors';
import { useAlarm } from '@/hooks/useAlarm';

export default function AntiTheftScreen() {
  const { settings, updateSettings } = useSettings();
  const { triggerAlarm, alarmState } = useAlarm();
  const [isArmed, setIsArmed] = useState(false);
  const [lastMotion, setLastMotion] = useState<Date | null>(null);
  const motionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (isArmed && settings.motionDetectionEnabled) {
      Accelerometer.setUpdateInterval(200);
      
      subscriptionRef.current = Accelerometer.addListener(({ x, y, z }: { x: number; y: number; z: number }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        
        if (magnitude > 1.5) {
          setLastMotion(new Date());
          
          if (motionTimeoutRef.current) {
            clearTimeout(motionTimeoutRef.current);
          }
          
          motionTimeoutRef.current = setTimeout(() => {
            if (!alarmState.isPlaying) {
              void triggerAlarm('motion');
              setIsArmed(false);
            }
          }, 500);
        }
      });
    } else {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    }

    return () => {
      subscriptionRef.current?.remove();
      if (motionTimeoutRef.current) {
        clearTimeout(motionTimeoutRef.current);
      }
    };
  }, [isArmed, settings.motionDetectionEnabled, alarmState.isPlaying, triggerAlarm]);

  const toggleArmed = () => {
    if (!isArmed) {
      const activeFeatures = [
        settings.motionDetectionEnabled && 'Motion Detection',
        settings.chargingRemovalEnabled && 'Charging Removal',
        settings.pocketModeEnabled && 'Pocket Mode',
      ].filter(Boolean);

      if (activeFeatures.length === 0) {
        Alert.alert(
          'No Features Enabled',
          'Please enable at least one anti-theft feature in the settings below.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Arm Anti-Theft',
        `The following features will be active: ${activeFeatures.join(', ')}. Do not move your device for 3 seconds after arming.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Arm',
            style: 'default',
            onPress: () => {
              setTimeout(() => setIsArmed(true), 3000);
            },
          },
        ]
      );
    } else {
      setIsArmed(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusCard, isArmed && styles.statusCardArmed]}>
          <Shield 
            size={48} 
            color={isArmed ? Colors.alert : Colors.active} 
          />
          <Text style={[styles.statusTitle, isArmed && styles.statusTitleArmed]}>
            {isArmed ? 'Anti-Theft Armed' : 'Anti-Theft Disarmed'}
          </Text>
          <Text style={styles.statusDescription}>
            {isArmed 
              ? 'Your device is protected. Any movement will trigger the alarm.'
              : 'Enable features below and arm to protect your device.'
            }
          </Text>
          
          {lastMotion && isArmed && (
            <Text style={styles.motionText}>
              Last motion detected: {lastMotion.toLocaleTimeString()}
            </Text>
          )}

          <TouchableOption onPress={toggleArmed}>
            <View style={[styles.armButton, isArmed && styles.armButtonActive]}>
              <Text style={styles.armButtonText}>
                {isArmed ? 'Disarm' : 'Arm Anti-Theft'}
              </Text>
            </View>
          </TouchableOption>
        </View>

        <SettingCard title="Security Features">
          <Toggle
            label="Motion Detection Alarm"
            description="Trigger alarm when device moves"
            value={settings.motionDetectionEnabled}
            onChange={(value) => {
              updateSettings({ motionDetectionEnabled: value });
              if (isArmed && !value) setIsArmed(false);
            }}
          />

          <Toggle
            label="Charging Removal Alarm"
            description="Trigger alarm when charger is unplugged"
            value={settings.chargingRemovalEnabled}
            onChange={(value) => updateSettings({ chargingRemovalEnabled: value })}
          />

          <Toggle
            label="Anti-Theft Pocket Mode"
            description="Trigger alarm if phone is removed from pocket"
            value={settings.pocketModeEnabled}
            onChange={(value) => updateSettings({ pocketModeEnabled: value })}
          />

          <View style={styles.sectionDivider} />

          <Toggle
            label="Finder Pocket Mode"
            description="Pause clap/whistle detection when phone is in pocket or bag"
            value={settings.pocketModeForFinder}
            onChange={(value) => updateSettings({ pocketModeForFinder: value })}
          />
        </SettingCard>

        <SettingCard title="Alarm Response">
          <Toggle
            label="Flashlight Alert"
            description="Blink flashlight when alarm triggers"
            value={settings.flashlightEnabled}
            onChange={(value) => updateSettings({ flashlightEnabled: value })}
          />

          <Toggle
            label="Vibration Alert"
            description="Vibrate when alarm triggers"
            value={settings.vibrationEnabled}
            onChange={(value) => updateSettings({ vibrationEnabled: value })}
          />
        </SettingCard>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <AlertTriangle size={20} color={Colors.yellow} />
            <Text style={styles.tipsTitle}>Usage Tips</Text>
          </View>
          <View style={styles.tipItem}>
            <Move size={16} color={Colors.textMuted} />
            <Text style={styles.tipText}>
              Place device on a stable surface before arming motion detection
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Zap size={16} color={Colors.textMuted} />
            <Text style={styles.tipText}>
              Keep device charging for charging removal detection to work
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Pocket size={16} color={Colors.textMuted} />
            <Text style={styles.tipText}>
              Pocket mode uses proximity sensor to detect when removed
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface TouchableOptionProps {
  children: React.ReactNode;
  onPress: () => void;
}

function TouchableOption({ children, onPress }: TouchableOptionProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.active,
  },
  statusCardArmed: {
    borderColor: Colors.alert,
    backgroundColor: `${Colors.alert}10`,
  },
  statusTitle: {
    color: Colors.active,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  statusTitleArmed: {
    color: Colors.alert,
  },
  statusDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  motionText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  armButton: {
    backgroundColor: Colors.active,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  armButtonActive: {
    backgroundColor: Colors.alert,
  },
  armButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: '600',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
});
