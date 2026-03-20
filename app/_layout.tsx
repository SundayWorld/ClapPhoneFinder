import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { DetectionProvider } from "@/contexts/DetectionContext";
import { Colors } from "@/constants/colors";

void SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.text,
        headerTitleStyle: { color: Colors.text },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Clap Phone Finder" }} />
      <Stack.Screen name="finder-modes" options={{ title: "Finder Modes" }} />
      <Stack.Screen name="alarm-settings" options={{ title: "Alarm Settings" }} />
      <Stack.Screen name="anti-theft" options={{ title: "Anti-Theft Mode" }} />
      <Stack.Screen name="test-detection" options={{ title: "Test Detection" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={new QueryClient()}>
      <GestureHandlerRootView>
        <SettingsProvider>
          <DetectionProvider>
            <RootLayoutNav />
          </DetectionProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
