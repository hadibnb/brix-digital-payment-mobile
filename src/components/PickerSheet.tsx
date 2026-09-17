import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme';

export type PickerOption = { value: string; label: string; caption?: string };

/**
 * Generic option sheet used by the currency and language selectors.
 * Searchable, because the BRIX currency list has 26 entries.
 */
export function PickerSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  searchable = false,
  searchPlaceholder = 'Search',
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchable || query.trim().length === 0) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {searchable ? (
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={colors.textFaint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textFaint}
                autoCapitalize="characters"
                style={styles.searchInput}
                selectionColor={colors.gold}
              />
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
            renderItem={({ item }) => {
              const active = item.value === selectedValue;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    setQuery('');
                    onClose();
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <View style={styles.optionBody}>
                    <Text style={[styles.optionLabel, active && { color: colors.gold }]}>{item.label}</Text>
                    {item.caption ? <Text style={styles.optionCaption}>{item.caption}</Text> : null}
                  </View>
                  {active ? <MaterialIcons name="check" size={20} color={colors.gold} /> : null}
                </Pressable>
              );
            }}
          />
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
    maxHeight: '82%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    marginBottom: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, color: colors.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    minHeight: 54,
  },
  pressed: { opacity: 0.7 },
  optionBody: { flex: 1, gap: 2 },
  optionLabel: { ...typography.bodyStrong, color: colors.text },
  optionCaption: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
});
