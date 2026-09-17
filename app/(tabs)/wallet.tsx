import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { RateBadge } from '../../src/components/RateBadge';
import { TransactionCard } from '../../src/components/TransactionCard';
import {
  Button,
  Card,
  ErrorView,
  KeyValue,
  LoadingView,
  SectionHeader,
  StatCard,
} from '../../src/components/ui';
import { useAsync } from '../../src/hooks/useAsync';
import { useRate } from '../../src/hooks/useRate';
import { fetchWallet } from '../../src/services/wallet';
import { fetchTransactions } from '../../src/services/transactions';
import { useUiStore } from '../../src/state/uiStore';
import { brixToLocal, formatBrix, formatDateTime, formatLocal } from '../../src/utils/format';
import { colors, spacing, typography } from '../../src/theme';

/**
 * My Wallet — balance, wallet identity, and the four wallet actions from the
 * web `wallet` view: Send, Receive, Fund BRIX and transaction history.
 */
export default function WalletScreen() {
  const { t } = useTranslation();
  const currency = useUiStore((s) => s.currency);

  const wallet = useAsync((signal) => fetchWallet(signal), []);
  const history = useAsync((signal) => fetchTransactions(signal), []);
  const rate = useRate();

  const data = wallet.data;
  const localValue = brixToLocal(data?.brix ?? null, rate.data?.data.brix_local ?? null);
  const endpointUnavailable =
    wallet.error?.kind === 'notFound' || wallet.error?.kind === 'unverifiedEndpoint';

  return (
    <>
      <AppHeader title={t('wallet.title')} subtitle={t('common.balance')} large />
      <ScreenScroll onRefresh={wallet.refresh} refreshing={wallet.refreshing}>
        {wallet.loading ? (
          <Card style={styles.pad}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : wallet.error ? (
          <Card>
            <ErrorView
              title={endpointUnavailable ? t('errors.endpointUnavailable') : t('errors.loadFailed')}
              message={`${t(wallet.error.messageKey)} ${wallet.error.message}`}
              onRetry={wallet.reload}
              retryLabel={t('common.retry')}
              endpointUnavailable={endpointUnavailable}
            />
          </Card>
        ) : (
          <>
            <Card style={styles.pad}>
              <Text style={styles.label}>{t('common.balance')}</Text>
              <Text style={styles.value}>{formatBrix(data?.brix ?? 0)}</Text>
              <Text style={styles.unit}>BRIX</Text>

              <View style={styles.stats}>
                <StatCard
                  label={t('dashboard.localReference')}
                  value={localValue !== null ? formatLocal(localValue, currency) : '—'}
                  tone="gold"
                />
                <StatCard
                  label={t('common.available')}
                  value={data?.available !== null && data?.available !== undefined ? formatBrix(data.available) : '—'}
                  caption="BRIX"
                />
              </View>
            </Card>

            <RateBadge
              rate={rate.data?.data.brix_local ?? null}
              currency={rate.data?.data.currency ?? currency}
              source={rate.data?.source ?? 'fallback'}
              statusText={t('rates.live')}
              fallbackText={t('rates.fallbackNotice')}
            />
          </>
        )}

        <SectionHeader title={t('dashboard.quickActions')} />
        <View style={styles.actions}>
          <Button label={t('wallet.send')} onPress={() => router.push('/send')} icon="north-east" style={styles.action} />
          <Button
            label={t('wallet.receive')}
            onPress={() => router.push('/receive')}
            variant="secondary"
            icon="south-west"
            style={styles.action}
          />
        </View>
        <Button
          label={t('wallet.fund')}
          onPress={() => router.push('/funding')}
          variant="secondary"
          icon="savings"
        />

        <Card style={styles.details}>
          <KeyValue label={t('wallet.walletId')} value={data?.walletId ?? '—'} mono />
          <KeyValue label={t('wallet.accountNumber')} value={data?.accountNumber ?? '—'} mono />
          <KeyValue label={t('wallet.updatedAt')} value={formatDateTime(data?.updatedAt)} />
        </Card>

        <SectionHeader
          title={t('wallet.history')}
          action={t('dashboard.viewAll')}
          onAction={() => router.push('/(tabs)/transactions')}
        />
        <Card padded={false} style={styles.listCard}>
          {history.loading ? (
            <LoadingView label={t('common.loading')} />
          ) : history.error ? (
            <ErrorView
              title={t('errors.loadFailed')}
              message={t(history.error.messageKey)}
              onRetry={history.reload}
              retryLabel={t('common.retry')}
              endpointUnavailable={
                history.error.kind === 'notFound' || history.error.kind === 'unverifiedEndpoint'
              }
            />
          ) : (history.data?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('transactions.empty')}</Text>
            </View>
          ) : (
            history.data?.slice(0, 8).map((tx) => (
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
  pad: { paddingVertical: spacing.xl },
  label: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  value: { ...typography.display, fontSize: 36, color: colors.text, fontVariant: ['tabular-nums'] },
  unit: { ...typography.caption, color: colors.gold, letterSpacing: 2 },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  action: { flex: 1 },
  details: { marginTop: spacing.xl },
  listCard: { overflow: 'hidden', paddingHorizontal: spacing.lg },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.caption, color: colors.textMuted },
});
