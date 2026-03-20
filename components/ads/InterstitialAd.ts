import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ADMOB_CONFIG, AD_CONFIG } from '@/config/admobConfig';

// Note: For production use with real AdMob ads,
// install react-native-google-mobile-ads and use:
// import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

interface UseInterstitialAdReturn {
  showAd: () => Promise<void>;
  isLoading: boolean;
  isClosed: boolean;
  lastShownTime: number | null;
}

// Placeholder hook for Expo Go compatibility
// Replace with real AdMob implementation when using EAS build
export function useInterstitialAd(): UseInterstitialAdReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(true);
  const [lastShownTime, setLastShownTime] = useState<number | null>(null);
  const cooldownRef = useRef(false);

  const showAd = useCallback(async (): Promise<void> => {
    // Check cooldown
    if (cooldownRef.current) {
      console.log('Interstitial ad on cooldown');
      return;
    }

    // Check if enough time has passed since last ad
    if (lastShownTime && Date.now() - lastShownTime < AD_CONFIG.interstitialCooldown) {
      console.log('Interstitial cooldown active');
      return;
    }

    setIsLoading(true);
    setIsClosed(false);

    try {
      // Simulate ad loading and showing
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (__DEV__) {
        // In development, show an alert instead
        Alert.alert(
          'Interstitial Ad',
          `This would show an interstitial ad:\n${ADMOB_CONFIG.interstitialAdUnitId}`,
          [{ text: 'Close', onPress: () => setIsClosed(true) }]
        );
      }

      setLastShownTime(Date.now());
      
      // Set cooldown
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, AD_CONFIG.interstitialCooldown);

    } catch (error) {
      console.error('Error showing interstitial ad:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastShownTime]);

  return {
    showAd,
    isLoading,
    isClosed,
    lastShownTime,
  };
}

// Real AdMob implementation (commented out for reference)
// Uncomment and use when switching to EAS build with react-native-google-mobile-ads
/*
const interstitialAd = InterstitialAd.createForAdRequest(ADMOB_CONFIG.interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export function useRealInterstitialAd(): UseInterstitialAdReturn {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(true);
  const [lastShownTime, setLastShownTime] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      setIsClosed(true);
      setLoaded(false);
      interstitialAd.load();
    });

    const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Interstitial ad error:', error);
      setIsLoading(false);
    });

    // Start loading the ad
    interstitialAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const showAd = useCallback(async (): Promise<void> => {
    if (!loaded) {
      console.log('Interstitial ad not loaded yet');
      return;
    }

    if (lastShownTime && Date.now() - lastShownTime < AD_CONFIG.interstitialCooldown) {
      console.log('Interstitial cooldown active');
      return;
    }

    setIsLoading(true);
    try {
      await interstitialAd.show();
      setLastShownTime(Date.now());
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loaded, lastShownTime]);

  return {
    showAd,
    isLoading,
    isClosed,
    lastShownTime,
  };
}
*/

// Hook to show interstitial ad on screen exit
export function useInterstitialOnExit(_screenName: string): () => void {
  const { showAd, lastShownTime } = useInterstitialAd();
  const viewCountRef = useRef(0);

  return useCallback(() => {
    viewCountRef.current += 1;

    // Only show ad after certain number of views and cooldown
    if (viewCountRef.current >= AD_CONFIG.interstitialFrequency) {
      if (!lastShownTime || Date.now() - lastShownTime > AD_CONFIG.interstitialCooldown) {
        void showAd();
        viewCountRef.current = 0;
      }
    }
  }, [showAd, lastShownTime]);
}
