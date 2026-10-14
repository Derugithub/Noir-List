import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FilterBar } from './src/components/FilterBar';
import { GearIcon } from './src/components/GearIcon';
import { TodoItem } from './src/components/TodoItem';
import { SettingsScreen } from './src/screens/SettingsScreen';
import {
  loadCategories,
  loadInsertEdge,
  loadTheme,
  loadTodos,
  saveCategories,
  saveInsertEdge,
  saveTheme,
  saveTodos,
} from './src/todoStorage';
import {
  darkColors,
  lightColors,
  radius,
  spacing,
  ThemeContext,
  useColors,
  type Palette,
} from './src/theme';
import type { Category, Filter, InsertEdge, ThemePreference, Todo } from './src/types';

const COMPOSER_HEIGHT = 46;
// Space below the safe-area inset, above the NOIRLIST kicker.
const HEADER_TOP_GAP = 12;
// The header no longer pads under the bar. 8dp here is the gap above the field
// (was spacing.lg, 24, plus spacing.sm, 10, under the bar).
const COMPOSER_TOP_GAP = 8;

type Screen = 'home' | 'settings';

/** Skips the first value (the one just loaded) so a restart never rewrites storage. */
function usePersist<T>(value: T | null, save: (value: T) => Promise<void>) {
  const skip = useRef(true);
  useEffect(() => {
    if (value === null) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    void save(value);
  }, [value, save]);
}

type HomeProps = {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[] | null>>;
  categories: Category[];
  insertAt: InsertEdge;
  onOpenSettings: () => void;
};

