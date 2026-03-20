export const ALARM_SOUNDS = [
  { id: 'siren', name: 'Police Siren', icon: 'Siren' },
  { id: 'bell', name: 'Alarm Bell', icon: 'Bell' },
  { id: 'beep', name: 'Beep Alert', icon: 'Volume2' },
  { id: 'ringtone', name: 'Ringtone', icon: 'Smartphone' },
] as const;

export type AlarmSound = typeof ALARM_SOUNDS[number]['id'];

export const FLASHLIGHT_PATTERNS = [
  { id: 'steady', name: 'Steady', description: 'Constant light' },
  { id: 'blink-slow', name: 'Slow Blink', description: '1 second intervals' },
  { id: 'blink-fast', name: 'Fast Blink', description: '200ms intervals' },
  { id: 'sos', name: 'SOS Pattern', description: 'SOS in Morse code' },
] as const;

export type FlashlightPattern = typeof FLASHLIGHT_PATTERNS[number]['id'];

export const SENSITIVITY_LEVELS = ['low', 'medium', 'high'] as const;
export type SensitivityLevel = typeof SENSITIVITY_LEVELS[number];
