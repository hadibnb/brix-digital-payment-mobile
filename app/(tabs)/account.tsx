import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { LanguageCurrencyBar } from '../../src/components/LanguageCurrencyBar';
import { PickerSheet } from '../../src/components/PickerSheet';
import { Badge, Banner, Button, Card, KeyValue, ListRow } from '../../src/components/ui';
import { useAsync } from '../../src/hooks/useAsync';
import { useAuthStore } from '../../src/state/authStore';
import { logout } from '../../src/services/auth';
import { fetchAccount } from '../../src/services/wallet';
import { API_BASE_URL, API_GATEWAY_PATH, APP_VERSION } from '../../src/config/env';
import { colors, spacing, typography } from '../../src/theme';

/**
 * Account.
 *
 * Profile, verification status, security settings (biometric unlock), language,
 * currency, integration status and logout — the same surface the web
 * `settings` view exposes, re-organised for mobile.
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const biometricAvailable = useAuthStore((s) => s.biometricAvailable);
  const enableBiometrics = useAuthStore((s) => s.enableBiometrics);
  const disableBiometrics = useAuthStore((s) => s.disableBiometrics);

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  const account = useAsync((signal) => fetchAccount(signal), []);

  const onSignOut = async () => {
    await logout();
    await signOut();
    setConfirmSignOut(false);
    router.replace('/(auth)/sign-in');
  };

  const onToggleBiometric = async () => {
    setBiometricError(null);
    if (biometricEnabled) {
      await disableBiometrics();
      return;
    }
    const ok = await enableBiometrics();
    if (!ok) {
      setBiometricError(
        biometricAvailable
          ? 'Biometric confirmation was not completed.'
          : 'No biometric or device passcode is enrolled on this device.',
      );
    }
  };

  const email = user?.email ?? String(account.data?.email ?? '—');
  const phone = user?.phone ?? String(account.data?.phone ?? '—');

  return (
    <>
      <AppHeader title={t('account.title')} subtitle={t('account.profile')} showBack onBack={() => router.back()} />
      <ScreenScroll onRefresh={account.refresh} refreshing={account.refreshing}>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={26} color={colors.gold} />
          </View>
          <Text style={styles.name}>{user?.fullName ?? user?.name ?? t('account.profile')}</Text>
          <Text style={styles.sub}>{user?.id ?? ''}</Text>
        </Card>

        <Text style={styles.groupLabel}>{t('account.profile')}</Text>
        <Card style={styles.group}>
          <KeyValue label={t('account.email')} value={email} />
          <KeyValue label={t('account.phone')} value={phone} />
          <KeyValue label={t('account.verificationStatus')} value={
            user?.emailVerified || user?.phoneVerified ? t('account.verified') : t('account.unverified')
          } />
          <View style={styles.badges}>
            <Badge
              label={t('auth.emailVerification')}
              tone={user?.emailVerified ? 'success' : 'neutral'}
            />
            <Badge
              label={t('auth.phoneVerification')}
              tone={user?.phoneVerified ? 'success' : 'neutral'}
            />
            <Badge label={t('auth.baleVerification')} tone={user?.baleVerified ? 'success' : 'neutral'} />
          </View>
          <Button
            label={t('auth.verificationTitle')}
            onPress={() => router.push('/(auth)/verify')}
            variant="secondary"
            icon="verified"
            style={styles.verifyBtn}
          />
        </Card>

        <Text style={styles.groupLabel}>{t('account.security')}</Text>
        <Card style={styles.group}>
          <ListRow
            icon="fingerprint"
            title={t('account.biometric')}
            subtitle={biometricAvailable ? t('account.enableBiometric') : 'Not available on this device'}
            value={biometricEnabled ? t('common.done') : '—'}
            onPress={onToggleBiometric}
            tone={biometricEnabled ? 'success' : 'neutral'}
          />
          {biometricError ? <Text style={styles.error}>{biometricError}</Text> : null}
        </Card>

        <Text style={styles.groupLabel}>{t('common.language')} · {t('common.currency')}</Text>
        <LanguageCurrencyBar />

        <Text style={styles.groupLabel}>{t('account.about')}</Text>
        <Card style={styles.group}>
          <KeyValue label={t('account.version')} value={APP_VERSION} />
          <KeyValue label="API" value={`${API_BASE_URL}${API_GATEWAY_PATH}`} mono />
          <KeyValue label={t('account.preApproval')} value={t('dashboard.internalLedger')} />
        </Card>

        <Banner tone="gold" icon="shield" title={t('dashboard.preApprovalNotice')} body={t('dashboard.preApprovalBody')} />

        <Button
          label={t('common.signOut')}
          onPress={() => setConfirmSignOut(true)}
          variant="danger"
          icon="logout"
          style={styles.signOut}
        />
      </ScreenScroll>

      <PickerSheet
        visible={confirmSignOut}
        title={t('account.signOutConfirm')}
        options={[
          { value: 'confirm', label: t('common.signOut'), caption: t('account.signOutBody') },
          { value: 'cancel', label: t('common.cancel') },
        ]}
        selectedValue="cancel"
        onSelect={(value) => {
          if (value === 'confirm') void onSignOut();
        }}
        onClose={() => setConfirmSignOut(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: 6, paddingVertical: spacing.xl },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(202,166,90,0.12)',
    borderWidth: 1,
    borderColor: colors.goldDeep,
    marginBottom: spacing.sm,
  },
  name: { ...typography.title, color: colors.text },
  sub: { ...typography.caption, color: colors.textMuted },
  groupLabel: {
    ...typography.micro,
    color: colors.textFaint,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  group: { paddingHorizontal: spacing.lg },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm },
  verifyBtn: { marginTop: spacing.md },
  error: { ...typography.caption, color: colors.danger, paddingBottom: spacing.md },
  signOut: { marginTop: spacing.xl },
});
