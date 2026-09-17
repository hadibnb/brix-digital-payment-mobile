import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { LanguageCurrencyBar } from '../../src/components/LanguageCurrencyBar';
import { RateBadge } from '../../src/components/RateBadge';
import { TransactionCard } from '../../src/components/TransactionCard';
import {
  ActionTile,
  Badge,
  Banner,
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
import { fetchOverview } from '../../src/services/wallet';
import { fetchTransactions } from '../../src/services/transactions';
import { fetchLocalContext } from '../../src/services/rates';
import { useUiStore } from '../../src/state/uiStore';
import { useAuthStore } from '../../src/state/authStore';
import { changeLanguage } from '../../src/i18n';
import { formatBrix, formatLocal, brixToLocal } from '../../src/utils/format';
import { colors, radius, spacing, typography } from '../../src/theme';

/**
 * Dashboard.
 *
 * Ports the web `overview` view to a mobile hierarchy: balance first, local
 * reference second, actions third, recent activity last.
 *
 * Two display rules from the spec are enforced here:
 *   - the BRIX balance renders with 2–3 decimals, never 18
 *   - no USD price of BRIX is ever shown; only 1 BRIX = N <local currency>
 */
export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const currency = useUiStore((s) => s.currency);
  const setCurrency = useUiStore((s) => s.setCurrency);
  const setLanguage = useUiStore((s) => s.setLanguage);

  const overview = useAsync((signal) => fetchOverview(signal), []);
  const recent = useAsync((signal) => fetchTransactions(signal), []);
  const rate = useRate();

  // Region bootstrap from the backend. A failure is non-fatal: the device
  // locale already gave us a sensible currency, and the user can override it.
  const bootstrap = useCallback(async () => {
    const ctx = await fetchLocalContext();
    if (!ctx) return;
    const regionCurrency = typeof ctx.currency === 'string' ? ctx.currency : undefined;
    const regionLanguage = typeof ctx.language === 'string' ? ctx.language : undefined;
    if (regionCurrency) await setCurrency(regionCurrency, { fromRegion: true });
    if (regionLanguage && regionLanguage !== i18n.language) {
      await setLanguage(regionLanguage);
      await changeLanguage(regionLanguage);
    }
  }, [i18n.language, setCurrency, setLanguage]);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const wallet = overview.data?.wallet ?? null;
  const localValue = brixToLocal(wallet?.brix ?? null, rate.data?.data.brix_local ?? null);

  const endpointUnavailable =
    overview.error?.kind === 'notFound' ||
    overview.error?.kind === 'unverifiedEndpoint' ||
    overview.error?.kind === 'forbidden';

  const statusLabel = wallet?.currency ?? currency;

  return (
    <>
      <AppHeader
        title={t('nav.dashboard')}
        subtitle={user?.fullName ?? user?.name ?? user?.email ?? undefined}
        large
        rightIcon="notifications-none"
        onRightPress={() => router.push('/notifications')}
        rightLabel={t('notifications.title')}
      />
      <ScreenScroll onRefresh={overview.refresh} refreshing={overview.refreshing}>
        <LanguageCurrencyBar compact />

        {overview.loading ? (
          <Card style={styles.balanceCard}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : overview.error ? (
          <Card>
            <ErrorView
              title={endpointUnavailable ? t('errors.endpointUnavailable') : t('errors.loadFailed')}
              message={`${t(overview.error.messageKey)} ${overview.error.message}`}
              onRetry={overview.reload}
              retryLabel={t('common.retry')}
              endpointUnavailable={endpointUnavailable}
            />
          </Card>
        ) : (
          <Card style={styles.balanceCard}>
            <View style={styles.balanceHead}>
              <Text style={styles.balanceLabel}>{t('dashboard.totalBalance')}</Text>
              <Badge label={t('dashboard.internalLedger')} tone="gold" />
            </View>
            <Text style={styles.balanceValue}>{formatBrix(wallet?.brix ?? 0)}</Text>
            <Text style={styles.balanceUnit}>BRIX</Text>

            <View style={styles.balanceMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('dashboard.localReference')}</Text>
                <Text style={styles.metaValue}>
                  {localValue !== null ? formatLocal(localValue, rate.data?.data.currency ?? currency) : '—'}
                </Text>
              </View>
              {wallet?.available !== null && wallet?.available !== undefined ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>{t('common.available')}</Text>
                  <Text style={styles.metaValue}>{formatBrix(wallet.available)} BRIX</Text>
                </View>
              ) : null}
            </View>
          </Card>
        )}

        <RateBadge
          rate={rate.data?.data.brix_local ?? null}
          currency={rate.data?.data.currency ?? currency}
          source={rate.data?.source ?? 'fallback'}
          statusText={t('rates.live')}
          fallbackText={t('rates.fallbackNotice')}
        />

        <SectionHeader title={t('dashboard.quickActions')} />
        <View style={styles.tiles}>
          <ActionTile icon="north-east" label={t('nav.send')} onPress={() => router.push('/send')} />
          <ActionTile icon="south-west" label={t('nav.receive')} onPress={() => router.push('/receive')} />
          <ActionTile icon="qr-code-scanner" label={t('nav.pay')} onPress={() => router.push('/pay')} />
          <ActionTile icon="savings" label={t('nav.funding')} onPress={() => router.push('/funding')} />
        </View>
        <View style={styles.tiles}>
          <ActionTile icon="credit-card" label={t('nav.cardToCard')} onPress={() => router.push('/card-to-card')} />
          <ActionTile icon="storefront" label={t('nav.merchant')} onPress={() => router.push('/merchant')} />
          <ActionTile icon="account-balance-wallet" label={t('nav.wallet')} onPress={() => router.push('/(tabs)/wallet')} />
          <ActionTile icon="manage-accounts" label={t('nav.account')} onPress={() => router.push('/(tabs)/account')} />
        </View>

        <SectionHeader
          title={t('dashboard.recentActivity')}
          action={t('dashboard.viewAll')}
          onAction={() => router.push('/(tabs)/transactions')}
        />
        <Card padded={false} style={styles.listCard}>
          {recent.loading ? (
            <LoadingView label={t('common.loading')} />
          ) : recent.error ? (
            <ErrorView
              title={t('errors.loadFailed')}
              message={t(recent.error.messageKey)}
              onRetry={recent.reload}
              retryLabel={t('common.retry')}
              endpointUnavailable={
                recent.error.kind === 'notFound' || recent.error.kind === 'unverifiedEndpoint'
              }
            />
          ) : (recent.data?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('transactions.empty')}</Text>
            </View>
          ) : (
            recent.data?.slice(0, 4).map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                statusLabel={t(`status.${tx.status ?? 'unknown'}`)}
                onPress={() => router.push(`/transaction/${encodeURIComponent(tx.id)}`)}
              />
            ))
          )}
        </Card>

        <Card style={styles.statusCard}>
          <View style={styles.statusHead}>
            <MaterialIcons name="info-outline" size={16} color={colors.info} />
            <Text style={styles.statusTitle}>{t('dashboard.status')}</Text>
          </View>
          <KeyValue label={t('dashboard.status')} value={overview.data?.status ?? '—'} />
          <KeyValue label={t('dashboard.pending')} value={String(overview.data?.pendingCount ?? '—')} />
          <KeyValue label={t('common.currency')} value={statusLabel} />
        </Card>

        <Banner
          tone="gold"
          icon="verified-user"
          title={t('dashboard.preApprovalNotice')}
          body={t('dashboard.preApprovalBody')}
        />
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  balanceCard: { paddingVertical: spacing.xl },
  balanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  balanceLabel: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  balanceValue: {
    ...typography.display,
    fontSize: 38,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  balanceUnit: { ...typography.caption, color: colors.gold, letterSpacing: 2 },
  balanceMeta: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  metaItem: { gap: 3 },
  metaLabel: { ...typography.micro, color: colors.textFaint, textTransform: 'uppercase' },
  metaValue: { ...typography.bodyStrong, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  listCard: { overflow: 'hidden', paddingHorizontal: spacing.lg },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.caption, color: colors.textMuted },
  statusCard: { marginTop: spacing.xl },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  statusTitle: { ...typography.heading, color: colors.text },
});

void radius;
void Button;
