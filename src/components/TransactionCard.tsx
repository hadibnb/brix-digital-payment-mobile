import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { Transaction, TransactionStatus } from '../api/types';
import { colors, radius, spacing, typography } from '../theme';
import { formatBrix, formatDateTime } from '../utils/format';

/** Visual treatment per normalised status. `statusRaw` is still shown verbatim. */
function statusTone(status: TransactionStatus): {
  color: string;
  bg: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
} {
  switch (status) {
    case 'completed':
      return { color: colors.success, bg: 'rgba(103,198,155,0.14)', icon: 'check-circle-outline' };
    case 'pending':
      return { color: colors.warning, bg: 'rgba(224,181,102,0.14)', icon: 'schedule' };
    case 'failed':
      return { color: colors.danger, bg: 'rgba(216,107,107,0.14)', icon: 'error-outline' };
    case 'cancelled':
      return { color: colors.textMuted, bg: 'rgba(145,160,175,0.14)', icon: 'block' };
    default:
      return { color: colors.textMuted, bg: 'rgba(145,160,175,0.14)', icon: 'help-outline' };
  }
}

function directionSign(direction: Transaction['direction']): string {
  if (direction === 'in') return '+';
  if (direction === 'out') return '−';
  return '';
}

/**
 * Readable transaction card — deliberately not a desktop table row, so long
 * identifiers and multilingual counterparty names wrap instead of truncating.
 */
export function TransactionRow({
  transaction,
  statusLabel,
  onPress,
}: {
  transaction: Transaction;
  statusLabel: string;
  onPress?: () => void;
}) {
  const tone = statusTone(transaction.status ?? 'unknown');
  const sign = directionSign(transaction.direction);
  const amountText =
    transaction.amount !== null && transaction.amount !== undefined
      ? `${sign}${formatBrix(transaction.amount)} BRIX`
      : '—';

  const Content = (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: tone.bg }]}>
        <MaterialIcons
          name={transaction.direction === 'in' ? 'south-west' : transaction.direction === 'out' ? 'north-east' : 'swap-horiz'}
          size={18}
          color={tone.color}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={styles.title} numberOfLines={1}>
            {transaction.description ?? transaction.type ?? 'Transaction'}
          </Text>
          <Text
            style={[
              styles.amount,
              transaction.direction === 'in' ? { color: colors.success } : { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {amountText}
          </Text>
        </View>

        <View style={styles.line}>
          <Text style={styles.meta} numberOfLines={1}>
            {transaction.counterparty ? `${transaction.counterparty} · ` : ''}
            {formatDateTime(transaction.createdAt)}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <MaterialIcons name={tone.icon} size={11} color={tone.color} />
            <Text style={[styles.statusText, { color: tone.color }]}>{statusLabel}</Text>
          </View>
        </View>

        {transaction.fee !== null && transaction.fee !== undefined && transaction.fee !== 0 ? (
          <Text style={styles.fee}>Fee {formatBrix(transaction.fee)} BRIX</Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return Content;
  return (
    <View accessible accessibilityRole="button">
      <Text onPress={onPress} style={styles.tapTarget}>
        {' '}
      </Text>
      {Content}
    </View>
  );
}

/** Pressable variant — used by the list, where a tap must be real. */
export function TransactionCard({
  transaction,
  statusLabel,
  onPress,
}: {
  transaction: Transaction;
  statusLabel: string;
  onPress: () => void;
}) {
  const tone = statusTone(transaction.status ?? 'unknown');
  const sign = directionSign(transaction.direction);
  const amountText =
    transaction.amount !== null && transaction.amount !== undefined
      ? `${sign}${formatBrix(transaction.amount)} BRIX`
      : '—';

  return (
    <View style={styles.cardOuter}>
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${transaction.description ?? transaction.type ?? 'Transaction'} ${amountText}`}
        style={styles.wrap}
      >
        <View style={[styles.icon, { backgroundColor: tone.bg }]}>
          <MaterialIcons
            name={transaction.direction === 'in' ? 'south-west' : transaction.direction === 'out' ? 'north-east' : 'swap-horiz'}
            size={18}
            color={tone.color}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.line}>
            <Text style={styles.title} numberOfLines={1}>
              {transaction.description ?? transaction.type ?? 'Transaction'}
            </Text>
            <Text
              style={[
                styles.amount,
                transaction.direction === 'in' ? { color: colors.success } : { color: colors.text },
              ]}
              numberOfLines={1}
            >
              {amountText}
            </Text>
          </View>

          <View style={styles.line}>
            <Text style={styles.meta} numberOfLines={1}>
              {transaction.counterparty ? `${transaction.counterparty} · ` : ''}
              {formatDateTime(transaction.createdAt)}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
              <MaterialIcons name={tone.icon} size={11} color={tone.color} />
              <Text style={[styles.statusText, { color: tone.color }]}>{statusLabel}</Text>
            </View>
          </View>

          {transaction.reference ? (
            <Text style={styles.ref} numberOfLines={1} ellipsizeMode="middle">
              {transaction.reference}
            </Text>
          ) : null}

          {transaction.fee !== null && transaction.fee !== undefined && transaction.fee !== 0 ? (
            <Text style={styles.fee}>Fee {formatBrix(transaction.fee)} BRIX</Text>
          ) : null}
        </View>

        <MaterialIcons name="chevron-right" size={20} color={colors.textFaint} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 68,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.bodyStrong, color: colors.text, flexShrink: 1 },
  amount: { ...typography.bodyStrong, fontVariant: ['tabular-nums'], flexShrink: 0 },
  meta: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  statusText: { ...typography.micro, textTransform: 'none', letterSpacing: 0 },
  ref: { ...typography.caption, color: colors.textFaint },
  fee: { ...typography.caption, color: colors.textFaint },
  tapTarget: { height: 0 },
});
