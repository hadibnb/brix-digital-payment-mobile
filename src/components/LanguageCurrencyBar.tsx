import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { PickerSheet, type PickerOption } from './PickerSheet';
import { Button } from './ui';
import { useUiStore } from '../state/uiStore';
import { changeLanguage } from '../i18n';
import {
  LANGUAGE_LABELS,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../config/fallback';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Language + currency selector, present on the auth screens and reachable from
 * the dashboard header and the Account screen.
 *
 * Currency changes propagate to every screen through the UI store; language
 * changes are applied live through i18next (RTL handled by the i18n module).
 */
export function LanguageCurrencyBar({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const currency = useUiStore((s) => s.currency);
  const language = useUiStore((s) => s.language);
  const setCurrency = useUiStore((s) => s.setCurrency);
  const setLanguage = useUiStore((s) => s.setLanguage);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const currencyOptions: PickerOption[] = SUPPORTED_CURRENCIES.map((code) => ({
    value: code,
    label: code,
  }));

  const languageOptions: PickerOption[] = SUPPORTED_LANGUAGES.map((code) => ({
    value: code,
    label: LANGUAGE_LABELS[code as SupportedLanguage] ?? code,
    caption: code.toUpperCase(),
  }));

  const onPickLanguage = async (code: string) => {
    await setLanguage(code);
    await changeLanguage(code);
  };

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <ChipPill
          icon="public"
          label={language.toUpperCase()}
          onPress={() => setLanguageOpen(true)}
          accessibilityLabel={t('rates.selectLanguage')}
        />
        <ChipPill
          icon="payments"
          label={currency}
          onPress={() => setCurrencyOpen(true)}
          accessibilityLabel={t('rates.selectCurrency')}
        />

        <PickerSheet
          visible={languageOpen}
          title={t('rates.selectLanguage')}
          options={languageOptions}
          selectedValue={language}
          onSelect={onPickLanguage}
          onClose={() => setLanguageOpen(false)}
        />
        <PickerSheet
          visible={currencyOpen}
          title={t('rates.selectCurrency')}
          options={currencyOptions}
          selectedValue={currency}
          onSelect={(code) => void setCurrency(code, { fromRegion: false })}
          onClose={() => setCurrencyOpen(false)}
          searchable
          searchPlaceholder={t('rates.searchCurrency')}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.selector}>
        <Button
          label={`${t('common.language')} · ${language.toUpperCase()}`}
          onPress={() => setLanguageOpen(true)}
          variant="secondary"
          icon="public"
          style={styles.selectorBtn}
        />
        <Button
          label={`${t('common.currency')} · ${currency}`}
          onPress={() => setCurrencyOpen(true)}
          variant="secondary"
          icon="payments"
          style={styles.selectorBtn}
        />
      </View>

      <PickerSheet
        visible={languageOpen}
        title={t('rates.selectLanguage')}
        options={languageOptions}
        selectedValue={language}
        onSelect={onPickLanguage}
        onClose={() => setLanguageOpen(false)}
      />
      <PickerSheet
        visible={currencyOpen}
        title={t('rates.selectCurrency')}
        options={currencyOptions}
        selectedValue={currency}
        onSelect={(code) => void setCurrency(code, { fromRegion: false })}
        onClose={() => setCurrencyOpen(false)}
        searchable
        searchPlaceholder={t('rates.searchCurrency')}
      />
    </View>
  );
}

function ChipPill({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Text
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.pill}
    >
      <MaterialIcons name={icon} size={13} color={colors.textSecondary} /> {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  selector: { flexDirection: 'row', gap: spacing.md },
  selectorBtn: { flex: 1, paddingHorizontal: spacing.md },
  compactRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  pill: {
    ...typography.micro,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
});
