import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme';

export type ConfirmRow = { label: string; value: string; emphasize?: boolean };

/**
 * Confirmation bottom sheet for irreversible financial actions.
 *
 * This is a hard product rule, not a nicety: nothing that moves money is
 * submitted from a single tap. The primary action is disabled while the caller
 * reports `loading`, and the sheet cannot be dismissed mid-flight (the backdrop
 * press is ignored while busy) so the user cannot lose sight of an in-progress
 * transfer.
 */
export function ConfirmSheet({
  visible,
  title,
  subtitle,
  rows,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  tone = 'gold',
  icon = 'check-circle-outline',
  errorMessage,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  rows: ConfirmRow[];
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  tone?: 'gold' | 'danger';
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  errorMessage?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const accent = tone === 'danger' ? colors.danger : colors.gold;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!loading) onCancel();
          }}
          accessibilityLabel="Dismiss"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grabber} />

          <View style={styles.head}>
            <View style={[styles.iconWrap, { borderColor: accent }]}>
              <MaterialIcons name={icon} size={22} color={accent} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <ScrollView style={styles.rows} contentContainerStyle={styles.rowsContent}>
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text
                  style={[styles.rowValue, row.emphasize && { color: accent, fontSize: 17 }]}
                  numberOfLines={2}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </ScrollView>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.action,
                styles.cancel,
                pressed && !loading && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ busy: loading, disabled: loading }}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: accent, borderColor: accent },
                pressed && !loading && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              <Text style={styles.confirmLabel}>{loading ? '…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    marginBottom: spacing.lg,
  },
  head: { alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { ...typography.title, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  rows: { flexGrow: 0 },
  rowsContent: { paddingBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: 9,
  },
  rowLabel: { ...typography.caption, color: colors.textMuted, flexShrink: 0, maxWidth: '45%' },
  rowValue: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(216,107,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(216,107,107,0.4)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  errorText: { ...typography.caption, color: colors.dangerSoft, flexShrink: 1, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  action: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { backgroundColor: 'transparent', borderColor: colors.line },
  cancelLabel: { ...typography.bodyStrong, color: colors.textSecondary },
  confirmLabel: { ...typography.bodyStrong, color: '#1a1206' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
});
