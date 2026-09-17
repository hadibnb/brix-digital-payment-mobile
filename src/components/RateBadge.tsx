import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { Sourced } from '../api/types';
import { colors, radius, spacing, typography } from '../theme';
import { formatLocal } from '../utils/format';

/**
 * Local BRIX reference rate banner.
 *
 * Two product rules are enforced here:
 *   1. The rate is *always* 1 BRIX = N <currency>, sourced from
 *      /rate-engine.php. It is never a USD price of BRIX.
 *   2. When the live call failed, the value is labelled an offline reference
 *      value — it is never presented as a live rate.
 */
export function RateBadge({
  rate,
  currency,
  source,
  statusText,
  fallbackText,
  updatedText,
}: {
  rate: number | null;
  currency: string;
  source: Sourced<unknown>['source'];
  statusText: string;
  fallbackText: string;
  updatedText?: string;
}) {
  const isFallback = source === 'fallback';
  const accent = isFallback ? colors.warning : colors.gold;

  return (
    <View style={[styles.wrap, { borderColor: isFallback ? 'rgba(224,181,102,0.4)' : colors.line }]}>
      <View style={styles.head}>
        <MaterialIcons name={isFallback ? 'cloud-off' : 'trending-up'} size={16} color={accent} />
        <Text style={styles.title}>
          {isFallback ? fallbackText : `1 BRIX = ${formatLocal(rate, currency, 3)}`}
        </Text>
      </View>
      <Text style={styles.sub}>
        {isFallback ? `1 BRIX = ${formatLocal(rate, currency, 3)}` : statusText}
        {updatedText ? ` · ${updatedText}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(202,166,90,0.06)',
    padding: spacing.md,
    gap: 4,
    marginTop: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.text, fontVariant: ['tabular-nums'], flexShrink: 1 },
  sub: { ...typography.caption, color: colors.textMuted },
});
