import React from 'react';
import {
  ActivityIndicator,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  type KeyboardTypeOptions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, elevation, layout, radius, spacing, typography } from '../../theme';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.heading, color: colors.text },
  sectionAction: { ...typography.caption, color: colors.gold },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...elevation.card,
  },
  cardPadded: { padding: spacing.lg },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },

  keyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    gap: spacing.md,
  },
  kvLabel: { ...typography.caption, color: colors.textMuted, flexShrink: 0 },
  kvValue: { ...typography.body, color: colors.text, flexShrink: 1, textAlign: 'right' },
  mono: { fontVariant: ['tabular-nums'] },

  button: {
    minHeight: layout.touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonLg: { minHeight: 54 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.45 },
  buttonIcon: { marginRight: 2 },
  buttonLabel: { ...typography.bodyStrong, textAlign: 'center' },
  buttonLabelLg: { fontSize: 16 },

  tile: {
    flex: 1,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    minHeight: 84,
  },
  tilePressed: { opacity: 0.75 },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(202,166,90,0.10)',
    marginBottom: spacing.sm,
  },
  tileLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },

  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  field: { marginBottom: spacing.lg },
  fieldLabel: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 7 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  fieldBoxError: { borderColor: colors.danger },
  fieldBoxDisabled: { opacity: 0.55 },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  inputMultiline: { minHeight: 78, textAlignVertical: 'top' },
  fieldError: { ...typography.caption, color: colors.danger, marginTop: 6 },
  fieldHint: { ...typography.caption, color: colors.textFaint, marginTop: 6 },

  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
  },
  amountInput: {
    flex: 1,
    color: colors.text,
    fontSize: 26,
    fontWeight: '600',
    paddingVertical: 14,
    fontVariant: ['tabular-nums'],
  },
  amountSuffix: { ...typography.bodyStrong, color: colors.gold },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeLabel: { ...typography.micro, textTransform: 'uppercase' },

  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 6,
  },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerTitle: { ...typography.caption, flexShrink: 1 },
  bannerBody: { ...typography.caption, color: colors.textMuted, lineHeight: 19 },
  bannerAction: { marginTop: 2 },
  bannerActionLabel: { ...typography.caption },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  centeredText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.heading, color: colors.text, textAlign: 'center' },
  emptyBody: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyAction: { marginTop: spacing.md, alignSelf: 'stretch' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: layout.touchTarget,
  },
  rowPressed: { opacity: 0.7 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { ...typography.bodyStrong, color: colors.text },
  rowSubtitle: { ...typography.caption, color: colors.textMuted },
  rowValue: { ...typography.body, color: colors.textSecondary, fontVariant: ['tabular-nums'] },

  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 4,
    minHeight: 86,
  },
  statLabel: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  statValue: { ...typography.heading, color: colors.text, fontVariant: ['tabular-nums'] },
  statCaption: { ...typography.caption, color: colors.textFaint },
});

/* -------------------------------------------------------------------------- */
/* Screen shell                                                                */
/* -------------------------------------------------------------------------- */

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function KeyValue({
  label,
  value,
  mono,
  valueStyle,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.keyValue}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text
        style={[styles.kvValue, mono && styles.mono, valueStyle]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  // A loading button is ALWAYS disabled: this is the first of the two
  // duplicate-submission guards (the second lives in useMutation's ref latch).
  const isBlocked = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.buttonLg,
        variantStyles[variant].button,
        pressed && !isBlocked && styles.buttonPressed,
        isBlocked && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles[variant].label.color} />
      ) : (
        <>
          {icon ? (
            <MaterialIcons
              name={icon}
              size={18}
              color={variantStyles[variant].label.color}
              style={styles.buttonIcon}
            />
          ) : null}
          <Text style={[styles.buttonLabel, variantStyles[variant].label, size === 'lg' && styles.buttonLabelLg]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const variantStyles: Record<ButtonVariant, { button: ViewStyle; label: TextStyle }> = {
  primary: {
    button: { backgroundColor: colors.gold, borderColor: colors.gold },
    label: { color: '#1a1206' },
  },
  secondary: {
    button: { backgroundColor: colors.surfaceAlt, borderColor: colors.lineStrong },
    label: { color: colors.text },
  },
  ghost: {
    button: { backgroundColor: 'transparent', borderColor: colors.line },
    label: { color: colors.textSecondary },
  },
  danger: {
    button: { backgroundColor: 'transparent', borderColor: colors.danger },
    label: { color: colors.danger },
  },
};

/** Compact icon + caption tile used for the dashboard quick actions. */
export function ActionTile({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tile,
        pressed && !disabled && styles.tilePressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <View style={styles.tileIconWrap}>
        <MaterialIcons name={icon} size={21} color={colors.goldSoft} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.textSecondary,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  label: string;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && styles.tilePressed]}
    >
      <MaterialIcons name={icon} size={22} color={color} />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Text field                                                                  */
/* -------------------------------------------------------------------------- */

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  error,
  hint,
  editable = true,
  multiline,
  rightIcon,
  onRightIconPress,
  onSubmitEditing,
  returnKeyType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'decimal-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'tel' | 'off' | 'new-password';
  error?: string | null;
  hint?: string;
  editable?: boolean;
  multiline?: boolean;
  rightIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onRightIconPress?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go' | 'send';
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, error ? styles.fieldBoxError : null, !editable && styles.fieldBoxDisabled]}>
        <TextInputCompat
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          multiline={multiline}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
        />
        {rightIcon && onRightIconPress ? (
          <Pressable onPress={onRightIconPress} hitSlop={8} accessibilityRole="button">
            <MaterialIcons name={rightIcon} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function TextInputCompat(props: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'tel' | 'off' | 'new-password';
  editable?: boolean;
  multiline?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go' | 'send';
  maxLength?: number;
}) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textFaint}
      style={[styles.input, props.multiline && styles.inputMultiline]}
      selectionColor={colors.gold}
    />
  );
}

