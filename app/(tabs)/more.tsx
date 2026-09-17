import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../../src/components/AppHeader';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { LanguageCurrencyBar } from '../../src/components/LanguageCurrencyBar';
import { Badge, Banner, Button, Card, ListRow } from '../../src/components/ui';
import { useAuthStore } from '../../src/state/authStore';
import { logout } from '../../src/services/auth';
import { APP_VERSION, API_BASE_URL } from '../../src/config/env';
import { VERIFIED_ENDPOINTS, UNVERIFIED_ENDPOINTS } from '../../src/api/endpoints';
import { colors, radius, spacing, typography } from '../../src/theme';

/**
 * "More" hub.
 *
 * Every secondary function from the web sidebar is reachable here, so reducing
 * the primary bar to five tabs never removes a capability. The integration
 * status block is deliberate: it tells the user (and the developer) exactly
 * which BRIX endpoints are live and which are still undocumented, instead of
 * hiding an unavailable action behind a button that silently does nothing.
 */
export default function MoreScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const onSignOut = async () => {
    await logout();
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <>
      <AppHeader title={t('nav.more')} subtitle={t('account.title')} large />
      <ScreenScroll>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color={colors.gold} />
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.name}>{user?.fullName ?? user?.name ?? t('account.profile')}</Text>
            <Text style={styles.email}>{user?.email ?? user?.phone ?? '—'}</Text>
          </View>
          <Badge
            label={user?.emailVerified ? t('account.verified') : t('account.preApproval')}
            tone={user?.emailVerified ? 'success' : 'gold'}
          />
        </Card>

        <LanguageCurrencyBar compact />

        <Text style={styles.groupLabel}>{t('common.all')}</Text>
        <Card padded={false} style={styles.group}>
          <ListRow icon="swap-horiz" title={t('nav.cardToCard')} onPress={() => router.push('/card-to-card')} />
          <ListRow icon="storefront" title={t('nav.merchant')} onPress={() => router.push('/merchant')} />
          <ListRow icon="savings" title={t('nav.funding')} onPress={() => router.push('/funding')} />
          <ListRow icon="north-east" title={t('nav.send')} onPress={() => router.push('/send')} />
          <ListRow icon="south-west" title={t('nav.receive')} onPress={() => router.push('/receive')} />
          <ListRow icon="qr-code-scanner" title={t('nav.pay')} onPress={() => router.push('/pay')} />
          <ListRow
            icon="notifications-none"
            title={t('notifications.title')}
            onPress={() => router.push('/notifications')}
          />
          <ListRow
            icon="manage-accounts"
            title={t('account.title')}
            onPress={() => router.push('/(tabs)/account')}
          />
        </Card>

        <Text style={styles.groupLabel}>{t('account.endpointStatus')}</Text>
        <Card style={styles.group}>
          <View style={styles.integrationHead}>
            <MaterialIcons name="cloud-done" size={16} color={colors.success} />
            <Text style={styles.integrationTitle}>{API_BASE_URL}</Text>
          </View>
          <Text style={styles.integrationSub}>
            {VERIFIED_ENDPOINTS.length} live endpoint(s) · {UNVERIFIED_ENDPOINTS.length} pending
            documentation
          </Text>
          <Text style={styles.integrationList}>{VERIFIED_ENDPOINTS.join('  ·  ')}</Text>
        </Card>

        <Banner tone="gold" icon="verified-user" title={t('dashboard.preApprovalNotice')} body={t('dashboard.preApprovalBody')} />

        <Card style={styles.session}>
          <ListRow icon="info-outline" title={t('account.version')} value={APP_VERSION} />
          <ListRow icon="logout" title={t('common.signOut')} onPress={onSignOut} tone="danger" />
        </Card>

        <Button label={t('common.signOut')} onPress={onSignOut} variant="danger" icon="logout" />
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(202,166,90,0.12)',
    borderWidth: 1,
    borderColor: colors.goldDeep,
  },
  profileBody: { flex: 1, gap: 3 },
  name: { ...typography.heading, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted },
  groupLabel: {
    ...typography.micro,
    color: colors.textFaint,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  group: { paddingHorizontal: spacing.lg },
  integrationHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  integrationTitle: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  integrationSub: { ...typography.caption, color: colors.textMuted, marginTop: 6 },
  integrationList: { ...typography.caption, color: colors.textFaint, marginTop: 8, lineHeight: 18 },
  session: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
});

void radius;
