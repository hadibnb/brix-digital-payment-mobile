import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '../../src/components/AppHeader';
import { Banner, Button, TextField } from '../../src/components/ui';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useMutation } from '../../src/hooks/useAsync';
import { requestPasswordReset, resetPassword } from '../../src/services/auth';
import {
  validateEmail,
  validatePassword,
  validateVerificationCode,
} from '../../src/utils/validation';
import { colors, spacing, typography } from '../../src/theme';

/**
 * Forgot password — two steps, matching the web client's `#forgotStep1`
 * (email) and `#forgotStep2` (`#forgotCode` + `#forgotNewPassword`), both
 * posted to /password-reset.php with action 'request' | 'reset'.
 */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const requestMutation = useMutation(async (value: string) => requestPasswordReset(value));
  const resetMutation = useMutation(async (args: { email: string; code: string; newPassword: string }) =>
    resetPassword(args),
  );

  const onRequest = async () => {
    const check = validateEmail(email);
    if (!check.ok) {
      setErrors({ email: t(check.messageKey) });
      return;
    }
    setErrors({});
    const ok = await requestMutation.submit(email.trim());
    if (ok) setStep(2);
  };

  const onReset = async () => {
    const next: Record<string, string | undefined> = {};
    const codeCheck = validateVerificationCode(code);
    const pwCheck = validatePassword(newPassword);
    if (!codeCheck.ok) next.code = t(codeCheck.messageKey);
    if (!pwCheck.ok) next.newPassword = t(pwCheck.messageKey);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const ok = await resetMutation.submit({ email: email.trim(), code: code.trim(), newPassword });
    if (!ok) return;
    router.replace('/(auth)/sign-in');
  };

  return (
    <>
      <AppHeader
        title={t('auth.forgotTitle')}
        subtitle={t('auth.forgotSubtitle')}
        showBack
        onBack={() => (step === 2 ? setStep(1) : router.back())}
      />
      <ScreenScroll>
        {step === 1 ? (
          <>
            <TextField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
              editable={!requestMutation.loading}
              onSubmitEditing={onRequest}
              returnKeyType="go"
            />

            {requestMutation.error ? (
              <Banner
                tone="danger"
                icon="error-outline"
                title={t(requestMutation.error.messageKey)}
                body={requestMutation.error.message}
              />
            ) : null}

            <Button
              label={t('auth.sendResetCode')}
              onPress={onRequest}
              size="lg"
              loading={requestMutation.loading}
              icon="mail-outline"
            />
          </>
        ) : (
          <>
            <Banner tone="success" icon="mark-email-read" title={t('auth.resetSent')} body={email} />

            <TextField
              label={t('auth.verificationCode')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              error={errors.code}
              maxLength={8}
              editable={!resetMutation.loading}
            />
            <TextField
              label={t('auth.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              error={errors.newPassword}
              hint={t('auth.passwordHint')}
              editable={!resetMutation.loading}
              onSubmitEditing={onReset}
              returnKeyType="go"
            />

            {resetMutation.error ? (
              <Banner
                tone="danger"
                icon="error-outline"
                title={t(resetMutation.error.messageKey)}
                body={resetMutation.error.message}
              />
            ) : null}

            <Button
              label={t('auth.resetPassword')}
              onPress={onReset}
              size="lg"
              loading={resetMutation.loading}
              icon="lock-reset"
            />
          </>
        )}

        <View style={styles.backRow}>
          <Button label={t('auth.backToLogin')} onPress={() => router.replace('/(auth)/sign-in')} variant="ghost" />
        </View>
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  backRow: { marginTop: spacing.lg },
});
