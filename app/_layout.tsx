
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { initializeFoodDatabase } from "@/utils/foodDatabase";
import { supabase } from "@/app/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const segments = useSegments();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (loaded) {
      initializeApp();
    }
  }, [loaded]);

  const initializeApp = async () => {
    try {
      console.log('[App] Initializing app...');
      
      // Initialize food database
      await initializeFoodDatabase();
      console.log('[App] Food database initialized');

      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('[App] Current session:', currentSession?.user?.id || 'none');
      setSession(currentSession);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('[App] Auth state changed:', _event, session?.user?.id || 'none');
        setSession(session);
      });

      setIsReady(true);
      setInitializing(false);
      SplashScreen.hideAsync();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('[App] Failed to initialize app:', error);
      setIsReady(true);
      setInitializing(false);
      SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    if (!isReady || initializing) return;

    const handleNavigation = async () => {
      const inAuthGroup = segments[0] === 'auth';
      const inOnboardingGroup = segments[0] === 'onboarding';
      const inTabsGroup = segments[0] === '(tabs)';

      console.log('[Navigation] Current state:', { 
        hasSession: !!session, 
        segments, 
        inAuthGroup, 
        inOnboardingGroup, 
        inTabsGroup 
      });

      // Not logged in - redirect to auth
      if (!session) {
        if (!inAuthGroup) {
          console.log('[Navigation] No session, redirecting to welcome');
          router.replace('/auth/welcome');
        }
        return;
      }

      // Logged in - check onboarding status
      if (session && (inAuthGroup || segments.length === 0)) {
        try {
          console.log('[Navigation] Checking onboarding status for user:', session.user.id);
          
          const { data: userData, error } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('[Navigation] Error checking onboarding:', error);
            // On error, default to onboarding
            router.replace('/onboarding/complete');
            return;
          }

          if (!userData) {
            console.log('[Navigation] User not in database, redirecting to onboarding');
            router.replace('/onboarding/complete');
            return;
          }

          if (userData.onboarding_completed) {
            console.log('[Navigation] Onboarding complete, redirecting to home');
            router.replace('/(tabs)/(home)/');
          } else {
            console.log('[Navigation] Onboarding not complete, redirecting to onboarding');
            router.replace('/onboarding/complete');
          }
        } catch (error) {
          console.error('[Navigation] Error in handleNavigation:', error);
          router.replace('/onboarding/complete');
        }
      }
    };

    handleNavigation();
  }, [session, segments, isReady, initializing]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded || !isReady) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(15, 76, 129)",
      background: "rgb(255, 255, 255)",
      card: "rgb(248, 250, 252)",
      text: "rgb(30, 41, 59)",
      border: "rgb(226, 232, 240)",
      notification: "rgb(239, 68, 68)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(15, 76, 129)",
      background: "rgb(10, 25, 41)",
      card: "rgb(30, 41, 59)",
      text: "rgb(241, 245, 249)",
      border: "rgb(51, 65, 85)",
      notification: "rgb(239, 68, 68)",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <WidgetProvider>
          <GestureHandlerRootView>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              
              <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
              <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              
              <Stack.Screen
                name="onboarding/complete"
                options={{
                  headerShown: false,
                  presentation: "card",
                }}
              />
              
              <Stack.Screen
                name="add-food-simple"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
              
              <Stack.Screen
                name="add-food"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
              
              <Stack.Screen
                name="food-search"
                options={{
                  headerShown: false,
                  presentation: "card",
                }}
              />
              
              <Stack.Screen
                name="food-details"
                options={{
                  headerShown: false,
                  presentation: "card",
                }}
              />
              
              <Stack.Screen
                name="barcode-scan"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                }}
              />
              
              <Stack.Screen
                name="quick-add"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
              
              <Stack.Screen
                name="publish"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
            </Stack>
            <SystemBars style={"auto"} />
          </GestureHandlerRootView>
        </WidgetProvider>
      </ThemeProvider>
    </>
  );
}
