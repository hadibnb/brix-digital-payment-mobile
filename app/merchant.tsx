import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { ConfirmSheet } from '../src/components/ConfirmSheet';
import { AmountInput, Badge, Banner, Button, Card, ErrorView, LoadingView, TextField } from '../src/components/ui';
import { useAsync, useMutation } from '../src/hooks/useAsync';
import { createMerchant, fetchMerchants, merchantRequestPayment } from '../src/services/payments';
import { formatDateTime } from '../src/utils/format';
import { colors, spacing, typography } from '../src/theme';

/**
 * Merchant.
 *
 * Two flows, both backed by real calls: onboarding (`#merchantForm`) and
 * payment against a merchant ID (`#merchantPaymentForm`).
 *
 * Approval status is whatever the backend reports. There is no local "approved"
 * state and no optimistic success — the status badge shows the server's value
 * or "pending" when the server has not returned one yet.
 */
export default function MerchantScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'list' | 'create'>('list');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const [payMerchantId, setPayMerchantId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [confirmPay, setConfirmPay] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const merchants = useAsync((signal) => fetchMerchants(signal), []);
  const createMutation = useMutation(async (args: { name: string; category?: string; website?: string; description?: string }) =>
    createMerchant(args),
  );
  const payMutation = useMutation(async (args: { merchantId: string; amount: string }) =>
    merchantRequestPayment(args),
  );

  const onCreate = async () => {
    if (!name.trim()) {
      setErrors({ name: t('validation.required') });
      return;
    }
    setErrors({});
    const result = await createMutation.submit({
      name: name.trim(),
      category: category.trim() || undefined,
      website: website.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (!result) return;
    setName('');
    setCategory('');
    setWebsite('');
    setDescription('');
    setMode('list');
    await merchants.reload();
  };

  const onPay = async () => {
    if (!payMerchantId.trim() || !payAmount.trim()) {
      setErrors({
        payMerchantId: payMerchantId.trim() ? undefined : t('validation.required'),
        payAmount: payAmount.trim() ? undefined : t('validation.required'),
      });
      return;
    }
    setErrors({});
    setSubmitError(null);
    const result = await payMutation.submit({ merchantId: payMerchantId.trim(), amount: payAmount });
    if (!result) {
      setSubmitError(payMutation.error?.message ?? t('errors.generic'));
      return;
    }
    setConfirmPay(false);
    router.replace({
      pathname: '/receipt',
      params: {
        kind: 'merchant',
        status: 'completed',
        amount: payAmount,
        recipient: payMerchantId.trim(),
        reference: result.reference ?? '',
      },
    });
  };

  const endpointUnavailable =
    merchants.error?.kind === 'notFound' || merchants.error?.kind === 'unverifiedEndpoint';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        title={t('merchant.title')}
        subtitle={t('merchant.subtitle')}
        showBack
        onBack={() => router.back()}
      />
      <ScreenScroll onRefresh={merchants.refresh} refreshing={merchants.refreshing}>
        <View style={styles.tabs}>
          <Text
            onPress={() => setMode('list')}
            style={[styles.tab, mode === 'list' && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'list' }}
          >
            {t('merchant.merchantList')}
          </Text>
          <Text
            onPress={() => setMode('create')}
            style={[styles.tab, mode === 'create' && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'create' }}
          >
            {t('merchant.newMerchant')}
          </Text>
        </View>

        {mode === 'list' ? (
          <>
            {merchants.loading ? (
              <Card style={styles.pad}>
                <LoadingView label={t('common.loading')} />
              </Card>
            ) : merchants.error ? (
              <Card>
                <ErrorView
                  title={endpointUnavailable ? t('errors.endpointUnavailable') : t('errors.loadFailed')}
                  message={`${t(merchants.error.messageKey)} ${merchants.error.message}`}
                  onRetry={merchants.reload}
                  retryLabel={t('common.retry')}
                  endpointUnavailable={endpointUnavailable}
                />
              </Card>
            ) : (merchants.data?.length ?? 0) === 0 ? (
              <Card style={styles.pad}>
                <Text style={styles.empty}>{t('merchant.noMerchants')}</Text>
                <Button label={t('merchant.newMerchant')} onPress={() => setMode('create')} icon="add-business" />
              </Card>
            ) : (
              merchants.data?.map((m) => (
                <Card key={m.id} style={styles.merchantCard}>
                  <View style={styles.merchantHead}>
                    <Text style={styles.merchantName}>{m.name ?? m.id}</Text>
                    <Badge
                      label={m.status ?? t('status.pending')}
                      tone={/approv|active|verif/i.test(m.status ?? '') ? 'success' : 'warning'}
                    />
                  </View>
                  {m.category ? <Text style={styles.merchantMeta}>{m.category}</Text> : null}
                  {m.website ? (
                    <Text style={styles.merchantMeta} numberOfLines={1}>
                      {m.website}
                    </Text>
                  ) : null}
                  <Text style={styles.merchantMeta}>{formatDateTime(m.createdAt)}</Text>
                  <Button
                    label={t('merchant.requestPayment')}
                    onPress={() => {
                      setPayMerchantId(m.id);
                      setMode('list');
                    }}
                    variant="secondary"
                    icon="payments"
                    style={styles.merchantAction}
                  />
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            <TextField
              label={t('merchant.merchantName')}
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
              editable={!createMutation.loading}
            />
            <TextField
              label={`${t('merchant.category')} (${t('common.optional')})`}
              value={category}
              onChangeText={setCategory}
              autoCapitalize="words"
              editable={!createMutation.loading}
            />
            <TextField
              label={`${t('merchant.website')} (${t('common.optional')})`}
              value={website}
              onChangeText={setWebsite}
              keyboardType="email-address"
              editable={!createMutation.loading}
            />
            <TextField
              label={`${t('merchant.description')} (${t('common.optional')})`}
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!createMutation.loading}
            />

            {createMutation.error ? (
              <Banner
                tone="danger"
                icon="error-outline"
                title={t(createMutation.error.messageKey)}
                body={createMutation.error.message}
              />
            ) : null}

            <Button
              label={t('merchant.createMerchant')}
              onPress={onCreate}
              size="lg"
              loading={createMutation.loading}
              icon="add-business"
            />
          </>
        )}

        <Text style={styles.sectionLabel}>{t('merchant.merchantPayment')}</Text>
        <Card>
          <TextField
            label={t('merchant.merchantPlaceholder')}
            value={payMerchantId}
            onChangeText={setPayMerchantId}
            error={errors.payMerchantId}
            autoCapitalize="none"
            editable={!payMutation.loading}
          />
          <AmountInput
            label={t('common.amount')}
            value={payAmount}
            onChangeText={setPayAmount}
            suffix="BRIX"
            error={errors.payAmount}
          />
          <Button
            label={t('merchant.requestPayment')}
            onPress={() => setConfirmPay(true)}
            icon="payments"
            disabled={!payMerchantId.trim() || !payAmount.trim()}
          />
        </Card>

        <Banner tone="gold" icon="info-outline" body={t('merchant.statusNotice')} />
      </ScreenScroll>

      <ConfirmSheet
        visible={confirmPay}
        title={t('merchant.requestPayment')}
        rows={[
          { label: t('merchant.merchantPlaceholder'), value: payMerchantId },
          { label: t('common.amount'), value: `${payAmount} BRIX`, emphasize: true },
        ]}
        confirmLabel={t('merchant.requestPayment')}
        cancelLabel={t('common.cancel')}
        onConfirm={onPay}
        onCancel={() => {
          setConfirmPay(false);
          setSubmitError(null);
        }}
        loading={payMutation.loading}
        icon="storefront"
        errorMessage={submitError}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  pad: { paddingVertical: spacing.xl, gap: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tab: {
    ...typography.caption,
    color: colors.textMuted,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tabActive: { color: colors.gold, borderColor: colors.gold, backgroundColor: 'rgba(202,166,90,0.14)' },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  merchantCard: { marginBottom: spacing.md, gap: 4 },
  merchantHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  merchantName: { ...typography.heading, color: colors.text, flexShrink: 1 },
  merchantMeta: { ...typography.caption, color: colors.textMuted },
  merchantAction: { marginTop: spacing.md },
  sectionLabel: {
    ...typography.micro,
    color: colors.textFaint,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
