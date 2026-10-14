import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoriesFromStorage, todosFromStorage } from './todos';
import type { Category, InsertEdge, ThemePreference, Todo } from './types';

// Same keys as before: existing saved todos and the T/B choice load unchanged.
export const TODO_STORAGE_KEY = 'noir-list.todos.v1';
export const INSERT_EDGE_STORAGE_KEY = 'noir-list.insert-edge.v1';
export const THEME_STORAGE_KEY = 'noir-list.theme.v1';
export const CATEGORIES_STORAGE_KEY = 'noir-list.categories.v1';

let writeQueue: Promise<void> = Promise.resolve();

function queueWrite(key: string, value: string): Promise<void> {
  const write = writeQueue.then(() => AsyncStorage.setItem(key, value));
  writeQueue = write.then(
    () => undefined,
    () => undefined,
  );
  return write.catch(() => undefined);
}

export async function loadTodos(): Promise<Todo[]> {
  try {
    const raw = await AsyncStorage.getItem(TODO_STORAGE_KEY);
    return todosFromStorage(raw);
  } catch {
    return todosFromStorage(null);
  }
}

export function saveTodos(todos: readonly Todo[]): Promise<void> {
  return queueWrite(TODO_STORAGE_KEY, JSON.stringify(todos));
}

export async function loadInsertEdge(): Promise<InsertEdge> {
  try {
    const raw = await AsyncStorage.getItem(INSERT_EDGE_STORAGE_KEY);
    return raw === 'bottom' ? 'bottom' : 'top';
  } catch {
    return 'top';
  }
}

export function saveInsertEdge(edge: InsertEdge): Promise<void> {
  return queueWrite(INSERT_EDGE_STORAGE_KEY, edge);
}

// Default stays dark so the app looks the same after updating until the user picks.
export async function loadTheme(): Promise<ThemePreference> {
  try {
    const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'dark' || raw === 'light' || raw === 'system' ? raw : 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: ThemePreference): Promise<void> {
  return queueWrite(THEME_STORAGE_KEY, theme);
}

export async function loadCategories(): Promise<Category[]> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
    return categoriesFromStorage(raw);
  } catch {
    return [];
  }
}

export function saveCategories(categories: readonly Category[]): Promise<void> {
  return queueWrite(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
}
