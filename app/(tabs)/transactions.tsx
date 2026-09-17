import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { TransactionCard } from '../../src/components/TransactionCard';
import { Card, ErrorView, LoadingView, StatCard } from '../../src/components/ui';
import { useAsync } from '../../src/hooks/useAsync';
import { fetchTransactions } from '../../src/services/transactions';
import { formatBrix } from '../../src/utils/format';
import type { TransactionDirection } from '../../src/api/types';
import { colors, radius, spacing, typography } from '../../src/theme';

type Filter = 'all' | TransactionDirection;

/**
 * My Transactions.
 *
 * Rendered as readable cards (never a desktop table), with filter chips for
 * received / sent and aggregate totals so the list is scannable on a phone.
 */
export default function TransactionsScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useAsync((signal) => fetchTransactions(signal), []);

  const items = query.data ?? [];

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((tx) => tx.direction === filter);
  }, [items, filter]);

  const totals = useMemo(() => {
    let received = 0;
    let sent = 0;
    items.forEach((tx) => {
      const amount = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount ?? 0);
      if (!Number.isFinite(amount)) return;
      if (tx.direction === 'in') received += amount;
      if (tx.direction === 'out') sent += amount;
    });
    return { received, sent };
  }, [items]);

  const endpointUnavailable =
    query.error?.kind === 'notFound' || query.error?.kind === 'unverifiedEndpoint';

  return (
    <>
      <AppHeader title={t('transactions.title')} subtitle={`${items.length} · ${t('common.all')}`} large />
      <ScreenScroll onRefresh={query.refresh} refreshing={query.refreshing}>
        <View style={styles.stats}>
          <StatCard
            label={t('transactions.filterIn')}
            value={`+${formatBrix(totals.received)}`}
            caption="BRIX"
          />
          <StatCard
            label={t('transactions.filterOut')}
            value={`−${formatBrix(totals.sent)}`}
            caption="BRIX"
          />
        </View>

        <View style={styles.chips}>
          {(
            [
              ['all', t('transactions.filterAll')],
              ['in', t('transactions.filterIn')],
              ['out', t('transactions.filterOut')],
            ] as Array<[Filter, string]>
          ).map(([value, label]) => {
            const active = filter === value;
            return (
              <Text
                key={value}
                onPress={() => setFilter(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.chip,
                  active && { backgroundColor: 'rgba(202,166,90,0.16)', borderColor: colors.gold, color: colors.gold },
                ]}
              >
                {label}
              </Text>
            );
          })}
        </View>

        <Card padded={false} style={styles.listCard}>
          {query.loading ? (
            <LoadingView label={t('common.loading')} />
          ) : query.error ? (
            <ErrorView
              title={endpointUnavailable ? t('errors.endpointUnavailable') : t('errors.loadFailed')}
              message={`${t(query.error.messageKey)} ${query.error.message}`}
              onRetry={query.reload}
              retryLabel={t('common.retry')}
              endpointUnavailable={endpointUnavailable}
            />
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('transactions.empty')}</Text>
              <Text style={styles.emptyBody}>{t('transactions.emptyBody')}</Text>
            </View>
          ) : (
            filtered.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                statusLabel={t(`status.${tx.status ?? 'unknown'}`)}
                onPress={() => router.push(`/transaction/${encodeURIComponent(tx.id)}`)}
              />
            ))
          )}
        </Card>
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  chip: {
    ...typography.caption,
    color: colors.textMuted,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  listCard: { overflow: 'hidden', paddingHorizontal: spacing.lg },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center', gap: 6 },
  emptyTitle: { ...typography.heading, color: colors.text },
  emptyBody: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
