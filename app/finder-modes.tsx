import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Clapperboard, Music, Volume2, Pocket } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SettingCard } from '@/components/SettingCard';
import { Toggle } from '@/components/Toggle';
import { useSettings } from '@/contexts/SettingsContext';
import Slider from '@react-native-community/slider';
import { SENSITIVITY_LEVELS } from '@/constants/sounds';

export default function FinderModesScreen() {
  const { settings, updateSettings } = useSettings();

  const getSensitivityLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingCard title="Detection Settings">
          <Toggle
            label="Enable Clap Detection"
            description="Detect claps to find your phone"
            value={settings.clapDetectionEnabled}
            onChange={(value) => updateSettings({ clapDetectionEnabled: value })}
          />
          
          <Toggle
            label="Enable Whistle Detection"
            description="Detect whistle sounds"
            value={settings.whistleDetectionEnabled}
            onChange={(value) => updateSettings({ whistleDetectionEnabled: value })}
          />

          {settings.clapDetectionEnabled && (
            <>
              <View style={styles.sectionDivider} />
              
              <View style={styles.settingRow}>
                <View style={styles.iconLabel}>
                  <Clapperboard size={18} color={Colors.primary} />
                  <Text style={styles.settingLabel}>Clap Sensitivity</Text>
                </View>
                <View style={styles.optionsRow}>
                  {SENSITIVITY_LEVELS.map((level) => (
                    <TouchableOption
                      key={level}
                      label={getSensitivityLabel(level)}
                      selected={settings.clapSensitivity === level}
                      onPress={() => updateSettings({ clapSensitivity: level })}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Number of Claps</Text>
                <View style={styles.optionsRow}>
                  {[2, 3, 4].map((count) => (
                    <TouchableOption
                      key={count}
                      label={`${count} claps`}
                      selected={settings.clapCount === count}
                      onPress={() => updateSettings({ clapCount: count })}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          {settings.whistleDetectionEnabled && (
            <>
              <View style={styles.sectionDivider} />
              
              <View style={styles.settingRow}>
                <View style={styles.iconLabel}>
                  <Music size={18} color={Colors.purple} />
                  <Text style={styles.settingLabel}>Whistle Sensitivity</Text>
                </View>
                <View style={styles.optionsRow}>
                  {SENSITIVITY_LEVELS.map((level) => (
                    <TouchableOption
                      key={level}
                      label={getSensitivityLabel(level)}
                      selected={settings.whistleSensitivity === level}
                      onPress={() => updateSettings({ whistleSensitivity: level })}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={styles.sectionDivider} />
          
          <Toggle
            label="Background Noise Filter"
            description="Filter out ambient noise for better detection"
            value={settings.backgroundNoiseFilter}
            onChange={(value) => updateSettings({ backgroundNoiseFilter: value })}
          />

          <View style={styles.sectionDivider} />
          
          <Toggle
            label="Pocket Mode"
            description="Pause detection when phone is in pocket or bag"
            value={settings.pocketModeForFinder}
            onChange={(value) => updateSettings({ pocketModeForFinder: value })}
          />
          
          {settings.pocketModeForFinder && (
            <View style={styles.pocketInfoContainer}>
              <Pocket size={16} color={Colors.textMuted} />
              <Text style={styles.pocketInfoText}>
                Detection will pause when phone is face-down or in a dark, stationary environment
              </Text>
            </View>
          )}
        </SettingCard>

        <SettingCard title="Response Settings">
          <Toggle
            label="Flashlight"
            description="Blink flashlight when phone is found"
            value={settings.flashlightEnabled}
            onChange={(value) => updateSettings({ flashlightEnabled: value })}
          />
          
          <Toggle
            label="Vibration"
            description="Vibrate when phone is found"
            value={settings.vibrationEnabled}
            onChange={(value) => updateSettings({ vibrationEnabled: value })}
          />

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

        <View style={styles.batteryCard}>
          <Text style={styles.batteryTitle}>Battery Optimization</Text>
          <Text style={styles.batteryText}>
            For reliable detection, disable battery optimization for this app. 
            Go to Settings {'>'} Apps {'>'} Clap Phone Finder {'>'} Battery {'>'} Unrestricted
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TouchableOption({ 
  label, 
  selected, 
  onPress 
}: { 
  label: string; 
  selected: boolean; 
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
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
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  settingRow: {
    gap: 8,
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
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.text,
  },
  volumeContainer: {
    gap: 12,
    paddingTop: 8,
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
  batteryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.yellow,
  },
  batteryTitle: {
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  batteryText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  pocketInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  pocketInfoText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
