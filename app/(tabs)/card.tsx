import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { ConfirmSheet } from '../../src/components/ConfirmSheet';
import {
  Badge,
  Banner,
  Button,
  Card,
  ErrorView,
  KeyValue,
  LoadingView,
} from '../../src/components/ui';
import { useAsync, useMutation } from '../../src/hooks/useAsync';
import { useFundingConfig } from '../../src/hooks/useRate';
import {
  createCard,
  fetchCardIssuanceQuote,
  fetchCards,
  setCardFrozen,
} from '../../src/services/cards';
import { formatBrix, formatDateTime, maskCard } from '../../src/utils/format';
import { colors, radius, spacing, typography } from '../../src/theme';

/**
 * BRIX Card.
 *
 * The card here is the existing INTERNAL PRE-APPROVAL card. The backend returns
 * a masked identifier only, so this screen never renders a PAN, a CVV, an expiry
 * or a network logo — doing so would be inventing functionality the backend does
 * not expose. Fees are read from the issuance quote, with /funding-config.php as
 * the documented second source.
 */
export default function CardScreen() {
  const { t } = useTranslation();
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [confirmFreeze, setConfirmFreeze] = useState<null | { id: string; frozen: boolean }>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cards = useAsync((signal) => fetchCards(signal), []);
  const quote = useAsync((signal) => fetchCardIssuanceQuote(signal), []);
  const config = useFundingConfig();

  const issue = useMutation(async () => createCard());
  const freeze = useMutation(async (args: { id: string; frozen: boolean }) =>
    setCardFrozen(args.id, args.frozen),
  );

  const card = cards.data?.[0] ?? null;
  const endpointUnavailable =
    cards.error?.kind === 'notFound' || cards.error?.kind === 'unverifiedEndpoint';

  // Fee resolution order: per-user issuance quote -> live funding config -> —.
  const issuanceFee =
    quote.data?.cardIssuanceFeeBrix ??
    config.data?.data.card_issuance_fee_brix ??
    null;
  const transactionFee =
    quote.data?.transactionFeeBrix ??
    config.data?.data.transaction_fee_brix ??
    null;

  const onIssue = async () => {
    setActionError(null);
    const result = await issue.submit(undefined);
    if (!result && issue.error) {
      setActionError(issue.error.message);
      return;
    }
    setConfirmIssue(false);
    await cards.reload();
  };

  const onFreeze = async () => {
    if (!confirmFreeze) return;
    setActionError(null);
    const done = await freeze.submit(confirmFreeze);
    if (done === null && freeze.error) {
      setActionError(freeze.error.message);
      return;
    }
    setConfirmFreeze(null);
    await cards.reload();
  };

  return (
    <>
      <AppHeader title={t('card.title')} subtitle={t('card.subtitle')} large />
      <ScreenScroll onRefresh={cards.refresh} refreshing={cards.refreshing}>
        {cards.loading ? (
          <Card style={styles.pad}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : cards.error ? (
          <Card>
            <ErrorView
              title={endpointUnavailable ? t('errors.endpointUnavailable') : t('errors.loadFailed')}
              message={`${t(cards.error.messageKey)} ${cards.error.message}`}
              onRetry={cards.reload}
              retryLabel={t('common.retry')}
              endpointUnavailable={endpointUnavailable}
            />
          </Card>
        ) : card ? (
          <>
            <View style={styles.cardVisual}>
              <View style={styles.cardTop}>
                <Text style={styles.cardBrand}>BRIX</Text>
                <Badge
                  label={card.frozen ? t('card.freezeCard') : (card.status ?? 'ACTIVE')}
                  tone={card.frozen ? 'danger' : 'success'}
                />
              </View>
              <Text style={styles.cardNumber}>{maskCard(card.maskedNumber)}</Text>
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardCaption}>{t('card.cardHolder')}</Text>
                  <Text style={styles.cardHolder}>{card.holderName ?? '—'}</Text>
                </View>
                <View>
                  <Text style={styles.cardCaption}>{t('card.cardStatus')}</Text>
                  <Text style={styles.cardHolder}>{card.status ?? '—'}</Text>
                </View>
              </View>
            </View>

            <Card style={styles.details}>
              <KeyValue label={t('card.cardNumber')} value={maskCard(card.maskedNumber)} mono />
              <KeyValue label={t('card.cardStatus')} value={card.status ?? '—'} />
              <KeyValue label={t('wallet.updatedAt')} value={formatDateTime(card.issuedAt)} />
            </Card>

            <View style={styles.actions}>
              <Button
                label={card.frozen ? t('card.unfreezeCard') : t('card.freezeCard')}
                onPress={() => setConfirmFreeze({ id: card.id, frozen: !card.frozen })}
                variant="secondary"
                icon={card.frozen ? 'lock-open' : 'ac-unit'}
                style={styles.action}
              />
              <Button
                label={t('cardToCard.title')}
                onPress={() => router.push('/card-to-card')}
                variant="secondary"
                icon="swap-horiz"
                style={styles.action}
              />
            </View>
          </>
        ) : (
          <Card style={styles.issueCard}>
            <View style={styles.issueIcon}>
              <MaterialIcons name="credit-card" size={28} color={colors.gold} />
            </View>
            <Text style={styles.issueTitle}>{t('card.noCard')}</Text>
            <Text style={styles.issueBody}>{t('card.noCardBody')}</Text>
          </Card>
        )}

        <Card style={styles.fees}>
          <Text style={styles.feesTitle}>{t('card.title')}</Text>
          <KeyValue
            label={t('card.cardIssuanceFee')}
            value={issuanceFee !== null ? `${formatBrix(issuanceFee)} BRIX` : '—'}
          />
          <KeyValue
            label={t('card.transactionFee')}
            value={transactionFee !== null ? `${formatBrix(transactionFee)} BRIX` : '—'}
          />
          {config.data?.source === 'fallback' || quote.data === null ? (
            <Text style={styles.sourceNote}>
              {t('rates.fallbackNotice')} — {config.data?.source === 'fallback' ? config.data.reason : ''}
            </Text>
          ) : null}
        </Card>

        {!card ? (
          <Button
            label={t('card.issueCard')}
            onPress={() => setConfirmIssue(true)}
            size="lg"
            loading={issue.loading}
            icon="add-card"
          />
        ) : null}

        <Banner tone="info" icon="info-outline" body={t('card.maskedNotice')} />
      </ScreenScroll>

      <ConfirmSheet
        visible={confirmIssue}
        title={t('card.issueCard')}
        subtitle={t('card.noCardBody')}
        rows={[
          { label: t('card.cardIssuanceFee'), value: issuanceFee !== null ? `${formatBrix(issuanceFee)} BRIX` : '—', emphasize: true },
          { label: t('card.transactionFee'), value: transactionFee !== null ? `${formatBrix(transactionFee)} BRIX` : '—' },
        ]}
        confirmLabel={t('card.issueCard')}
        cancelLabel={t('common.cancel')}
        onConfirm={onIssue}
        onCancel={() => {
          setConfirmIssue(false);
          setActionError(null);
        }}
        loading={issue.loading}
        errorMessage={actionError}
      />

      <ConfirmSheet
        visible={confirmFreeze !== null}
        title={confirmFreeze?.frozen ? t('card.freezeCard') : t('card.unfreezeCard')}
        rows={[{ label: t('card.cardNumber'), value: maskCard(card?.maskedNumber) }]}
        confirmLabel={confirmFreeze?.frozen ? t('card.freezeCard') : t('card.unfreezeCard')}
        onConfirm={onFreeze}
        onCancel={() => {
          setConfirmFreeze(null);
          setActionError(null);
        }}
        loading={freeze.loading}
        tone={confirmFreeze?.frozen ? 'danger' : 'gold'}
        icon={confirmFreeze?.frozen ? 'ac-unit' : 'lock-open'}
        errorMessage={actionError}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pad: { paddingVertical: spacing.xl },
  cardVisual: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: spacing.lg,
    minHeight: 186,
    justifyContent: 'space-between',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBrand: { ...typography.heading, color: colors.gold, letterSpacing: 2.4 },
  cardNumber: {
    ...typography.title,
    color: colors.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginVertical: spacing.lg,
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  cardCaption: { ...typography.micro, color: colors.textFaint, textTransform: 'uppercase' },
  cardHolder: { ...typography.bodyStrong, color: colors.textSecondary },
  details: { marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.lg },
  action: { flex: 1 },
  issueCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, marginBottom: spacing.lg },
  issueIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: colors.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(202,166,90,0.10)',
  },
  issueTitle: { ...typography.heading, color: colors.text },
  issueBody: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  fees: { marginBottom: spacing.lg },
  feesTitle: { ...typography.heading, color: colors.text, marginBottom: 4 },
  sourceNote: { ...typography.caption, color: colors.warning, marginTop: spacing.sm },
});
