import React from 'react';
import { Stack } from 'expo-router';

import { colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.base },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="lock" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
