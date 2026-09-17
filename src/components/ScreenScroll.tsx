import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../theme';

/**
 * Scrollable content container that handles the things every screen needs:
 *   - keyboard dismissal on drag (native keyboard handling)
 *   - safe-area-aware bottom padding so nothing hides behind the tab bar
 *   - pull-to-refresh wired to a real reload (never a no-op)
 *   - a max width so the layout stays composed on tablets/large phones
 */
export function ScreenScroll({
  children,
  onRefresh,
  refreshing = false,
  contentStyle,
  bottomInsetExtra = 0,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  bottomInsetExtra?: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + layout.tabBarHeight + spacing.xl + bottomInsetExtra },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.surface}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.base },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    gap: 2,
    alignSelf: 'center',
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
});
