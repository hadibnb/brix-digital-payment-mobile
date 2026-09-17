import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '../../src/components/AppHeader';
import { Banner, Button, TextField } from '../../src/components/ui';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useMutation } from '../../src/hooks/useAsync';
import { register } from '../../src/services/auth';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  validateIdentifier,
} from '../../src/utils/validation';
import { colors, spacing, typography } from '../../src/theme';

/**
 * Registration.
 *
 * The web flow is multi-step: create the account, then verify email and phone.
 * The mobile flow preserves that shape — this screen creates the account and
 * hands off to /(auth)/verify, which uses /account-verification.php with the
 * same `action` values the web client sends.
 */
export default function RegisterScreen() {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const mutation = useMutation(
    async (args: { fullName: string; email: string; phone: string; country?: string; password: string }) =>
      register(args),
  );

  const onSubmit = async () => {
    if (!fullName.trim()) {
      setErrors({ fullName: t('validation.required') });
      return;
    }
    const checks: Array<[string, { ok: boolean; messageKey?: string }]> = [
      ['email', validateEmail(email)],
      ['phone', validatePhone(phone)],
      ['password', validatePassword(password)],
      ['confirmPassword', validatePasswordMatch(password, confirmPassword)],
    ];

    const next: Record<string, string | undefined> = {};
    checks.forEach(([field, result]) => {
      if (!result.ok && result.messageKey) next[field] = t(result.messageKey);
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = await mutation.submit({ fullName, email, phone, country: country || undefined, password });
    if (!result) return;

    router.push({
      pathname: '/(auth)/verify',
      params: { email: email.trim(), channel: 'email' },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader
        title={t('auth.register')}
        subtitle={t('auth.registerSubtitle')}
        showBack
        onBack={() => router.back()}
      />
      <ScreenScroll>
        <TextField
          label={t('auth.fullName')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          error={errors.fullName}
          editable={!mutation.loading}
        />
        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          error={errors.email}
          editable={!mutation.loading}
        />
        <TextField
          label={t('auth.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errors.phone}
          hint="+971 5X XXX XXXX"
          editable={!mutation.loading}
        />
        <TextField
          label={`${t('auth.country')} (${t('common.optional')})`}
          value={country}
          onChangeText={(v) => setCountry(v.toUpperCase())}
          autoCapitalize="characters"
          hint="AE, OM, CN, …"
          maxLength={2}
          editable={!mutation.loading}
        />
        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          error={errors.password}
          hint={t('auth.passwordHint')}
          editable={!mutation.loading}
        />
        <TextField
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          error={errors.confirmPassword}
          editable={!mutation.loading}
        />

        {mutation.error ? (
          <Banner
            tone="danger"
            icon="error-outline"
            title={t(mutation.error.messageKey)}
            body={mutation.error.message}
          />
        ) : null}

        <Button
          label={t('auth.registerButton')}
          onPress={onSubmit}
          size="lg"
          loading={mutation.loading}
          icon="person-add"
        />

        <View style={styles.bottom}>
          <Text style={styles.bottomText}>{t('auth.haveAccount')}</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>{t('auth.signIn')}</Text>
            </Pressable>
          </Link>
        </View>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  bottomText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.bodyStrong, color: colors.gold },
});
