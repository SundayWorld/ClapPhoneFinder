import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '@/types';

const SETTINGS_KEY = '@clap_finder_settings';

export const defaultSettings: Settings = {
  clapDetectionEnabled: true,
  whistleDetectionEnabled: false,
  clapSensitivity: 'medium',
  whistleSensitivity: 'medium',
  clapCount: 2,
  backgroundNoiseFilter: true,
  flashlightEnabled: true,
  vibrationEnabled: true,
  alarmSound: 'siren',
  alarmVolume: 0.8,
  flashlightBlink: true,
  flashlightPattern: 'blink-fast',
  stopPin: '1234',
  motionDetectionEnabled: false,
  chargingRemovalEnabled: false,
  pocketModeEnabled: false,
  pocketModeForFinder: false,
};

export async function loadSettings(): Promise<Settings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}
