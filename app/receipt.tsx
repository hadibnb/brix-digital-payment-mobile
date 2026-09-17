import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { Badge, Banner, Button, Card, KeyValue } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';

/**
 * Receipt screen.
 *
 * Reached only after a backend-confirmed response (or an explicitly
 * acknowledged review request for funding). It never invents an outcome: the
 * status it renders is the one the caller passed, which itself came from the
 * server response.
 */
const KIND_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  send: 'north-east',
  pay: 'payments',
  'card-to-card': 'swap-horiz',
  funding: 'savings',
  merchant: 'storefront',
};

export default function ReceiptScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    kind?: string;
    status?: string;
    amount?: string;
    recipient?: string;
    reference?: string;
  }>();

  const kind = params.kind ?? 'send';
  const status = params.status ?? 'completed';
  const isPending = status === 'pending';
  const isFailure = status === 'failed';

  const tone = isFailure ? 'danger' : isPending ? 'warning' : 'success';
  const icon = isFailure ? 'error-outline' : isPending ? 'schedule' : 'check-circle-outline';

  const title = isFailure
    ? t('pay.paymentFailed')
    : isPending
      ? t('funding.requestSubmitted')
      : status === 'completed' && kind === 'card-to-card'
        ? t('cardToCard.success')
        : status === 'completed' && kind === 'send'
          ? t('send.success')
          : t('common.success');

  return (
    <>
      <AppHeader title={t('common.status')} showBack onBack={() => router.replace('/(tabs)')} />
      <ScreenScroll>
        <Card style={styles.hero}>
          <View
            style={[
              styles.iconWrap,
              { borderColor: colors[tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'danger'] },
            ]}
          >
            <MaterialIcons
              name={icon}
              size={34}
              color={colors[tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'danger']}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Badge label={t(`status.${status}`)} tone={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'danger'} />
        </Card>

        <Card style={styles.details}>
          <KeyValue label={t('common.amount')} value={params.amount ? `${params.amount} BRIX` : '—'} />
          <KeyValue label={t('common.recipient')} value={params.recipient || '—'} />
          <KeyValue label={t('common.reference')} value={params.reference || '—'} mono />
          <KeyValue label={t('common.status')} value={t(`status.${status}`)} />
        </Card>

        {isPending ? (
          <Banner
            tone="warning"
            icon="hourglass-empty"
            title={t('status.pending')}
            body="Your BRIX balance has not changed yet. It is updated only after BRIX operations reviews and confirms the funding request."
          />
        ) : null}

        <Button label={t('dashboard.recentActivity')} onPress={() => router.replace('/(tabs)/transactions')} variant="secondary" icon="receipt-long" />
        <Button label={t('nav.dashboard')} onPress={() => router.replace('/(tabs)')} variant="ghost" icon="dashboard" />

        <View style={styles.iconRow}>
          <MaterialIcons name={KIND_ICONS[kind] ?? 'receipt'} size={14} color={colors.textFaint} />
          <Text style={styles.kind}>{kind}</Text>
        </View>
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  iconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.title, color: colors.text, textAlign: 'center' },
  details: { marginBottom: spacing.lg },
  iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  kind: { ...typography.caption, color: colors.textFaint },
});

void radius;
