import { Redirect } from 'expo-router';
import React from 'react';

import { useAuthStore } from '../src/state/authStore';

/**
 * Entry route. The root layout resolves the session and then redirects; this
 * file only guarantees there is never a blank first frame.
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);

  if (status === 'locked') return <Redirect href="/(auth)/lock" />;
  if (status === 'authenticated') return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/sign-in" />;
}
