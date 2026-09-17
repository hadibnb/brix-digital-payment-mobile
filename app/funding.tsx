import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { ConfirmSheet } from '../src/components/ConfirmSheet';
import { RateBadge } from '../src/components/RateBadge';
import { AmountInput, Badge, Banner, Button, Card, KeyValue, LoadingView, TextField } from '../src/components/ui';
import { useMutation } from '../src/hooks/useAsync';
import { useFundingConfig, useRate } from '../src/hooks/useRate';
import { submitFundingRequest } from '../src/services/payments';
import { useUiStore } from '../src/state/uiStore';
import { formatBrix, formatLocal, localToBrix, toNumber } from '../src/utils/format';
import { colors, radius, spacing, typography } from '../src/theme';

/**
 * Fund BRIX.
 *
 * The existing system distinguishes two very different things and so does this
 * screen, explicitly:
 *
 *   • USDC funding — an external transfer used to top up the account. The
 *     wallet address comes from /funding-config.php (`usdc_wallet`). It is a
 *     real, confirmed endpoint; when the operator has not configured a wallet
 *     yet the field is shown as "not configured" rather than faked.
 *
 *   • Internal BRIX ledger balance — what actually increases after BRIX
 *     operations reviews the submitted proof. BRIX itself is NOT presented as a
 *     public blockchain token anywhere in this flow.
 *
 * The request is a *review* request (`#fundingProof` on the web), so the UI
 * never claims the balance changed.
 */
