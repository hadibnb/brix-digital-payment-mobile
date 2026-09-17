import React, { useCallback } from 'react';
import { Image, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { Badge, Banner, Button, Card, KeyValue, LoadingView } from '../src/components/ui';
import { useAsync } from '../src/hooks/useAsync';
import { fetchWallet } from '../src/services/wallet';
import { QR_RENDER_BASE } from '../src/config/env';
import { useAuthStore } from '../src/state/authStore';
import { colors, radius, spacing, typography } from '../src/theme';

/**
 * Receive.
 *
 * Uses the platform share sheet and clipboard (real native APIs) rather than a
 * custom in-app imitation. The QR image is produced by the same external
 * renderer the web client uses (`api.qrserver.com/v1/create-qr-code`), with the
 * payload built from this user's receive identity.
 */
export default function ReceiveScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const wallet = useAsync((signal) => fetchWallet(signal), []);
  const [copied, setCopied] = React.useState<string | null>(null);

  const receiveId =
    wallet.data?.accountNumber ?? wallet.data?.walletId ?? user?.id ?? user?.email ?? null;

  const payload = receiveId ? `brix:${receiveId}` : null;
  const qrUrl = payload
    ? `${QR_RENDER_BASE}?size=520x520&data=${encodeURIComponent(payload)}`
    : null;

  const copy = useCallback(async (value: string, key: string) => {
    await Clipboard.setStringAsync(value);
    void Haptics.selectionAsync().catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const share = useCallback(async () => {
    if (!receiveId) return;
    await Share.share({
      title: t('receive.title'),
      message: `${t('receive.shareMessage')}: ${receiveId}`,
    });
  }, [receiveId, t]);

  return (
    <>
      <AppHeader title={t('receive.title')} subtitle={t('receive.subtitle')} showBack onBack={() => router.back()} />
      <ScreenScroll>
        {wallet.loading ? (
          <Card style={styles.pad}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : (
          <>
            <Card style={styles.qrCard}>
              {qrUrl ? (
                <Image source={{ uri: qrUrl }} style={styles.qr} resizeMode="contain" />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderText}>{t('receive.qrUnavailable')}</Text>
                </View>
              )}
              <Badge label="BRIX" tone="gold" />
            </Card>

            <Card style={styles.details}>
              <KeyValue label={t('receive.yourReceiveId')} value={receiveId ?? '—'} mono />
              <KeyValue label={t('wallet.walletId')} value={wallet.data?.walletId ?? '—'} mono />
            </Card>

            <View style={styles.actions}>
              <Button
                label={copied === 'id' ? t('common.copied') : t('receive.copyId')}
                onPress={() => receiveId && void copy(receiveId, 'id')}
                variant="secondary"
                icon="content-copy"
                disabled={!receiveId}
                style={styles.action}
              />
              <Button
                label={t('common.share')}
                onPress={() => void share()}
                icon="share"
                disabled={!receiveId}
                style={styles.action}
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
          </>
        )}

        <Banner tone="gold" icon="info-outline" title={t('dashboard.internalLedger')} body={t('dashboard.preApprovalBody')} />
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { paddingVertical: spacing.xl },
  qrCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  qr: { width: 232, height: 232, borderRadius: radius.md, backgroundColor: colors.white },
  qrPlaceholder: {
    width: 232,
    height: 232,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  qrPlaceholderText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  details: { marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  action: { flex: 1 },
});
