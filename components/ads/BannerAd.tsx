import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { ADMOB_CONFIG } from '@/config/admobConfig';

// Note: For production use with real AdMob ads,
// install react-native-google-mobile-ads and use:
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface BannerAdComponentProps {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle' | 'fullBanner' | 'leaderboard';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Placeholder component for Expo Go compatibility
// Replace with real AdMob BannerAd when using EAS build
export function BannerAdComponent({ 
  size = 'banner',
  onLoad,
}: BannerAdComponentProps) {
  const [_isLoaded, setIsLoaded] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate ad loading
  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      setIsLoaded(true);
      onLoad?.();
    }, 500);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [onLoad]);

  // Get dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'largeBanner':
        return { width: 320, height: 100 };
      case 'mediumRectangle':
        return { width: 300, height: 250 };
      case 'fullBanner':
        return { width: 468, height: 60 };
      case 'leaderboard':
        return { width: 728, height: 90 };
      case 'banner':
      default:
        return { width: 320, height: 50 };
    }
  };

  const dimensions = getDimensions();

  // Development placeholder - shows in dev mode
  if (__DEV__) {
    return (
      <View style={[styles.container, { height: dimensions.height }]}>
        <View style={[styles.placeholder, { width: dimensions.width, height: dimensions.height }]}>
          <Text style={styles.placeholderText}>AdMob Banner</Text>
          <Text style={styles.placeholderSubtext}>{ADMOB_CONFIG.bannerAdUnitId}</Text>
        </View>
      </View>
    );
  }

  // Production placeholder - invisible in production until real ads are integrated
  return (
    <View style={[styles.container, { height: dimensions.height }]}>
      <View style={[styles.placeholder, { width: dimensions.width, height: dimensions.height }]}>
        <Text style={styles.placeholderText}>Advertisement</Text>
      </View>
    </View>
  );
}

// Real AdMob implementation (commented out for reference)
// Uncomment and use when switching to EAS build with react-native-google-mobile-ads
/*
export function RealBannerAd({ size = 'banner', onLoad, onError }: BannerAdComponentProps) {
  const adSize = size === 'largeBanner' ? BannerAdSize.LARGE_BANNER
    : size === 'mediumRectangle' ? BannerAdSize.MEDIUM_RECTANGLE
    : size === 'fullBanner' ? BannerAdSize.FULL_BANNER
    : size === 'leaderboard' ? BannerAdSize.LEADERBOARD
    : BannerAdSize.BANNER;

  return (
    <BannerAd
      unitId={ADMOB_CONFIG.bannerAdUnitId}
      size={adSize}
      onAdLoaded={onLoad}
      onAdFailedToLoad={(error) => onError?.(error)}
    />
  );
}
*/

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  placeholder: {
    backgroundColor: Colors.cardLight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderSubtext: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
});
