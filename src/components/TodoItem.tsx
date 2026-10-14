import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useColors, type Palette } from '../theme';
import type { Todo } from '../types';

type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  /** Long press opens the category picker. */
  onLongPress?: (id: string) => void;
  /** Shown as a small tag when the list is not already filtered to that category. */
  categoryName?: string;
};

export function TodoItem({ todo, onToggle, onDelete, onLongPress, categoryName }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.card, todo.done && styles.cardDone]}>
      <Pressable
        onPress={() => onToggle(todo.id)}
        onLongPress={onLongPress ? () => onLongPress(todo.id) : undefined}
        delayLongPress={350}
        style={styles.row}
        hitSlop={{ top: 8, bottom: 8 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.done }}
      >
        <View style={[styles.checkbox, todo.done && styles.checkboxOn]}>
          {todo.done ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={[styles.label, todo.done && styles.labelDone]} numberOfLines={3}>
          {todo.text}
        </Text>
        {categoryName ? (
          <Text style={styles.tag} numberOfLines={1}>
            {categoryName}
          </Text>
        ) : null}
      </Pressable>
      <Pressable
        onPress={() => onDelete(todo.id)}
        style={styles.deleteBtn}
        hitSlop={8}
        accessibilityLabel="Delete task"
      >
        <Text style={styles.deleteIcon}>×</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      marginBottom: 6,
    },
    cardDone: {
      opacity: 0.72,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.textDim,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    checkboxOn: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkMark: {
      color: colors.onAccent,
      fontSize: 12,
      fontWeight: '800',
      marginTop: -1,
    },
    label: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    labelDone: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    tag: {
      maxWidth: 96,
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      overflow: 'hidden',
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
  });
