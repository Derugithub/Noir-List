import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, spacing, useColors, type Palette } from '../theme';
import type { Category, InsertEdge, ThemePreference } from '../types';

type Option<T extends string> = { key: T; label: string };

const THEME_OPTIONS: Option<ThemePreference>[] = [
  { key: 'system', label: 'System' },
  { key: 'dark', label: 'Dark' },
  { key: 'light', label: 'Light' },
];

const INSERT_OPTIONS: Option<InsertEdge>[] = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
];

type Props = {
  theme: ThemePreference;
  onChangeTheme: (theme: ThemePreference) => void;
  insertAt: InsertEdge;
  onChangeInsertAt: (edge: InsertEdge) => void;
  categories: readonly Category[];
  categoryCounts: Record<string, number>;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onBack: () => void;
};

function Segmented<T extends string>({
  options,
  value,
  onChange,
  styles,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.segment} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SettingsScreen({
  theme,
  onChangeTheme,
  insertAt,
  onChangeInsertAt,
  categories,
  categoryCounts,
  onAddCategory,
  onDeleteCategory,
  onBack,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState('');

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Already exists', `"${trimmed}" is already a category.`);
      return;
    }
    onAddCategory(trimmed);
    setName('');
  };

  const confirmDelete = (cat: Category) => {
    const count = categoryCounts[cat.id] ?? 0;
    Alert.alert(
      `Delete "${cat.name}"?`,
      count > 0
        ? `Its ${count} task${count === 1 ? '' : 's'} will stay in All, without a category.`
        : 'This category has no tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteCategory(cat.id) },
      ],
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.kicker}>NOIRLIST</Text>
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>THEME</Text>
        <Segmented options={THEME_OPTIONS} value={theme} onChange={onChangeTheme} styles={styles} />

        <Text style={styles.sectionLabel}>ADD NEW TODOS TO</Text>
        <Segmented
          options={INSERT_OPTIONS}
          value={insertAt}
          onChange={onChangeInsertAt}
          styles={styles}
        />

        <Text style={styles.sectionLabel}>CATEGORIES</Text>
        <View style={styles.composer}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="New category"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            underlineColorAndroid="transparent"
            returnKeyType="done"
            maxLength={24}
            onSubmitEditing={add}
          />
          <Pressable
            onPress={add}
            accessibilityRole="button"
            accessibilityLabel="Add category"
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          >
            <Text style={styles.addLabel}>Add</Text>
          </Pressable>
        </View>

        {categories.length === 0 ? (
          <Text style={styles.hint}>
            No categories yet. Create one, then pick it on the home screen to add tasks to it.
          </Text>
        ) : (
          categories.map((cat) => (
            <View key={cat.id} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {cat.name}
              </Text>
              <Text style={styles.rowCount}>{categoryCounts[cat.id] ?? 0}</Text>
              <Pressable
                onPress={() => confirmDelete(cat)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Delete category ${cat.name}`}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteIcon}>×</Text>
              </Pressable>
            </View>
          ))
        )}
        <Text style={styles.hint}>Tip: long-press a task on the home screen to move it.</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.lg,
      paddingTop: 12,
      paddingBottom: spacing.sm,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 28,
      marginTop: -3,
      fontWeight: '400',
    },
    kicker: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 3,
      marginBottom: 2,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 2,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    segment: {
      flexDirection: 'row',
      padding: 4,
      gap: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.pill,
      alignItems: 'center',
    },
    segmentItemActive: {
      backgroundColor: colors.accent,
    },
    segmentLabel: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    segmentLabelActive: {
      color: colors.onAccent,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: spacing.sm,
    },
    input: {
      flex: 1,
      height: 46,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 0,
      color: colors.text,
      fontSize: 16,
      includeFontPadding: false,
    },
    addBtn: {
      height: 46,
      paddingHorizontal: 20,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnPressed: {
      backgroundColor: colors.accentMuted,
    },
    addLabel: {
      color: colors.onAccent,
      fontWeight: '800',
      fontSize: 15,
      letterSpacing: 0.4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      marginBottom: 6,
    },
    rowLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    rowCount: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    deleteBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteIcon: {
      color: colors.textDim,
      fontSize: 22,
      fontWeight: '300',
      marginTop: -1,
    },
    hint: {
      color: colors.textDim,
      fontSize: 13,
      marginTop: spacing.sm,
    },
  });
