import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { Volume2, Lightbulb, Lock, Siren, Bell, Smartphone } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SettingCard } from '@/components/SettingCard';
import { Toggle } from '@/components/Toggle';
import { useSettings } from '@/contexts/SettingsContext';
import { ALARM_SOUNDS, FLASHLIGHT_PATTERNS } from '@/constants/sounds';
import Slider from '@react-native-community/slider';

const alarmIcons: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Siren,
  Bell,
  Volume2,
  Smartphone,
};

export default function AlarmSettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const [pin, setPin] = useState(settings.stopPin);
  const [showPin, setShowPin] = useState(false);

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(numericValue);
    updateSettings({ stopPin: numericValue });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingCard title="Alarm Sound">
          <View style={styles.soundOptions}>
            {ALARM_SOUNDS.map((sound) => {
              const IconComponent = alarmIcons[sound.icon] || Volume2;
              const isSelected = settings.alarmSound === sound.id;
              
              return (
                <TouchableOption
                  key={sound.id}
                  onPress={() => updateSettings({ alarmSound: sound.id })}
                >
                  <View style={[styles.soundOption, isSelected && styles.soundOptionSelected]}>
                    <IconComponent 
                      size={24} 
                      color={isSelected ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={[styles.soundText, isSelected && styles.soundTextSelected]}>
                      {sound.name}
                    </Text>
                    {isSelected && <View style={styles.selectedIndicator} />}
                  </View>
                </TouchableOption>
              );
            })}
          </View>

          <View style={styles.volumeContainer}>
            <View style={styles.iconLabel}>
              <Volume2 size={18} color={Colors.yellow} />
              <Text style={styles.settingLabel}>Alarm Volume</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={settings.alarmVolume}
              onValueChange={(value) => updateSettings({ alarmVolume: value })}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.text}
            />
            <Text style={styles.volumeValue}>{Math.round(settings.alarmVolume * 100)}%</Text>
          </View>
        </SettingCard>

        <SettingCard title="Flashlight Settings">
          <Toggle
            label="Flashlight Blink"
            description="Blink flashlight when alarm triggers"
            value={settings.flashlightBlink}
            onChange={(value) => updateSettings({ flashlightBlink: value })}
          />

          {settings.flashlightBlink && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.subSectionTitle}>Blink Pattern</Text>
              <View style={styles.patternOptions}>
                {FLASHLIGHT_PATTERNS.map((pattern) => {
                  const isSelected = settings.flashlightPattern === pattern.id;
                  return (
                    <TouchableOption
                      key={pattern.id}
                      onPress={() => updateSettings({ flashlightPattern: pattern.id })}
                    >
                      <View style={[styles.patternOption, isSelected && styles.patternOptionSelected]}>
                        <Lightbulb 
                          size={20} 
                          color={isSelected ? Colors.yellow : Colors.textMuted} 
                        />
                        <Text style={[styles.patternName, isSelected && styles.patternTextSelected]}>
                          {pattern.name}
                        </Text>
                        <Text style={styles.patternDescription}>{pattern.description}</Text>
                      </View>
                    </TouchableOption>
                  );
                })}
              </View>
            </>
          )}
        </SettingCard>

        <SettingCard title="Vibration Settings">
          <Toggle
            label="Enable Vibration"
            description="Vibrate when alarm triggers"
            value={settings.vibrationEnabled}
            onChange={(value) => updateSettings({ vibrationEnabled: value })}
          />
        </SettingCard>

        <SettingCard title="Security Settings">
          <Toggle
            label="Require PIN to Stop"
            description="Require PIN to stop the alarm"
            value={showPin}
            onChange={setShowPin}
          />

          {showPin && (
            <>
              <View style={styles.sectionDivider} />
              <View style={styles.pinContainer}>
                <View style={styles.iconLabel}>
                  <Lock size={18} color={Colors.orange} />
                  <Text style={styles.settingLabel}>Stop PIN Code</Text>
                </View>
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={handlePinChange}
                  placeholder="Enter 4-6 digit PIN"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                />
              </View>
            </>
          )}
        </SettingCard>
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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
  soundOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  soundOption: {
    width: 80,
    height: 80,
    backgroundColor: Colors.cardLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 4,
  },
  soundOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
  },
  soundText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  soundTextSelected: {
    color: Colors.text,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  subSectionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  volumeContainer: {
    marginTop: 16,
    gap: 12,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  volumeValue: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  patternOptions: {
    gap: 8,
  },
  patternOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardLight,
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  patternOptionSelected: {
    borderColor: Colors.yellow,
    backgroundColor: `${Colors.yellow}15`,
  },
  patternName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  patternTextSelected: {
    color: Colors.yellow,
  },
  patternDescription: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  pinContainer: {
    gap: 12,
  },
  pinInput: {
    backgroundColor: Colors.cardLight,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    letterSpacing: 8,
  },
});
