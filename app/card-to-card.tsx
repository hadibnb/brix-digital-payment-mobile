import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { ConfirmSheet } from '../src/components/ConfirmSheet';
import { AmountInput, Banner, Button, Card, KeyValue, LoadingView, TextField } from '../src/components/ui';
import { useAsync, useMutation } from '../src/hooks/useAsync';
import { cardToCard } from '../src/services/cards';
import { fetchCards } from '../src/services/cards';
import { fetchWallet } from '../src/services/wallet';
import { isRecipientCardUnverified } from '../src/api/ApiError';
import { formatBrix, maskCard, toNumber } from '../src/utils/format';
import {
  validateBrixAmount,
  validateNotExceeding,
  validateRecipientCard,
} from '../src/utils/validation';
import { colors, spacing, typography } from '../src/theme';

/**
 * Card-to-Card.
 *
 * The recipient is verified by the BACKEND, never by the client. When the
 * backend answers with its documented "Recipient card could not be verified"
 * message, that message is shown verbatim in a dedicated danger state so the
 * user understands the transfer was not attempted.
 */
export default function CardToCardScreen() {
  const { t } = useTranslation();

  const [recipientCardId, setRecipientCardId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  const cards = useAsync((signal) => fetchCards(signal), []);
  const wallet = useAsync((signal) => fetchWallet(signal), []);

  const mutation = useMutation(
    async (args: { recipientCardId: string; amount: string; note?: string; sourceCardId?: string }) =>
      cardToCard(args),
  );

  const sourceCard = cards.data?.[0] ?? null;
  const available = toNumber(wallet.data?.brix ?? null) ?? 0;

  const onReview = () => {
    const next: Record<string, string | undefined> = {};
    const recipientCheck = validateRecipientCard(recipientCardId);
    const amountCheck = validateBrixAmount(amount);
    if (!recipientCheck.ok) next.recipientCardId = t(recipientCheck.messageKey);
    if (!amountCheck.ok) next.amount = t(amountCheck.messageKey);

    const numeric = toNumber(amount);
    if (amountCheck.ok && numeric !== null) {
      const cap = validateNotExceeding(numeric, available);
      if (!cap.ok) next.amount = t(cap.messageKey);
    }

    setErrors(next);
    setUnverified(false);
    if (Object.keys(next).length > 0) return;
    setSubmitError(null);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setSubmitError(null);
    setUnverified(false);
    const result = await mutation.submit({
      recipientCardId: recipientCardId.trim(),
      amount,
      note: note.trim() || undefined,
      sourceCardId: sourceCard?.id,
    });

    if (!result) {
      const error = mutation.error;
      // The exact backend rejection gets its own presentation.
      if (error && isRecipientCardUnverified(error)) {
        setUnverified(true);
        setSubmitError(t('cardToCard.unverified'));
      } else {
        setSubmitError(error?.message ?? t('errors.generic'));
      }
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setConfirmOpen(false);
    await wallet.reload();
    await cards.reload();

    router.replace({
      pathname: '/receipt',
      params: {
        kind: 'card-to-card',
        status: 'completed',
        amount,
        recipient: maskCard(recipientCardId.trim()),
        reference: result.reference ?? '',
      },
    });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        title={t('cardToCard.title')}
        subtitle={t('cardToCard.subtitle')}
        showBack
        onBack={() => router.back()}
      />
      <ScreenScroll>
        <Card>
          <Text style={styles.label}>{t('cardToCard.availableBalance')}</Text>
          <Text style={styles.value}>
            {wallet.loading ? t('common.loading') : `${formatBrix(available)} BRIX`}
          </Text>
          {sourceCard ? (
            <View style={styles.source}>
              <KeyValue label={t('cardToCard.sourceCard')} value={maskCard(sourceCard.maskedNumber)} mono />
            </View>
          ) : null}
        </Card>

        <View style={styles.form}>
          <TextField
            label={t('cardToCard.recipientCard')}
            value={recipientCardId}
            onChangeText={(v) => {
              setRecipientCardId(v);
              setUnverified(false);
            }}
            placeholder={t('cardToCard.recipientCardPlaceholder')}
            autoCapitalize="none"
            error={errors.recipientCardId}
            editable={!mutation.loading}
          />

          <AmountInput
            label={t('common.amount')}
            value={amount}
            onChangeText={setAmount}
            suffix="BRIX"
            error={errors.amount}
          />

          <TextField
            label={`${t('send.note')} (${t('common.optional')})`}
            value={note}
            onChangeText={setNote}
            multiline
            editable={!mutation.loading}
          />
        </View>

        {cards.loading ? (
          <Card style={styles.pad}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : null}

        {unverified ? (
          <Banner
            tone="danger"
            icon="person-off"
            title={t('cardToCard.unverified')}
            body="The BRIX backend could not verify this recipient card. No transfer was made. Check the card identifier and try again."
          />
        ) : null}

        {!unverified && submitError ? (
          <Banner tone="danger" icon="error-outline" title={t('errors.generic')} body={submitError} />
        ) : null}

        <Button
          label={t('cardToCard.submit')}
          onPress={onReview}
          size="lg"
          icon="swap-horiz"
          disabled={available <= 0 && !wallet.loading}
        />
      </ScreenScroll>

      <ConfirmSheet
        visible={confirmOpen}
        title={t('cardToCard.confirmTitle')}
        rows={[
          { label: t('cardToCard.sourceCard'), value: maskCard(sourceCard?.maskedNumber) },
          { label: t('cardToCard.recipientCard'), value: maskCard(recipientCardId.trim()) },
          { label: t('common.amount'), value: `${amount} BRIX`, emphasize: true },
          ...(note.trim() ? [{ label: t('send.note'), value: note.trim() }] : []),
        ]}
        confirmLabel={t('cardToCard.submit')}
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setSubmitError(null);
          setUnverified(false);
        }}
        loading={mutation.loading}
        icon="swap-horiz"
        errorMessage={submitError}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  pad: { paddingVertical: spacing.xl, marginTop: spacing.lg },
  label: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  value: { ...typography.title, color: colors.text, fontVariant: ['tabular-nums'], marginTop: 4 },
  source: { marginTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  form: { marginTop: spacing.xl },
});
