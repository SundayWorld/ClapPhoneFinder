// AdMob Configuration
// These are Google test ad unit IDs - replace with your real IDs for production
// Note: For production use, switch to react-native-google-mobile-ads with EAS build

export const ADMOB_CONFIG = {
  // Test ad unit IDs from Google
  bannerAdUnitId: __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111'  // Test Banner
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',  // Replace with your production ID
    
  interstitialAdUnitId: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712'  // Test Interstitial
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',  // Replace with your production ID
    
  rewardedAdUnitId: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917'  // Test Rewarded
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',  // Replace with your production ID
    
  // App ID
  appId: __DEV__
    ? 'ca-app-pub-3940256099942544~3347511713'  // Test App ID
    : 'ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx',  // Replace with your production App ID
};

// Ad display configuration
export const AD_CONFIG = {
  // Banner ad refresh interval in seconds
  bannerRefreshInterval: 60,
  
  // Minimum time between interstitial ads in milliseconds
  interstitialCooldown: 120000, // 2 minutes
  
  // Show interstitial after this many screen views
  interstitialFrequency: 3,
};

// Screen-specific ad settings
export const SCREEN_AD_SETTINGS = {
  finderModes: {
    showBanner: true,
    bannerPosition: 'bottom' as const,
  },
  alarmSettings: {
    showBanner: true,
    bannerPosition: 'bottom' as const,
  },
  antiTheft: {
    showBanner: false,
  },
  testDetection: {
    showBanner: false,
    showInterstitialOnExit: true,
  },
};
