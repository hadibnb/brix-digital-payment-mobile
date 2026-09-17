import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppHeader } from '../src/components/AppHeader';
import { Badge, Button, Card } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';

/**
 * QR scanner.
 *
 * Real camera integration with an explicit permission gate: the permission is
 * requested on demand and the failure path is a real, actionable screen — never
 * a dead viewfinder. A scan is debounced so one QR code cannot fire the handler
 * dozens of times while it stays in frame.
 */
export default function ScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onScanned = useCallback(
    ({ data }: { data: string }) => {
      // Guard against the burst of callbacks while the code remains in frame.
      if (handled || !data) return;
      setHandled(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // Hand the raw code back to Pay, which resolves it against the backend.
      const code = extractCode(data);
      router.replace({ pathname: '/pay', params: { scanned: code, ts: String(Date.now()) } });
    },
    [handled],
  );

  if (!permission) {
    return (
      <>
        <AppHeader title={t('pay.scanQr')} showBack onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.body}>{t('common.loading')}</Text>
        </View>
      </>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <AppHeader title={t('pay.scanQr')} showBack onBack={() => router.back()} />
        <View style={styles.center}>
          <Card style={styles.permissionCard}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="no-photography" size={28} color={colors.danger} />
            </View>
            <Text style={styles.title}>{t('pay.cameraPermission')}</Text>
            <Text style={styles.body}>{t('pay.cameraPermissionBody')}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={t('pay.grantPermission')}
              onPress={async () => {
                setError(null);
                const result = await requestPermission();
                if (!result.granted) {
                  setError(
                    'Camera access was denied. Enable it in your device settings to scan QR codes.',
                  );
                }
              }}
              size="lg"
              icon="camera-alt"
              style={styles.action}
            />
            <Button label={t('pay.enterCode')} onPress={() => router.back()} variant="ghost" />
          </Card>
        </View>
      </>
    );
  }

  return (
    <View style={styles.flex}>
      <AppHeader title={t('pay.scanQr')} showBack onBack={() => router.back()} />
      <View style={styles.viewfinder}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handled ? undefined : onScanned}
        />
        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={styles.hintWrap} pointerEvents="none">
          <Badge label={t('pay.scanning')} tone="gold" />
        </View>
      </View>

      <View style={styles.footer}>
        <Button label={t('pay.enterCode')} onPress={() => router.back()} variant="secondary" icon="keyboard" />
        {handled ? (
          <Button
            label={t('common.retry')}
            onPress={() => setHandled(false)}
            variant="ghost"
            icon="refresh"
          />
        ) : null}
      </View>
    </View>
  );
}

/** Accepts a raw code, a brix: URI, or a URL carrying a code parameter. */
function extractCode(data: string): string {
  const trimmed = data.trim();
  if (trimmed.toLowerCase().startsWith('brix:')) return trimmed.slice(5);
  try {
    const url = new URL(trimmed);
    const fromQuery =
      url.searchParams.get('code') ?? url.searchParams.get('id') ?? url.searchParams.get('pay');
    if (fromQuery) return fromQuery;
    const last = url.pathname.split('/').filter(Boolean).pop();
    if (last) return last;
  } catch {
    // Not a URL — fall through and use the raw value.
  }
  return trimmed;
}

const CORNER = 26;
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.navy },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permissionCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, width: '100%' },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(216,107,107,0.4)',
  },
  title: { ...typography.heading, color: colors.text, textAlign: 'center' },
  body: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.md },
  viewfinder: { flex: 1, overflow: 'hidden' },
  frame: { ...StyleSheet.absoluteFillObject, margin: 48 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.gold },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  hintWrap: { position: 'absolute', bottom: spacing.xxl, alignSelf: 'center' },
  footer: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.base },
});

void radius;
