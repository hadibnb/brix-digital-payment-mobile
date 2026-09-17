import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { AppHeader } from '../src/components/AppHeader';
import { ScreenScroll } from '../src/components/ScreenScroll';
import { Badge, Banner, Button, Card, EmptyState, LoadingView, SectionHeader } from '../src/components/ui';
import { useNotificationInbox, registerForRemotePush } from '../src/services/notifications';
import { formatDateTime } from '../src/utils/format';
import { colors, radius, spacing, typography } from '../src/theme';

/**
 * Notifications.
 *
 * HONEST SCOPE: the existing BRIX backend exposes no documented push
 * registration endpoint, so this screen does NOT pretend to receive remote push
 * notifications. It shows:
 *   - the event taxonomy the product will use (payment received/sent, card,
 *     merchant, verification, security)
 *   - a real, persisted local inbox that app events write into
 *   - an explicit notice that remote delivery awaits a backend endpoint, plus
 *     the registration call that will activate it once that endpoint exists
 */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { items, loading, unreadCount, markAllRead, clear, push } = useNotificationInbox();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onEnable = async () => {
    setBusy(true);
    setNotice(null);
    const result = await registerForRemotePush();
    if (!result.registered) {
      setNotice(t('notifications.notRegistered'));
      // Record the attempt locally so the user sees a concrete outcome rather
      // than a button that appears to do nothing.
      await push({
        kind: 'security',
        title: t('notifications.permissionTitle'),
        body: t('notifications.notRegistered'),
      });
    }
    setBusy(false);
  };

  const kinds: Array<{ key: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = [
    { key: 'paymentReceived', icon: 'south-west' },
    { key: 'paymentSent', icon: 'north-east' },
    { key: 'cardStatus', icon: 'credit-card' },
    { key: 'merchantStatus', icon: 'storefront' },
    { key: 'verification', icon: 'verified' },
    { key: 'security', icon: 'shield' },
  ];

  return (
    <>
      <AppHeader
        title={t('notifications.title')}
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        showBack
        onBack={() => router.back()}
        rightIcon={items.length > 0 ? 'done-all' : undefined}
        onRightPress={items.length > 0 ? () => void markAllRead() : undefined}
        rightLabel="Mark all read"
      />
      <ScreenScroll>
        <Banner
          tone="info"
          icon="notifications-none"
          title={t('notifications.permissionTitle')}
          body={t('notifications.permissionBody')}
          actionLabel={t('notifications.enable')}
          onAction={() => void onEnable()}
        />

        {notice ? <Banner tone="warning" icon="link-off" body={notice} /> : null}

        <SectionHeader title={t('notifications.title')} />
        {loading ? (
          <Card style={styles.pad}>
            <LoadingView label={t('common.loading')} />
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState icon="notifications-off" title={t('notifications.empty')} />
          </Card>
        ) : (
          <Card padded={false} style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={[styles.dot, !item.read && styles.dotUnread]} />
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.body ? <Text style={styles.itemBodyText}>{item.body}</Text> : null}
                  <Text style={styles.itemTime}>{formatDateTime(item.createdAt)}</Text>
                </View>
                <Badge label={item.kind.replace('_', ' ')} tone="neutral" />
              </View>
            ))}
          </Card>
        )}

        {items.length > 0 ? (
          <Button label={t('common.close')} onPress={() => void clear()} variant="ghost" icon="delete-outline" />
        ) : null}

        <SectionHeader title={t('account.endpointStatus')} />
        <Card style={styles.taxonomy}>
          <Text style={styles.taxonomyLabel}>Event taxonomy</Text>
          <View style={styles.taxonomyGrid}>
            {kinds.map((k) => (
              <View key={k.key} style={styles.taxonomyItem}>
                <MaterialIcons name={k.icon} size={15} color={colors.goldDeep} />
                <Text style={styles.taxonomyText}>{t(`notifications.${k.key}`)}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Banner tone="gold" icon="link-off" body={t('notifications.notRegistered')} />
      </ScreenScroll>
    </>
  );
}

const styles = StyleSheet.create({
  pad: { paddingVertical: spacing.xl },
  list: { paddingHorizontal: spacing.lg, overflow: 'hidden' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lineStrong, marginTop: 7 },
  dotUnread: { backgroundColor: colors.gold },
  itemBody: { flex: 1, gap: 3 },
  itemTitle: { ...typography.bodyStrong, color: colors.text },
  itemBodyText: { ...typography.caption, color: colors.textMuted, lineHeight: 19 },
  itemTime: { ...typography.caption, color: colors.textFaint },
  taxonomy: { gap: spacing.md },
  taxonomyLabel: { ...typography.heading, color: colors.text },
  taxonomyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  taxonomyItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  taxonomyText: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
});

void radius;
