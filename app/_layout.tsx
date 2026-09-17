import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, spacing, typography } from '../src/theme';
import { initI18n } from '../src/i18n';
import { useAuthStore } from '../src/state/authStore';
import { useUiStore } from '../src/state/uiStore';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { useSessionExpiryRedirect } from '../src/hooks/useSessionExpiryRedirect';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden on a fast reload — nothing to do.
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateUi = useUiStore((s) => s.hydrate);
  const authStatus = useAuthStore((s) => s.status);
  const language = useUiStore((s) => s.language);

  // Any 401 from anywhere in the app routes to the login screen.
  useSessionExpiryRedirect(authStatus === 'authenticated');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Preferences first: language must be resolved before first paint so
      //    the UI never flickers between English and the user's language.
      const [storedLang, storedCurrency] = await Promise.all([
        AsyncStorage.getItem('brix_language').catch(() => null),
        AsyncStorage.getItem('brix_currency').catch(() => null),
      ]);
      if (storedCurrency) await useUiStore.getState().setCurrency(storedCurrency);
      await initI18n(storedLang);
      await hydrateUi();

      // 2. Session, from secure storage.
      await hydrateAuth();

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateAuth, hydrateUi]);

  // Route to the right place once the session state is known.
  useEffect(() => {
    if (!ready) return;
    if (authStatus === 'loading') return;

    if (authStatus === 'locked') {
      router.replace('/(auth)/lock');
      return;
    }
    if (authStatus === 'unauthenticated') {
      router.replace('/(auth)/sign-in');
      return;
    }
    router.replace('/(tabs)');
  }, [ready, authStatus]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.bootText}>BRIX Digital Payment</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.base },
            // Native-feeling push/pop transitions.
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="send" options={{ presentation: 'card' }} />
          <Stack.Screen name="receive" options={{ presentation: 'card' }} />
          <Stack.Screen name="pay" options={{ presentation: 'card' }} />
          <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
          <Stack.Screen name="card-to-card" options={{ presentation: 'card' }} />
          <Stack.Screen name="funding" options={{ presentation: 'card' }} />
          <Stack.Screen name="merchant" options={{ presentation: 'card' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
          <Stack.Screen name="transaction/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Kept so expo-router can resolve the root navigation state during deep links. */
export function useRootState() {
  return useRootNavigationState();
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.base,
    gap: spacing.md,
  },
  bootText: { ...typography.caption, color: colors.textMuted },
});
