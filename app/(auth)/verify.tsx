import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/AppHeader';
import { Banner, Button, TextField } from '../../src/components/ui';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useMutation } from '../../src/hooks/useAsync';
import { beginVerification, requestBaleVerification, verifyCode } from '../../src/services/auth';
import { validateVerificationCode } from '../../src/utils/validation';
import { colors, radius, spacing, typography } from '../../src/theme';

type Step = 'email' | 'phone' | 'bale';

/**
 * Verification: email -> phone, with the optional Bale messenger channel that
 * the web client exposes (`#openBaleVerificationBtn`, `bale-request.php`).
 *
 * "Resend" and "Verify" always issue a real request; there is no local pretend
 * success. A backend failure is shown with its actual message.
 */
export default function VerifyScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string; channel?: string }>();

  const [step, setStep] = useState<Step>((params.channel as Step) ?? 'email');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();

  const sendMutation = useMutation(async (channel: 'email' | 'phone' | 'bale') =>
    beginVerification(channel === 'bale' ? 'email' : channel, params.email),
  );
  const verifyMutation = useMutation(async (args: { code: string; channel: Step }) => {
    if (args.channel === 'bale') return requestBaleVerification(params.email);
    return verifyCode({ code: args.code, email: params.email, channel: args.channel });
  });

  // Kick off the first code automatically — that is what the user expects after
  // arriving here from registration.
  useEffect(() => {
    void sendMutation.submit(params.channel === 'phone' ? 'phone' : 'email');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onVerify = async () => {
    const check = validateVerificationCode(code);
    if (!check.ok) {
      setCodeError(t(check.messageKey));
      return;
    }
    setCodeError(undefined);
    const ok = await verifyMutation.submit({ code, channel: step });
    if (!ok) return;

    if (step === 'email') {
      setStep('phone');
      setCode('');
      await sendMutation.submit('phone');
      return;
    }
    if (step === 'phone') {
      // Phone verified — offer the optional Bale channel before finishing.
      setStep('bale');
      return;
    }
    router.replace('/(auth)/sign-in');
  };

  const title =
    step === 'email'
      ? t('auth.emailVerification')
      : step === 'phone'
        ? t('auth.phoneVerification')
        : t('auth.baleVerification');

  return (
    <>
      <AppHeader title={title} subtitle={t('auth.verificationSubtitle')} showBack onBack={() => router.back()} />
      <ScreenScroll>
        <View style={styles.steps}>
          {(['email', 'phone', 'bale'] as Step[]).map((s, i) => {
            const done = (['email', 'phone', 'bale'] as Step[]).indexOf(step) > i;
            const active = step === s;
            return (
              <View key={s} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    active && styles.stepDotActive,
                    done && styles.stepDotDone,
                  ]}
                >
                  <MaterialIcons
                    name={done ? 'check' : 'circle'}
                    size={done ? 14 : 8}
                    color={done ? '#0b1220' : active ? colors.gold : colors.textFaint}
                  />
                </View>
                <Text style={[styles.stepLabel, active && { color: colors.text }]}>
                  {s === 'email'
                    ? t('auth.emailVerification')
                    : s === 'phone'
                      ? t('auth.phoneVerification')
                      : t('auth.baleVerification')}
                </Text>
              </View>
            );
          })}
        </View>

        {step === 'bale' ? (
          <Banner
            tone="info"
            icon="chat"
            title={t('auth.baleVerification')}
            body="Confirmation is sent through the Bale messenger."
            actionLabel={t('auth.openBale')}
            onAction={() => void verifyMutation.submit({ code: '0', channel: 'bale' })}
          />
        ) : (
          <>
            <TextField
              label={t('auth.verificationCode')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              error={codeError}
              maxLength={8}
              editable={!verifyMutation.loading}
              onSubmitEditing={onVerify}
              returnKeyType="go"
            />

            {verifyMutation.error ? (
              <Banner
                tone="danger"
                icon="error-outline"
                title={t(verifyMutation.error.messageKey)}
                body={verifyMutation.error.message}
              />
            ) : null}
            {sendMutation.error ? (
              <Banner
                tone="warning"
                icon="error-outline"
                title={t('errors.loadFailed')}
                body={sendMutation.error.message}
                actionLabel={t('auth.resendCode')}
                onAction={() => void sendMutation.submit(step === 'phone' ? 'phone' : 'email')}
              />
            ) : null}

            <Button
              label={t('auth.verify')}
              onPress={onVerify}
              size="lg"
              loading={verifyMutation.loading}
              icon="verified"
            />
          </>
        )}

        <View style={styles.resendRow}>
          <Button
            label={t('auth.resendCode')}
            onPress={() => void sendMutation.submit(step === 'phone' ? 'phone' : 'email')}
            variant="ghost"
            loading={sendMutation.loading}
            icon="refresh"
          />
        </View>

        <View style={styles.skipRow}>
          <Button
            label={t('common.done')}
            onPress={() => router.replace('/(auth)/sign-in')}
            variant="ghost"
          />
        </View>
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { borderColor: colors.gold },
  stepDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepLabel: { ...typography.micro, color: colors.textFaint, flexShrink: 1 },
  resendRow: { marginTop: spacing.lg },
  skipRow: { marginTop: spacing.sm },
});