/** Large amount entry used by Send / Card-to-Card / Fund. */
export function AmountInput({
  value,
  onChangeText,
  label,
  suffix,
  error,
  hint,
}: {
  value: string;
  onChangeText: (t: string) => void;
  label: string;
  suffix?: string;
  error?: string | null;
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.amountBox, error ? styles.fieldBoxError : null]}>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
          placeholder="0.000"
          placeholderTextColor={colors.textFaint}
          keyboardType="decimal-pad"
          style={styles.amountInput}
          selectionColor={colors.gold}
        />
        {suffix ? <Text style={styles.amountSuffix}>{suffix}</Text> : null}
      </View>
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Feedback                                                                    */
/* -------------------------------------------------------------------------- */

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'gold';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceRaised, fg: colors.textSecondary },
    success: { bg: 'rgba(103,198,155,0.16)', fg: colors.success },
    danger: { bg: 'rgba(216,107,107,0.16)', fg: colors.danger },
    warning: { bg: 'rgba(224,181,102,0.16)', fg: colors.warning },
    info: { bg: 'rgba(127,178,217,0.16)', fg: colors.info },
    gold: { bg: 'rgba(202,166,90,0.18)', fg: colors.gold },
  };
  const p = palette[tone];
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }]}>
      <Text style={[styles.badgeLabel, { color: p.fg }]}>{label}</Text>
    </View>
  );
}

export function Banner({
  tone = 'info',
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  tone?: 'info' | 'success' | 'danger' | 'warning' | 'gold';
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const tones = {
    info: { border: colors.lineStrong, fg: colors.info, bg: 'rgba(127,178,217,0.08)' },
    success: { border: 'rgba(103,198,155,0.4)', fg: colors.success, bg: 'rgba(103,198,155,0.08)' },
    danger: { border: 'rgba(216,107,107,0.4)', fg: colors.danger, bg: 'rgba(216,107,107,0.08)' },
    warning: { border: 'rgba(224,181,102,0.4)', fg: colors.warning, bg: 'rgba(224,181,102,0.08)' },
    gold: { border: 'rgba(202,166,90,0.4)', fg: colors.gold, bg: 'rgba(202,166,90,0.08)' },
  }[tone];

  return (
    <View style={[styles.banner, { borderColor: tones.border, backgroundColor: tones.bg }]}>
      <View style={styles.bannerHead}>
        {icon ? <MaterialIcons name={icon} size={18} color={tones.fg} /> : null}
        {title ? <Text style={[styles.bannerTitle, { color: tones.fg }]}>{title}</Text> : null}
      </View>
      {body ? <Text style={styles.bannerBody}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.bannerAction} accessibilityRole="button">
          <Text style={[styles.bannerActionLabel, { color: tones.fg }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingView({ label }: { label: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={styles.centeredText}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'inbox',
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={icon} size={26} color={colors.goldDeep} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

/**
 * One failure surface for the whole app. It always shows the real reason and
 * always offers a retry, so an action can never appear to do nothing.
 */
export function ErrorView({
  title,
  message,
  onRetry,
  retryLabel,
  endpointUnavailable,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  endpointUnavailable?: boolean;
}) {
  return (
    <View style={styles.centered}>
      <View style={[styles.emptyIcon, { borderColor: colors.danger }]}>
        <MaterialIcons
          name={endpointUnavailable ? 'link-off' : 'error-outline'}
          size={26}
          color={colors.danger}
        />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyBody}>{message}</Text> : null}
      {onRetry ? (
        <Button
          label={retryLabel ?? 'Retry'}
          onPress={onRetry}
          variant="secondary"
          icon="refresh"
          style={styles.emptyAction}
        />
      ) : null}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  tone = 'neutral',
  disabled,
}: {
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  tone?: 'neutral' | 'danger' | 'success' | 'gold';
  disabled?: boolean;
}) {
  const toneColor =
    tone === 'danger'
      ? colors.danger
      : tone === 'success'
        ? colors.success
        : tone === 'gold'
          ? colors.gold
          : colors.textSecondary;

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.rowIcon}>
          <MaterialIcons name={icon} size={19} color={toneColor} />
        </View>
      ) : null}
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, tone === 'danger' && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <MaterialIcons name="chevron-right" size={20} color={colors.textFaint} /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && !disabled && styles.rowPressed, disabled && styles.buttonDisabled]}
    >
      {content}
    </Pressable>
  );
}

export function StatCard({
  label,
  value,
  caption,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: 'neutral' | 'gold';
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'gold' && { color: colors.gold }]} numberOfLines={1}>
        {value}
      </Text>
      {caption ? (
        <Text style={styles.statCaption} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export const uiStyles = styles;

