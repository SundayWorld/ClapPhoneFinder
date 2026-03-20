import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { DetectionState } from '@/types';
import { useSettings } from './SettingsContext';
import { useAlarm } from '@/hooks/useAlarm';
import ClapDetectionService from '@/services/clapDetectionService';
import WhistleDetectionService from '@/services/whistleDetectionService';
import PocketDetectionService from '@/services/pocketDetectionService';

interface DetectionContextType {
  isListening: boolean;
  lastDetection: string | null;
  clapCount: number;
  permissionError: string | null;
  isWebMode: boolean;
  isPocketModeActive: boolean;
  pocketState: {
    isInPocket: boolean;
    proximityTriggered: boolean;
    lightTriggered: boolean;
    motionTriggered: boolean;
  };
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  testDetection: (type: 'clap' | 'whistle') => void;
  clearPermissionError: () => void;
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

export function DetectionProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { triggerAlarm } = useAlarm();
  
  const [isListening, setIsListening] = useState(false);
  const [lastDetection, setLastDetection] = useState<string | null>(null);
  const [clapCount, setClapCount] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isWebMode, setIsWebMode] = useState(false);
  const [isPocketModeActive, setIsPocketModeActive] = useState(false);
  const [pocketState, setPocketState] = useState({
    isInPocket: false,
    proximityTriggered: false,
    lightTriggered: false,
    motionTriggered: false,
  });
  
  const detectionStateRef = useRef<DetectionState>({
    isListening: false,
    lastClapTime: 0,
    clapCount: 0,
    whistleDetected: false,
  });

  // Track if detection is paused due to pocket mode
  const detectionPausedRef = useRef(false);

  // Use ref to access current settings in callbacks
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Initialize detection services
  const clapServiceRef = useRef<ClapDetectionService | null>(null);
  const whistleServiceRef = useRef<WhistleDetectionService | null>(null);
  const pocketServiceRef = useRef<PocketDetectionService | null>(null);

  // Initialize services on mount
  useEffect(() => {
    clapServiceRef.current = new ClapDetectionService({
      enabled: true,
      sensitivity: 'medium',
      clapCount: 2,
      backgroundNoiseFilter: false,
    });

    whistleServiceRef.current = new WhistleDetectionService({
      enabled: true,
      sensitivity: 'medium',
      backgroundNoiseFilter: false,
    });

    pocketServiceRef.current = new PocketDetectionService({
      enabled: false,
      proximityThreshold: 0.5,
      lightThreshold: 20,
      motionThreshold: 0.15,
    });

    // Set up callbacks
    clapServiceRef.current.setCallbacks({
      onClapDetected: (count) => {
        setClapCount(count);
        detectionStateRef.current.clapCount = count;
        console.log(`Clap ${count} detected`);
      },
      onPatternDetected: () => {
        const now = new Date().toLocaleTimeString();
        const targetClapCount = settingsRef.current?.clapCount ?? 2;
        setLastDetection(`Detected ${targetClapCount} claps! (${now})`);
        void triggerAlarm('clap');
        setClapCount(0);
        detectionStateRef.current.clapCount = 0;
      },
    });

    whistleServiceRef.current.setCallbacks({
      onWhistleDetected: () => {
        const now = new Date().toLocaleTimeString();
        setLastDetection(`Whistle detected! (${now})`);
        void triggerAlarm('whistle');
      },
    });

    // Set up pocket detection callbacks
    pocketServiceRef.current.setCallbacks({
      onPocketStateChange: (isInPocket) => {
        console.log('Pocket state changed:', isInPocket);
        
        if (isInPocket && isListening && settingsRef.current.pocketModeForFinder) {
          // Pause detection when phone enters pocket
          detectionPausedRef.current = true;
          setIsPocketModeActive(true);
          
          // Stop clap and whistle detection temporarily
          if (clapServiceRef.current) {
            clapServiceRef.current.stopListening();
          }
          if (whistleServiceRef.current) {
            whistleServiceRef.current.stopListening();
          }
          console.log('Detection paused - phone in pocket');
        } else if (!isInPocket && detectionPausedRef.current) {
          // Resume detection when phone leaves pocket
          detectionPausedRef.current = false;
          setIsPocketModeActive(false);
          
          // Restart clap and whistle detection
          void resumeDetection();
          console.log('Detection resumed - phone removed from pocket');
        }
      },
      onSensorData: (data) => {
        setPocketState({
          isInPocket: data.isInPocket,
          proximityTriggered: data.proximity > 0.5,
          lightTriggered: data.lightLevel < 20,
          motionTriggered: data.motionMagnitude < 0.15,
        });
      },
    });

    return () => {
      clapServiceRef.current?.stopListening();
      whistleServiceRef.current?.stopListening();
      pocketServiceRef.current?.stopMonitoring();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAlarm]);

  // Resume detection helper
  const resumeDetection = useCallback(async () => {
    if (!settingsRef.current) return;
    
    let clapStarted = false;
    let whistleStarted = false;

    if (settingsRef.current.clapDetectionEnabled && clapServiceRef.current) {
      clapStarted = await clapServiceRef.current.startListening();
    }

    if (settingsRef.current.whistleDetectionEnabled && whistleServiceRef.current) {
      whistleStarted = await whistleServiceRef.current.startListening();
    }

    console.log('Detection resumed - Clap:', clapStarted, 'Whistle:', whistleStarted);
  }, []);

  // Update service configs when settings change
  useEffect(() => {
    if (clapServiceRef.current) {
      clapServiceRef.current.updateConfig({
        enabled: settings.clapDetectionEnabled,
        sensitivity: settings.clapSensitivity,
        clapCount: settings.clapCount,
        backgroundNoiseFilter: settings.backgroundNoiseFilter,
      });
    }
    if (whistleServiceRef.current) {
      whistleServiceRef.current.updateConfig({
        enabled: settings.whistleDetectionEnabled,
        sensitivity: settings.whistleSensitivity,
        backgroundNoiseFilter: settings.backgroundNoiseFilter,
      });
    }
    if (pocketServiceRef.current) {
      pocketServiceRef.current.updateConfig({
        enabled: settings.pocketModeForFinder,
        proximityThreshold: 0.5,
        lightThreshold: 20,
        motionThreshold: 0.15,
      });
    }
  }, [settings]);

  const clearPermissionError = useCallback(() => {
    setPermissionError(null);
  }, []);

  const startListening = useCallback(async (): Promise<boolean> => {
    setPermissionError(null);
    
    // Check if at least one detection mode is enabled
    if (!settings.clapDetectionEnabled && !settings.whistleDetectionEnabled) {
      const errorMsg = 'Please enable at least one detection mode (Clap or Whistle) in Finder Modes settings.';
      setPermissionError(errorMsg);
      return false;
    }

    try {
      // Start pocket detection first if enabled
      if (settings.pocketModeForFinder && pocketServiceRef.current) {
        const pocketStarted = await pocketServiceRef.current.startMonitoring();
        if (pocketStarted) {
          // Check if already in pocket
          const isInPocket = await pocketServiceRef.current.checkPocketStateNow();
          if (isInPocket) {
            setIsPocketModeActive(true);
            detectionPausedRef.current = true;
            console.log('Phone is in pocket - detection will start when removed');
          }
        }
      }

      // If phone is in pocket and pocket mode is enabled, don't start audio detection yet
      if (detectionPausedRef.current) {
        setIsListening(true);
        setIsWebMode(Platform.OS === 'web');
        console.log('Listening started in pocket mode - audio detection paused');
        return true;
      }

      let clapStarted = false;
      let whistleStarted = false;

      // Start clap detection if enabled
      if (settings.clapDetectionEnabled && clapServiceRef.current) {
        clapStarted = await clapServiceRef.current.startListening();
        if (!clapStarted) {
          setPermissionError('Failed to start clap detection. Please check microphone permissions.');
          return false;
        }
      }

      // Start whistle detection if enabled
      if (settings.whistleDetectionEnabled && whistleServiceRef.current) {
        whistleStarted = await whistleServiceRef.current.startListening();
        if (!whistleStarted) {
          // Stop clap detection if whistle failed
          if (clapServiceRef.current) {
            clapServiceRef.current.stopListening();
          }
          setPermissionError('Failed to start whistle detection. Please check microphone permissions.');
          return false;
        }
      }

      const anyStarted = clapStarted || whistleStarted;
      
      if (anyStarted) {
        detectionStateRef.current.isListening = true;
        setIsListening(true);
        setIsWebMode(Platform.OS === 'web');
        console.log('Detection started - Clap:', clapStarted, 'Whistle:', whistleStarted);
      }

      return anyStarted;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start listening. Please try again.';
      setPermissionError(errorMsg);
      console.error('Error starting listening:', error);
      return false;
    }
  }, [settings.clapDetectionEnabled, settings.whistleDetectionEnabled, settings.pocketModeForFinder]);

  const stopListening = useCallback(() => {
    console.log('Stopping all detection...');
    
    if (clapServiceRef.current) {
      clapServiceRef.current.stopListening();
    }
    
    if (whistleServiceRef.current) {
      whistleServiceRef.current.stopListening();
    }

    if (pocketServiceRef.current) {
      pocketServiceRef.current.stopMonitoring();
    }
    
    detectionStateRef.current = {
      isListening: false,
      lastClapTime: 0,
      clapCount: 0,
      whistleDetected: false,
    };
    
    detectionPausedRef.current = false;
    setIsListening(false);
    setIsWebMode(false);
    setIsPocketModeActive(false);
    setClapCount(0);
  }, []);

  const testDetection = useCallback((type: 'clap' | 'whistle') => {
    const now = new Date().toLocaleTimeString();
    setLastDetection(`Test ${type} detected at ${now}`);
    void triggerAlarm(type);
  }, [triggerAlarm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const value = useMemo(() => ({
    isListening,
    lastDetection,
    clapCount,
    permissionError,
    isWebMode,
    isPocketModeActive,
    pocketState,
    startListening,
    stopListening,
    testDetection,
    clearPermissionError,
  }), [isListening, lastDetection, clapCount, permissionError, isWebMode, isPocketModeActive, pocketState, startListening, stopListening, testDetection, clearPermissionError]);

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetection() {
  const context = useContext(DetectionContext);
  if (context === undefined) {
    throw new Error('useDetection must be used within a DetectionProvider');
  }
  return context;
}
