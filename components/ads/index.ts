// AdMob Components Export
// 
// For production use with real AdMob ads:
// 1. Install react-native-google-mobile-ads: 
//    npx expo install react-native-google-mobile-ads
//
// 2. Switch to EAS Build (Expo Go doesn't support AdMob):
//    npm install -g eas-cli
//    eas build:configure
//    eas build --platform android
//
// 3. Uncomment the real implementations in the component files
// 4. Update app.json with your AdMob App ID

export { BannerAdComponent } from './BannerAd';
export { useInterstitialAd, useInterstitialOnExit } from './InterstitialAd';
export { ADMOB_CONFIG, AD_CONFIG, SCREEN_AD_SETTINGS } from '@/config/admobConfig';
