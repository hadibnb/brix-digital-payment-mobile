import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Global connectivity banner. Rendered once in the root layout so that every
 * screen inherits the same "no internet" signal instead of each screen
 * inventing its own. It stays quiet until we are *confident* the device is
 * offline (see useNetworkStatus), so it never flashes on a cold start.
 */
export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  if (!isOffline) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <MaterialIcons name="cloud-off" size={16} color={colors.warning} />
      <Text style={styles.text}>No internet connection — showing last known data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(224,181,102,0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224,181,102,0.35)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  text: { ...typography.caption, color: colors.warning, flexShrink: 1 },
});