export default function FundingScreen() {
  const { t } = useTranslation();
  const currency = useUiStore((s) => s.currency);

  const [method, setMethod] = useState<'usdc' | 'fiat'>('usdc');
  const [amountLocal, setAmountLocal] = useState('');
  const [phone, setPhone] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const config = useFundingConfig();
  const rate = useRate(params_currency(currency));

  const mutation = useMutation(async (args: {
    amountLocal?: string;
    currency?: string;
    phone?: string;
    proofUri?: string;
    method: 'usdc' | 'fiat';
  }) => submitFundingRequest(args));

  const localAmountNumber = toNumber(amountLocal);
  const estimatedBrix = localToBrix(localAmountNumber, rate.data?.data.brix_local ?? null);

  const copy = useCallback(async (value: string, key: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const attachProof = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSubmitError('Photo access is required to attach a payment proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setProofUri(result.assets[0].uri);
  }, []);

  const onConfirm = async () => {
    setSubmitError(null);
    const result = await mutation.submit({
      amountLocal: amountLocal || undefined,
      currency,
      phone: phone || undefined,
      proofUri: proofUri ?? undefined,
      method,
    });
    if (!result) {
      setSubmitError(mutation.error?.message ?? t('errors.generic'));
      return;
    }
    setConfirmOpen(false);
    router.replace({
      pathname: '/receipt',
      params: {
        kind: 'funding',
        status: 'pending',
        amount: amountLocal ? `${amountLocal} ${currency}` : '',
        recipient: method === 'usdc' ? t('funding.usdcFunding') : t('funding.iranSheba'),
        reference: result.reference ?? '',
      },
    });
  };

  const usdcWallet = config.data?.data.usdc_wallet ?? '';
  const sheba = config.data?.data.iran_sheba ?? '';
  const usdReference = config.data?.data.brix_usd_reference ?? null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        title={t('funding.title')}
        subtitle={t('funding.subtitle')}
        showBack
        onBack={() => router.back()}
      />
      <ScreenScroll>
        <View style={styles.tabs}>
          <Text
            onPress={() => setMethod('usdc')}
            style={[styles.tab, method === 'usdc' && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: method === 'usdc' }}
          >
            {t('funding.usdcFunding')}
          </Text>
          <Text
            onPress={() => setMethod('fiat')}
            style={[styles.tab, method === 'fiat' && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: method === 'fiat' }}
          >
            {t('funding.iranSheba')}
          </Text>
        </View>

        {config.loading ? (
          <Card style={styles.pad}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : (
          <Card style={styles.methodCard}>
            {method === 'usdc' ? (
              <>
                <View style={styles.methodHead}>
                  <Badge label={t('funding.usdcFunding')} tone="gold" />
                  <Badge label="BEP20 / BSC" tone="neutral" />
                </View>
                <Text style={styles.methodLabel}>{t('funding.usdcWallet')}</Text>
                {usdcWallet ? (
                  <Text style={styles.methodValue} selectable>
                    {usdcWallet}
                  </Text>
                ) : (
                  <Text style={styles.notConfigured}>{t('funding.notConfigured')}</Text>
                )}
                {usdcWallet ? (
                  <Button
                    label={copied === 'usdc' ? t('common.copied') : t('funding.copyUsdc')}
                    onPress={() => void copy(usdcWallet, 'usdc')}
                    variant="secondary"
                    icon="content-copy"
                  />
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.methodHead}>
                  <Badge label={t('funding.iranSheba')} tone="gold" />
                </View>
                <Text style={styles.methodLabel}>{t('funding.iranSheba')}</Text>
                {sheba ? (
                  <Text style={styles.methodValue} selectable>
                    {sheba}
                  </Text>
                ) : (
                  <Text style={styles.notConfigured}>{t('funding.notConfigured')}</Text>
                )}
                {sheba ? (
                  <Button
                    label={copied === 'sheba' ? t('common.copied') : t('funding.copySheba')}
                    onPress={() => void copy(sheba, 'sheba')}
                    variant="secondary"
                    icon="content-copy"
                  />
                ) : null}
              </>
            )}
          </Card>
        )}

        <RateBadge
          rate={rate.data?.data.brix_local ?? null}
          currency={rate.data?.data.currency ?? currency}
          source={rate.data?.source ?? 'fallback'}
          statusText={`${t('funding.localExchangeRate')} · ${t('rates.live')}`}
          fallbackText={t('rates.fallbackNotice')}
        />

        <Card style={styles.reference}>
          <KeyValue
            label={t('funding.usdReference')}
            value={usdReference !== null ? String(usdReference) : '—'}
          />
          <KeyValue
            label={t('funding.localReference')}
            value={`1 BRIX = ${formatLocal(rate.data?.data.brix_local ?? null, currency, 3)}`}
          />
        </Card>

        <View style={styles.form}>
          <AmountInput
            label={t('funding.amountLocal', { currency })}
            value={amountLocal}
            onChangeText={setAmountLocal}
            suffix={currency}
          />
          <Text style={styles.estimate}>
            {t('funding.estimatedBrix')}:{' '}
            {estimatedBrix !== null ? `${formatBrix(estimatedBrix)} BRIX` : '—'}
          </Text>

          <TextField
            label={t('funding.phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Button
            label={proofUri ? t('funding.proofAttached') : t('funding.attachProof')}
            onPress={() => void attachProof()}
            variant="secondary"
            icon={proofUri ? 'check-circle' : 'attach-file'}
          />
          {proofUri ? <Text style={styles.proofUri}>{proofUri.split('/').pop()}</Text> : null}
        </View>

        {submitError ? (
          <Banner tone="danger" icon="error-outline" title={t('errors.generic')} body={submitError} />
        ) : null}

        <Button
          label={t('funding.submitRequest')}
          onPress={() => {
            setSubmitError(null);
            setConfirmOpen(true);
          }}
          size="lg"
          icon="savings"
        />

        <Banner
          tone="info"
          icon="info-outline"
          title={t('funding.distinctionTitle')}
          body={t('funding.distinctionBody')}
        />
      </ScreenScroll>

      <ConfirmSheet
        visible={confirmOpen}
        title={t('funding.submitRequest')}
        rows={[
          { label: t('common.from'), value: method === 'usdc' ? t('funding.usdcFunding') : t('funding.iranSheba') },
          { label: t('common.amount'), value: amountLocal ? `${amountLocal} ${currency}` : '—', emphasize: true },
          {
            label: t('funding.estimatedBrix'),
            value: estimatedBrix !== null ? `${formatBrix(estimatedBrix)} BRIX` : '—',
          },
          ...(phone ? [{ label: t('funding.phone'), value: phone }] : []),
          { label: t('funding.proof'), value: proofUri ? t('funding.proofAttached') : t('common.none') },
        ]}
        confirmLabel={t('funding.submitRequest')}
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setSubmitError(null);
        }}
        loading={mutation.loading}
        icon="savings"
        errorMessage={submitError}
      />
    </KeyboardAvoidingView>
  );
}

/** Keeps the rate hook keyed to the store currency without an extra module. */
function params_currency(currency: string): string {
  return currency;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  pad: { paddingVertical: spacing.xl },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    ...typography.caption,
    color: colors.textMuted,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tabActive: {
    color: colors.gold,
    borderColor: colors.gold,
    backgroundColor: 'rgba(202,166,90,0.14)',
  },
  methodCard: { gap: spacing.md },
  methodHead: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  methodLabel: { ...typography.micro, color: colors.textFaint, textTransform: 'uppercase' },
  methodValue: { ...typography.body, color: colors.text, lineHeight: 21 },
  notConfigured: { ...typography.caption, color: colors.warning },
  reference: { marginTop: spacing.lg },
  form: { marginTop: spacing.xl },
  estimate: { ...typography.caption, color: colors.gold, marginTop: -spacing.md, marginBottom: spacing.lg },
  proofUri: { ...typography.caption, color: colors.textMuted, marginTop: 6 },
});

void MaterialIcons;
