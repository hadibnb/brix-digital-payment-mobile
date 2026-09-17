import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../theme';

/**
 * Screen header with real Android/iOS behaviour:
 *   - respects the top safe area (notch / status bar)
 *   - shows a native back affordance driven by expo-router, which also wires
 *     the Android hardware back button and the iOS swipe-back gesture
 *   - optional trailing action
 */
export function AppHeader({
  title,
  subtitle,
  showBack,
  onBack,
  rightIcon,
  onRightPress,
  rightLabel,
  large = false,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onRightPress?: () => void;
  rightLabel?: string;
  large?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}

        <View style={styles.titleWrap}>
          <Text style={[styles.title, large && styles.titleLarge]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightIcon && onRightPress ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={rightLabel ?? 'Action'}
            style={({ pressed }) => [styles.rightBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name={rightIcon} size={22} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  backBtn: {
    width: 40,
    height: 40,
    marginLeft: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1, gap: 2 },
  title: { ...typography.heading, color: colors.text },
  titleLarge: { ...typography.display },
  subtitle: { ...typography.caption, color: colors.textMuted },
  rightBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
