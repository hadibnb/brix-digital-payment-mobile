import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { Badge, Banner, Button, Card, EmptyState, KeyValue, LoadingView } from '../../src/components/ui';
import { useAsync } from '../../src/hooks/useAsync';
import { fetchTransactions } from '../../src/services/transactions';
import { formatBrix, formatDateTime } from '../../src/utils/format';
import { colors, radius, spacing, typography } from '../../src/theme';

/**
 * Transaction detail.
 *
 * Resolves the transaction from the same backend list (the web client has no
 * separate transaction-detail endpoint), so the reference shown always comes
 * from the server rather than from route params. The id is URL-decoded because
 * it was encoded when pushed.
 */
export default function TransactionDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? decodeURIComponent(params.id) : null;

  const query = useAsync((signal) => fetchTransactions(signal), []);

  const transaction = useMemo(
    () => query.data?.find((tx) => tx.id === id) ?? null,
    [query.data, id],
  );

  const tone =
    transaction?.status === 'completed'
      ? 'success'
      : transaction?.status === 'failed'
        ? 'danger'
        : transaction?.status === 'pending'
          ? 'warning'
          : 'neutral';

  return (
    <>
      <AppHeader title={t('transactions.detailTitle')} showBack onBack={() => router.back()} />
      <ScreenScroll onRefresh={query.refresh} refreshing={query.refreshing}>
        {query.loading ? (
          <Card style={styles.pad}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : query.error ? (
          <Card>
            <EmptyState
              icon="error-outline"
              title={t(query.error.messageKey)}
              body={query.error.message}
              actionLabel={t('common.retry')}
              onAction={query.reload}
            />
          </Card>
        ) : !transaction ? (
          <Card>
            <EmptyState
              icon="search-off"
              title={t('errors.notFound')}
              body={id ? `ID: ${id}` : undefined}
              actionLabel={t('transactions.title')}
              onAction={() => router.replace('/(tabs)/transactions')}
            />
          </Card>
        ) : (
          <>
            <Card style={styles.hero}>
              <View style={styles.heroIcon}>
                <MaterialIcons
                  name={
                    transaction.direction === 'in'
                      ? 'south-west'
                      : transaction.direction === 'out'
                        ? 'north-east'
                        : 'swap-horiz'
                  }
                  size={26}
                  color={colors.gold}
                />
              </View>
              <Text style={styles.amount}>
                {transaction.direction === 'in' ? '+' : transaction.direction === 'out' ? '−' : ''}
                {formatBrix(transaction.amount)} BRIX
              </Text>
              <Badge label={t(`status.${transaction.status ?? 'unknown'}`)} tone={tone} />
            </Card>

            <Card style={styles.details}>
              <KeyValue label={t('common.status')} value={transaction.statusRaw ?? t(`status.${transaction.status ?? 'unknown'}`)} />
              <KeyValue label={t('common.date')} value={formatDateTime(transaction.createdAt)} />
              <KeyValue label={t('common.reference')} value={transaction.reference ?? '—'} mono />
              <KeyValue label={t('common.recipient')} value={transaction.counterparty ?? '—'} />
              <KeyValue label={t('common.description')} value={transaction.description ?? transaction.type ?? '—'} />
              <KeyValue
                label={t('common.fee')}
                value={transaction.fee !== null && transaction.fee !== undefined ? `${formatBrix(transaction.fee)} BRIX` : '—'}
              />
            </Card>

            <Banner
              tone="info"
              icon="info-outline"
              body="This record reflects the BRIX internal ledger. Status values are reported by the backend."
            />

            <Button
              label={t('transactions.title')}
              onPress={() => router.replace('/(tabs)/transactions')}
              variant="secondary"
              icon="receipt-long"
            />
          </>
        )}
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { paddingVertical: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(202,166,90,0.10)',
    borderWidth: 1,
    borderColor: colors.goldDeep,
  },
  amount: { ...typography.display, fontSize: 30, color: colors.text, fontVariant: ['tabular-nums'] },
  details: { marginTop: spacing.lg, marginBottom: spacing.lg },
});

void radius;
void Text;
