import { SensitivityLevel, AlarmSound, FlashlightPattern } from '@/constants/sounds';

export interface Settings {
  clapDetectionEnabled: boolean;
  whistleDetectionEnabled: boolean;
  clapSensitivity: SensitivityLevel;
  whistleSensitivity: SensitivityLevel;
  clapCount: number;
  backgroundNoiseFilter: boolean;
  flashlightEnabled: boolean;
  vibrationEnabled: boolean;
  alarmSound: AlarmSound;
  alarmVolume: number;
  flashlightBlink: boolean;
  flashlightPattern: FlashlightPattern;
  stopPin: string;
  motionDetectionEnabled: boolean;
  chargingRemovalEnabled: boolean;
  pocketModeEnabled: boolean;
  pocketModeForFinder: boolean;
}

export interface DetectionState {
  isListening: boolean;
  lastClapTime: number;
  clapCount: number;
  whistleDetected: boolean;
}

export interface DetectionContextState {
  isListening: boolean;
  lastDetection: string | null;
  clapCount: number;
  permissionError: string | null;
  isWebMode: boolean;
}

export interface AlarmState {
  isPlaying: boolean;
  triggerReason: 'clap' | 'whistle' | 'motion' | 'charging' | null;
  startTime: number;
}

export type DetectionMode = 'clap' | 'whistle' | 'both';
