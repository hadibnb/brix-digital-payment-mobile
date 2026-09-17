import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

/**
 * Brand lockup. The mark is the same asset the web portal uses
 * (`assets/bdp.png` on dp.brixgroup.ir), so the identity is identical rather
 * than an approximation.
 */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/icon.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="BRIX"
    />
  );
}

export function BrandLockup({
  size = 40,
  showTagline = false,
}: {
  size?: number;
  showTagline?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Logo size={size} />
      <View style={styles.text}>
        <Text style={styles.brand}>{'BRIX'}</Text>
        <Text style={styles.sub}>{'DIGITAL PAYMENT'}</Text>
        {showTagline ? <Text style={styles.tagline}>Internal ledger and payment operations</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { justifyContent: 'center' },
  brand: { ...typography.heading, color: colors.text, letterSpacing: 1.2 },
  sub: { ...typography.micro, color: colors.gold, letterSpacing: 2.2 },
  tagline: { ...typography.caption, color: colors.textFaint, marginTop: 2 },
});
