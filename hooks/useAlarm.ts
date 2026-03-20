import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Brightness from 'expo-brightness';
import { Vibration } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { AlarmState } from '@/types';

export function useAlarm() {
  const { settings } = useSettings();
  const [alarmState, setAlarmState] = useState<AlarmState>({
    isPlaying: false,
    triggerReason: null,
    startTime: 0,
  });
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const flashlightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalBrightnessRef = useRef<number>(0.5);

  const stopAlarm = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    
    if (flashlightIntervalRef.current) {
      clearInterval(flashlightIntervalRef.current);
      flashlightIntervalRef.current = null;
    }
    
    try {
      await Brightness.setBrightnessAsync(originalBrightnessRef.current);
    } catch (e) {
      console.log('Brightness error:', e);
    }
    
    Vibration.cancel();
    
    setAlarmState({
      isPlaying: false,
      triggerReason: null,
      startTime: 0,
    });
  }, []);

  const playAlarmSound = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
        { volume: settings.alarmVolume, isLooping: true }
      );
      
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  }, [settings.alarmVolume]);

  const startFlashlightPattern = useCallback(async () => {
    if (!settings.flashlightEnabled) return;
    
    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== 'granted') return;

      const currentBrightness = await Brightness.getBrightnessAsync();
      originalBrightnessRef.current = currentBrightness;

      const patterns: Record<string, { on: number; off: number }> = {
        'steady': { on: 1000, off: 0 },
        'blink-slow': { on: 1000, off: 1000 },
        'blink-fast': { on: 200, off: 200 },
        'sos': { on: 200, off: 200 },
      };
      
      const pattern = patterns[settings.flashlightPattern] || patterns['blink-fast'];
      let isHigh = true;
      
      await Brightness.setBrightnessAsync(1);
      
      if (pattern.off > 0) {
        flashlightIntervalRef.current = setInterval(async () => {
          try {
            isHigh = !isHigh;
            await Brightness.setBrightnessAsync(isHigh ? 1 : 0.1);
          } catch (e) {
            console.log('Brightness toggle error:', e);
          }
        }, pattern.on);
      }
    } catch (error) {
      console.error('Flashlight error:', error);
    }
  }, [settings.flashlightEnabled, settings.flashlightPattern]);

  const triggerAlarm = useCallback(async (reason: 'clap' | 'whistle' | 'motion' | 'charging') => {
    if (alarmState.isPlaying) return;
    
    setAlarmState({
      isPlaying: true,
      triggerReason: reason,
      startTime: Date.now(),
    });
    
    void playAlarmSound();
    void startFlashlightPattern();
    
    if (settings.vibrationEnabled) {
      Vibration.vibrate([0, 500, 500, 500, 500], true);
    }
    
    setTimeout(() => {
      void stopAlarm();
    }, 30000);
  }, [alarmState.isPlaying, playAlarmSound, startFlashlightPattern, settings.vibrationEnabled, stopAlarm]);

  return {
    alarmState,
    triggerAlarm,
    stopAlarm,
  };
}
