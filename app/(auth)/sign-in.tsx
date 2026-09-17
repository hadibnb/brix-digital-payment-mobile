import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { BrandLockup } from '../../src/components/Logo';
import { Banner, Button, TextField } from '../../src/components/ui';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { LanguageCurrencyBar } from '../../src/components/LanguageCurrencyBar';
import { useMutation } from '../../src/hooks/useAsync';
import { login } from '../../src/services/auth';
import { useAuthStore } from '../../src/state/authStore';
import { validateIdentifier, validatePassword } from '../../src/utils/validation';
import { colors, spacing, typography } from '../../src/theme';

/**
 * Sign in.
 *
 * Mirrors the web form exactly: a single `identifier` field (email OR phone)
 * plus `password`, posted to the existing backend. It does NOT introduce a
 * second auth system.
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ id?: string; pw?: string }>({});

  const mutation = useMutation(async (args: { identifier: string; password: string }) =>
    login(args),
  );

  const onSubmit = async () => {
    const idCheck = validateIdentifier(identifier);
    const pwCheck = validatePassword(password, 1);
    setFieldErrors({
      id: idCheck.ok ? undefined : t(idCheck.messageKey),
      pw: pwCheck.ok ? undefined : t(pwCheck.messageKey),
    });
    if (!idCheck.ok || !pwCheck.ok) return;

    const result = await mutation.submit({ identifier, password });
    if (!result) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await setSession({
      user: result.user,
      accessToken: result.accessToken ?? null,
      csrfToken: result.csrfToken ?? null,
    });
    router.replace('/(tabs)');
  };

  const error = mutation.error;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScreenScroll>
        <View style={styles.header}>
          <BrandLockup size={52} />
          <Text style={styles.kicker}>{t('auth.secureAccess')}</Text>
          <Text style={styles.title}>{t('auth.signIn')}</Text>
          <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
        </View>

        <LanguageCurrencyBar />

        <TextField
          label={t('auth.identifier')}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={t('auth.identifierPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.id}
          returnKeyType="next"
          editable={!mutation.loading}
        />

        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="password"
          error={fieldErrors.pw}
          rightIcon={showPassword ? 'visibility-off' : 'visibility'}
          onRightIconPress={() => setShowPassword((v) => !v)}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
          editable={!mutation.loading}
        />

        {error ? (
          <Banner
            tone={error.kind === 'cleartextBlocked' ? 'danger' : 'warning'}
            icon={error.isNetworkError ? 'wifi-off' : 'error-outline'}
            title={t(error.messageKey)}
            body={error.isAuthError ? undefined : error.message}
            actionLabel={error.retryable ? t('common.retry') : undefined}
            onAction={error.retryable ? () => void onSubmit() : undefined}
          />
        ) : null}

        <Button
          label={t('auth.signInButton')}
          onPress={onSubmit}
          size="lg"
          loading={mutation.loading}
          icon="login"
          testID="sign-in-submit"
        />

        <View style={styles.links}>
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Text style={[styles.link, styles.registerLink]}>{t('auth.createAccount')}</Text>
            </Pressable>
          </Link>
        </View>

        <Banner
          tone="gold"
          icon="shield"
          title={t('dashboard.preApprovalNotice')}
          body={t('dashboard.preApprovalBody')}
        />
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.sm, marginBottom: spacing.xl, marginTop: spacing.xl },
  kicker: { ...typography.micro, color: colors.gold, letterSpacing: 2, marginTop: spacing.md },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  links: { alignItems: 'center', marginTop: spacing.lg },
  link: { ...typography.bodyStrong, color: colors.gold },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  registerText: { ...typography.body, color: colors.textMuted },
  registerLink: {},
});
