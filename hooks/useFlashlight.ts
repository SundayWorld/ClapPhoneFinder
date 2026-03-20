import { useState, useCallback } from 'react';
import * as Brightness from 'expo-brightness';

export function useFlashlight() {
  const [isOn, setIsOn] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    const { status } = await Brightness.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) return;
      }
      
      const newState = !isOn;
      await Brightness.setBrightnessAsync(newState ? 1 : 0.5);
      setIsOn(newState);
    } catch (error) {
      console.error('Flashlight error:', error);
    }
  }, [isOn, hasPermission, requestPermission]);

  const turnOff = useCallback(async () => {
    try {
      await Brightness.setBrightnessAsync(0.5);
      setIsOn(false);
    } catch (error) {
      console.error('Flashlight error:', error);
    }
  }, []);

  return {
    isOn,
    toggle,
    turnOff,
    hasPermission,
    requestPermission,
  };
}
