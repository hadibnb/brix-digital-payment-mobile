import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { ConfirmSheet } from '../src/components/ConfirmSheet';
import { AmountInput, Banner, Button, Card, KeyValue, TextField } from '../src/components/ui';
import { useMutation } from '../src/hooks/useAsync';
import { executePayment, resolvePayment, type ResolvedPayment } from '../src/services/payments';
import { validateBrixAmount } from '../src/utils/validation';
import { colors, spacing, typography } from '../src/theme';

/**
 * Pay.
 *
 * Two-phase by design, mirroring the web flow (`#qrPaymentInput` +
 * `#applyQrPayment`, then submit):
 *   1. resolve the code -> show WHO is being paid (nothing is debited)
 *   2. review + confirm -> execute against the backend
 *
 * Success is reported only from the executed backend response. The backend
 * verifies the code; the client never assumes a payee is valid.
 */
export default function PayScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ scanned?: string; ts?: string }>();

  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [resolved, setResolved] = useState<ResolvedPayment | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolveMutation = useMutation(async (value: string) => resolvePayment(value));
  const payMutation = useMutation(async (args: { code: string; amount?: string }) =>
    executePayment(args),
  );

  const apply = useCallback(
    async (target: string) => {
      const value = target.trim();
      if (!value) {
        setResolveError(t('validation.required'));
        return;
      }
      setResolveError(null);
      setResolved(null);
      const result = await resolveMutation.submit(value);
      if (!result) {
        setResolveError(resolveMutation.error?.message ?? t('errors.generic'));
        return;
      }
      setResolved(result);
      if (result.amountDue !== null && result.amountDue !== undefined) {
        setAmount(String(result.amountDue));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolveMutation.submit, t],
  );

  // A code handed over by the scanner resolves immediately.
  useEffect(() => {
    if (params.scanned) {
      setCode(params.scanned);
      void apply(params.scanned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.scanned, params.ts]);

  const onReview = () => {
    const check = validateBrixAmount(amount);
    if (!check.ok) {
      setAmountError(t(check.messageKey));
      return;
    }
    setAmountError(undefined);
    setSubmitError(null);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setSubmitError(null);
    const result = await payMutation.submit({ code: code.trim(), amount });
    if (!result) {
      setSubmitError(payMutation.error?.message ?? t('pay.paymentFailed'));
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setConfirmOpen(false);
    router.replace({
      pathname: '/receipt',
      params: {
        kind: 'pay',
        status: 'completed',
        amount,
        recipient: resolved?.merchantName ?? resolved?.merchantId ?? code.trim(),
        reference: result.reference ?? '',
      },
    });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title={t('pay.title')} subtitle={t('pay.subtitle')} showBack onBack={() => router.back()} />
      <ScreenScroll>
        <Button label={t('pay.scanQr')} onPress={() => router.push('/scan')} icon="qr-code-scanner" size="lg" />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <View>
            <View style={styles.orWrap}>
              <View style={styles.rule} />
            </View>
          </View>
          <View style={styles.line} />
        </View>

        <TextField
          label={t('pay.enterCode')}
          value={code}
          onChangeText={setCode}
          placeholder={t('pay.qrPlaceholder')}
          autoCapitalize="none"
          editable={!resolveMutation.loading}
          onSubmitEditing={() => void apply(code)}
          returnKeyType="go"
        />

        <Button
          label={t('pay.apply')}
          onPress={() => void apply(code)}
          variant="secondary"
          loading={resolveMutation.loading}
          icon="search"
        />

        {resolveError ? (
          <Banner tone="danger" icon="error-outline" title={t('pay.paymentFailed')} body={resolveError} />
        ) : null}

        {resolved ? (
          <Card style={styles.resolved}>
            <Text style={styles.resolvedTitle}>{t('pay.merchantLabel')}</Text>
            <Text style={styles.merchantName}>
              {resolved.merchantName ?? resolved.merchantId ?? '—'}
            </Text>
            <KeyValue label={t('common.reference')} value={resolved.reference ?? '—'} mono />
            {resolved.amountDue !== null && resolved.amountDue !== undefined ? (
              <KeyValue label={t('pay.amountLabel')} value={String(resolved.amountDue)} />
            ) : null}
          </Card>
        ) : null}

        <AmountInput
          label={t('common.amount')}
          value={amount}
          onChangeText={setAmount}
          suffix="BRIX"
          error={amountError}
        />

        <Button
          label={t('pay.payNow')}
          onPress={onReview}
          size="lg"
          icon="payments"
          disabled={!resolved || resolveMutation.loading}
        />

        {!resolved ? (
          <Banner
            tone="info"
            icon="info-outline"
            body="Resolve the payment code first so you can see who you are paying before any amount is confirmed."
          />
        ) : null}
      </ScreenScroll>

      <ConfirmSheet
        visible={confirmOpen}
        title={t('pay.confirmPayment')}
        rows={[
          { label: t('pay.merchantLabel'), value: resolved?.merchantName ?? resolved?.merchantId ?? code },
          { label: t('common.amount'), value: `${amount} BRIX`, emphasize: true },
          { label: t('pay.enterCode'), value: code },
        ]}
        confirmLabel={t('pay.payNow')}
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setSubmitError(null);
        }}
        loading={payMutation.loading}
        icon="payments"
        errorMessage={submitError}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  orWrap: { alignItems: 'center', justifyContent: 'center' },
  rule: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint },
  resolved: { marginTop: spacing.lg, gap: 2 },
  resolvedTitle: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  merchantName: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
});
