import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { ConfirmSheet } from '../src/components/ConfirmSheet';
import { AmountInput, Banner, Button, Card, TextField } from '../src/components/ui';
import { useAsync, useMutation } from '../src/hooks/useAsync';
import { useFundingConfig, useRate } from '../src/hooks/useRate';
import { sendTransfer } from '../src/services/payments';
import { fetchWallet } from '../src/services/wallet';
import { useUiStore } from '../src/state/uiStore';
import { formatBrix, formatLocal, localToBrix, toNumber } from '../src/utils/format';
import { validateBrixAmount, validateNotExceeding, validateRecipientCard } from '../src/utils/validation';
import { colors, spacing, typography } from '../src/theme';

/**
 * Send BRIX.
 *
 * Three deliberate steps — enter, review, confirm — because this moves money.
 * Submission happens only from the confirmation sheet, only once (the button is
 * disabled while in flight and the API layer adds an Idempotency-Key, so a
 * retry after a dropped connection cannot double-send).
 */
export default function SendScreen() {
  const { t } = useTranslation();
  const currency = useUiStore((s) => s.currency);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const wallet = useAsync((signal) => fetchWallet(signal), []);
  const rate = useRate();
  const config = useFundingConfig();

  const mutation = useMutation(async (args: { recipient: string; amount: string; note?: string; currency: string }) =>
    sendTransfer(args),
  );

  const available = toNumber(wallet.data?.brix ?? null) ?? 0;
  const fee = config.data?.data.transaction_fee_brix ?? null;
  const localEstimate = localToBrix(toNumber(amount), rate.data?.data.brix_local ?? null);

  const onReview = () => {
    const next: Record<string, string | undefined> = {};
    const recipientCheck = validateRecipientCard(recipient);
    const amountCheck = validateBrixAmount(amount);
    if (!recipientCheck.ok) next.recipient = t(recipientCheck.messageKey);
    if (!amountCheck.ok) next.amount = t(amountCheck.messageKey);

    const numeric = toNumber(amount);
    if (amountCheck.ok && numeric !== null) {
      const cap = validateNotExceeding(numeric, available);
      if (!cap.ok) next.amount = t(cap.messageKey);
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitError(null);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setSubmitError(null);
    const result = await mutation.submit({
      recipient: recipient.trim(),
      amount,
      note: note.trim() || undefined,
      currency,
    });
    if (!result) {
      // Stay on the sheet and show the real backend reason.
      setSubmitError(mutation.error?.message ?? t('send.failed'));
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setConfirmOpen(false);
    await wallet.reload();

    // Only a backend-confirmed result triggers the success screen.
    router.replace({
      pathname: '/receipt',
      params: {
        kind: 'send',
        status: 'completed',
        amount,
        recipient: recipient.trim(),
        reference: result.reference ?? '',
      },
    });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title={t('send.title')} subtitle={t('send.subtitle')} showBack onBack={() => router.back()} />
      <ScreenScroll>
        <Card>
          <Text style={styles.availableLabel}>{t('common.available')}</Text>
          <Text style={styles.availableValue}>
            {wallet.loading ? t('common.loading') : `${formatBrix(available)} BRIX`}
          </Text>
          {wallet.data?.brix !== null && wallet.data?.brix !== undefined && rate.data ? (
            <Text style={styles.availableLocal}>
              ≈ {formatLocal(available * (rate.data.data.brix_local ?? 0), rate.data.data.currency ?? currency)}
            </Text>
          ) : null}
        </Card>

        <View style={styles.form}>
          <TextField
            label={t('common.recipient')}
            value={recipient}
            onChangeText={setRecipient}
            placeholder={t('send.recipientPlaceholder')}
            error={errors.recipient}
            autoCapitalize="none"
            editable={!mutation.loading}
          />

          <AmountInput
            label={t('common.amount')}
            value={amount}
            onChangeText={setAmount}
            suffix="BRIX"
            error={errors.amount}
            hint={
              fee !== null
                ? t('send.feeNotice', { fee: formatBrix(fee) })
                : undefined
            }
          />

          {localEstimate !== null && rate.data?.data.brix_local ? (
            <View style={styles.conversion}>
              <Text style={styles.conversionText}>
                = {formatLocal(localEstimate, rate.data.data.currency ?? currency)}
              </Text>
            </View>
          ) : null}

          <TextField
            label={`${t('send.note')} (${t('common.optional')})`}
            value={note}
            onChangeText={setNote}
            placeholder="—"
            autoCapitalize="sentences"
            multiline
            editable={!mutation.loading}
          />
        </View>

        {wallet.error ? (
          <Banner
            tone="warning"
            icon="error-outline"
            title={t('errors.loadFailed')}
            body={wallet.error.message}
            actionLabel={t('common.retry')}
            onAction={wallet.reload}
          />
        ) : null}

        <Button
          label={t('send.confirm')}
          onPress={onReview}
          size="lg"
          icon="north-east"
          disabled={available <= 0 && !wallet.loading}
        />

        <Button
          label={t('receive.title')}
          onPress={() => router.push('/receive')}
          variant="ghost"
          icon="south-west"
          style={styles.secondary}
        />
      </ScreenScroll>

      <ConfirmSheet
        visible={confirmOpen}
        title={t('send.confirmTitle')}
        subtitle={t('send.subtitle')}
        rows={[
          { label: t('common.recipient'), value: recipient.trim() },
          { label: t('common.amount'), value: `${amount} BRIX`, emphasize: true },
          ...(localEstimate !== null && rate.data?.data.brix_local
            ? [
                {
                  label: t('dashboard.localReference'),
                  value: formatLocal(localEstimate, rate.data.data.currency ?? currency),
                },
              ]
            : []),
          ...(fee !== null ? [{ label: t('common.fee'), value: `${formatBrix(fee)} BRIX` }] : []),
          ...(note.trim() ? [{ label: t('send.note'), value: note.trim() }] : []),
        ]}
        confirmLabel={t('send.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setSubmitError(null);
        }}
        loading={mutation.loading}
        icon="north-east"
        errorMessage={submitError}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  availableLabel: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  availableValue: { ...typography.title, color: colors.text, fontVariant: ['tabular-nums'], marginTop: 4 },
  availableLocal: { ...typography.caption, color: colors.gold, marginTop: 2 },
  form: { marginTop: spacing.xl },
  conversion: { marginTop: -spacing.md, marginBottom: spacing.lg },
  conversionText: { ...typography.caption, color: colors.gold },
  secondary: { marginTop: spacing.md },
});

void Clipboard;
