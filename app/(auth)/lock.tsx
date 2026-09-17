import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { BrandLockup } from '../../src/components/Logo';
import { Button, ErrorView } from '../../src/components/ui';
import { useAuthStore } from '../../src/state/authStore';
import { colors, radius, spacing, typography } from '../../src/theme';

/**
 * Biometric / passcode lock screen.
 *
 * This screen appears when biometric unlock is enabled and the app has been
 * backgrounded. It gates LOCAL access to an already-established backend
 * session; it is not a second authentication system and it never stores or
 * verifies a password itself.
 */
export default function LockScreen() {
  const { t } = useTranslation();
  const unlock = useAuthStore((s) => s.unlockWithBiometrics);
  const signOut = useAuthStore((s) => s.signOut);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const attempt = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await unlock();
      if (ok) router.replace('/(tabs)');
      else setError('Biometric authentication was not completed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Biometric authentication failed.');
    } finally {
      setBusy(false);
    }
  }, [busy, unlock]);

  // Offer the prompt immediately — that is why the user opened the app.
  useEffect(() => {
    void attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <BrandLockup size={54} />
      </View>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="fingerprint" size={40} color={colors.gold} />
        </View>
        <Text style={styles.title}>BRIX is locked</Text>
        <Text style={styles.body}>Confirm your biometrics to access your wallet and payments.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button label="Unlock" onPress={attempt} size="lg" loading={busy} icon="lock-open" />
        <Button label={t('common.signOut')} onPress={onSignOut} variant="ghost" icon="logout" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.base, padding: spacing.xl, justifyContent: 'space-between' },
  top: { alignItems: 'center', marginTop: spacing.xxxl },
  center: { alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.goldDeep,
    backgroundColor: 'rgba(202,166,90,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.title, color: colors.text },
  body: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(216,107,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(216,107,107,0.4)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorText: { ...typography.caption, color: colors.dangerSoft, flexShrink: 1 },
  actions: { gap: spacing.md, marginBottom: spacing.xl },
});

// ErrorView is imported to keep the same failure surface available if the lock
// screen ever needs to render a blocking error; referenced here deliberately.
void ErrorView;