function HomeScreen({ todos, setTodos, categories, insertAt, onOpenSettings }: HomeProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  // null is the All view: every task, including ones saved before categories existed.
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Fall back to All if the selected category was deleted.
  useEffect(() => {
    if (categoryId !== null && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(null);
    }
  }, [categories, categoryId]);

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  const scoped = useMemo(
    () => (categoryId === null ? todos : todos.filter((t) => t.categoryId === categoryId)),
    [todos, categoryId],
  );

  const remaining = scoped.filter((t) => !t.done).length;
  const doneCount = scoped.length - remaining;
  const progress = scoped.length === 0 ? 0 : doneCount / scoped.length;
  const progressPercent = Math.round(progress * 100);
  const progressComplete = progressPercent === 100;

  const visible = useMemo(() => {
    if (filter === 'active') return scoped.filter((t) => !t.done);
    if (filter === 'done') return scoped.filter((t) => t.done);
    return scoped;
  }, [filter, scoped]);

  const addTodo = () => {
    const text = draft.trim();
    if (!text) return;
    setTodos((prev) => {
      if (prev === null) return prev;
      const todo: Todo = {
        id: Date.now().toString(),
        text,
        done: false,
        createdAt: Date.now(),
        ...(categoryId !== null ? { categoryId } : {}),
      };
      // Array order is what AsyncStorage writes, so top vs bottom survives a restart.
      return insertAt === 'bottom' ? [...prev, todo] : [todo, ...prev];
    });
    setDraft('');
    requestAnimationFrame(focusInput);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev === null ? prev : prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => (prev === null ? prev : prev.filter((t) => t.id !== id)));
  };

  const assignCategory = (id: string, nextCategory: string | null) => {
    setTodos((prev) =>
      prev === null
        ? prev
        : prev.map((t) => {
            if (t.id !== id) return t;
            const { categoryId: _old, ...rest } = t;
            return nextCategory === null ? rest : { ...rest, categoryId: nextCategory };
          }),
    );
    setPickerFor(null);
  };

  const clearDone = () => {
    if (doneCount === 0) return;
    const inScope = (t: Todo) => categoryId === null || t.categoryId === categoryId;
    const run = () =>
      setTodos((prev) => (prev === null ? prev : prev.filter((t) => !(t.done && inScope(t)))));
    if (Platform.OS === 'web') {
      run();
      return;
    }
    Alert.alert('Clear finished?', 'Completed tasks will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: run },
    ]);
  };

  const pickerTodo = pickerFor === null ? undefined : todos.find((t) => t.id === pickerFor);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>NOIRLIST</Text>
        <Text style={styles.title}>Do the work.</Text>
        <Text style={styles.subtitle}>
          {remaining === 0
            ? scoped.length === 0
              ? 'Nothing queued. Add a task.'
              : 'All clear. Nice.'
            : `${remaining} open · ${doneCount} done`}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                progressComplete && styles.progressFillComplete,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, progressComplete && styles.progressLabelComplete]}>
            {progressPercent}%
          </Text>
        </View>

        <Pressable
          onPress={onOpenSettings}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={({ pressed }) => [styles.gearBtn, pressed && styles.gearBtnPressed]}
        >
          <GearIcon color={colors.textMuted} holeColor={colors.bg} />
        </Pressable>
      </View>

      <View style={styles.composer}>
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          placeholder={
            categoryId === null ? 'New task' : `New task in ${categoryNames[categoryId] ?? ''}`
          }
          placeholderTextColor={colors.textDim}
          style={styles.input}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
          returnKeyType="done"
          blurOnSubmit={false}
          autoFocus
          onSubmitEditing={addTodo}
        />
        <Pressable
          onPress={addTodo}
          accessibilityRole="button"
          accessibilityLabel="Add"
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>

      {categories.length > 0 ? (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
            keyboardShouldPersistTaps="handled"
          >
            {[{ id: null as string | null, name: 'All' }, ...categories].map((cat) => {
              const active = cat.id === categoryId;
              return (
                <Pressable
                  key={cat.id ?? '__all'}
                  onPress={() => setCategoryId(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <FilterBar value={filter} onChange={setFilter} />
        {doneCount > 0 ? (
          <Pressable
            onPress={clearDone}
            style={styles.clearBtn}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.clearLabel}>Clear done</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TodoItem
            todo={item}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onLongPress={categories.length > 0 ? setPickerFor : undefined}
            categoryName={
              categoryId === null && item.categoryId ? categoryNames[item.categoryId] : undefined
            }
          />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyMark} />
            <Text style={styles.emptyTitle}>Empty lane</Text>
            <Text style={styles.emptyCopy}>
              {filter === 'done'
                ? 'No finished tasks yet.'
                : filter === 'active'
                  ? 'No open tasks. Add one above.'
                  : 'Start with a single, sharp task.'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={pickerTodo !== undefined}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerFor(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerFor(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Move to category</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {pickerTodo?.text}
            </Text>
            <ScrollView>
              {[{ id: null as string | null, name: 'No category' }, ...categories].map((cat) => {
                const active = (pickerTodo?.categoryId ?? null) === cat.id;
                return (
                  <Pressable
                    key={cat.id ?? '__none'}
                    onPress={() => pickerTodo && assignCategory(pickerTodo.id, cat.id)}
                    accessibilityRole="button"
                    style={[styles.modalOption, active && styles.modalOptionActive]}
                  >
                    <Text style={styles.modalOptionLabel} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    {active ? <Text style={styles.modalCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Root() {
  const systemScheme = useColorScheme();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [insertAt, setInsertAt] = useState<InsertEdge | null>(null);
  const [theme, setTheme] = useState<ThemePreference | null>(null);
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    let active = true;
    Promise.all([loadTodos(), loadInsertEdge(), loadCategories(), loadTheme()]).then(
      ([loadedTodos, edge, loadedCategories, loadedTheme]) => {
        if (!active) return;
        // Drop links to categories that no longer exist, so no task is hidden.
        const ids = new Set(loadedCategories.map((c) => c.id));
        const cleaned = loadedTodos.map((t) => {
          if (t.categoryId === undefined || ids.has(t.categoryId)) return t;
          const { categoryId: _gone, ...rest } = t;
          return rest;
        });
        setInsertAt(edge);
        setCategories(loadedCategories);
        setTheme(loadedTheme);
        setTodos(cleaned);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  usePersist(todos, saveTodos);
  usePersist(categories, saveCategories);
  usePersist(insertAt, saveInsertEdge);
  usePersist(theme, saveTheme);

  // Android back button returns from Settings instead of closing the app.
  useEffect(() => {
    if (screen !== 'settings') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setScreen('home');
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  const scheme = theme === 'light' || theme === 'dark' ? theme : (systemScheme ?? 'dark');
  const palette: Palette = scheme === 'light' ? lightColors : darkColors;
  const safeStyle = { flex: 1, backgroundColor: palette.bg };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of todos ?? []) {
      if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [todos]);

  const addCategory = useCallback((name: string) => {
    setCategories((prev) =>
      prev === null ? prev : [...prev, { id: `c${Date.now().toString(36)}`, name }],
    );
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => (prev === null ? prev : prev.filter((c) => c.id !== id)));
    // Tasks are kept; they just lose the category and stay visible under All.
    setTodos((prev) =>
      prev === null
        ? prev
        : prev.map((t) => {
            if (t.categoryId !== id) return t;
            const { categoryId: _gone, ...rest } = t;
            return rest;
          }),
    );
  }, []);

  const ready = todos !== null && categories !== null && insertAt !== null && theme !== null;

  return (
    <ThemeContext.Provider value={palette}>
      <SafeAreaView style={safeStyle}>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        {!ready ? null : screen === 'settings' ? (
          <SettingsScreen
            theme={theme}
            onChangeTheme={setTheme}
            insertAt={insertAt}
            onChangeInsertAt={setInsertAt}
            categories={categories}
            categoryCounts={categoryCounts}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onBack={() => setScreen('home')}
          />
        ) : (
          <HomeScreen
            todos={todos}
            setTodos={setTodos}
            categories={categories}
            insertAt={insertAt}
            onOpenSettings={() => setScreen('settings')}
          />
        )}
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    header: {
      position: 'relative',
      paddingHorizontal: spacing.lg,
      paddingTop: HEADER_TOP_GAP,
      paddingBottom: 0,
    },
    kicker: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 3,
      marginBottom: 8,
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 6,
      marginBottom: 18,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    progressLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      minWidth: 40,
      textAlign: 'right',
    },
    progressLabelComplete: {
      color: colors.complete,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
    },
    progressFillComplete: {
      backgroundColor: colors.complete,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: spacing.lg,
      paddingTop: COMPOSER_TOP_GAP,
      paddingBottom: spacing.sm,
    },
    input: {
      flex: 1,
      height: COMPOSER_HEIGHT,
      minHeight: COMPOSER_HEIGHT,
      maxHeight: COMPOSER_HEIGHT,
      boxSizing: 'border-box',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 0,
      color: colors.text,
      fontSize: 16,
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    addBtn: {
      height: COMPOSER_HEIGHT,
      minHeight: COMPOSER_HEIGHT,
      boxSizing: 'border-box',
      paddingHorizontal: 20,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accentGlow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
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
    toolbar: {
      paddingHorizontal: spacing.lg,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: 8,
    },
    clearBtn: {
      marginLeft: 'auto',
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    clearLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '700',
    },
    gearBtn: {
      position: 'absolute',
      top: HEADER_TOP_GAP - 6,
      right: spacing.lg - 6,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gearBtnPressed: {
      backgroundColor: colors.surface,
    },
    categoryRow: {
      gap: 8,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    categoryChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    categoryLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    categoryLabelActive: {
      color: colors.accent,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      maxHeight: '70%',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 4,
    },
    modalSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: spacing.sm,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    modalOptionActive: {
      backgroundColor: colors.accentSoft,
    },
    modalOptionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    modalCheck: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '800',
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      flexGrow: 1,
    },
    empty: {
      alignItems: 'center',
      paddingTop: 56,
    },
    emptyMark: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentMuted,
      marginBottom: 16,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptyCopy: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      maxWidth: 240,
    },
  });

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Root />
    </SafeAreaProvider>
  );
}
