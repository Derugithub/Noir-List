import type { Category, Todo } from './types';

export const SEED_TODOS: readonly Todo[] = [
  { id: '1', text: 'Sketch the crimson layout', done: true, createdAt: 1 },
  { id: '2', text: 'Ship the first todo', done: false, createdAt: 2 },
];

function seedTodos(): Todo[] {
  return SEED_TODOS.map((todo) => ({ ...todo }));
}

function isTodo(value: unknown): value is Todo {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    typeof record.text === 'string' &&
    typeof record.done === 'boolean' &&
    typeof record.createdAt === 'number' &&
    Number.isFinite(record.createdAt)
  );
}

// Missing or unreadable data uses the first-launch seed.
// An empty array is a saved list. Invalid entries are dropped and order is kept.
// A non-empty payload with nothing usable falls back to the seed.
export function todosFromStorage(raw: string | null): Todo[] {
  if (raw == null || raw.trim() === '') return seedTodos();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return seedTodos();
  }

  if (!Array.isArray(parsed)) return seedTodos();
  if (parsed.length === 0) return [];

  const todos: Todo[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    if (!isTodo(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    todos.push({
      id: item.id,
      text: item.text,
      done: item.done,
      createdAt: item.createdAt,
      // Older saves have no category. They stay uncategorized and show under All.
      ...(typeof (item as Record<string, unknown>).categoryId === 'string'
        ? { categoryId: (item as Record<string, unknown>).categoryId as string }
        : {}),
    });
  }

  return todos.length > 0 ? todos : seedTodos();
}

function isCategory(value: unknown): value is Category {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    typeof record.name === 'string' &&
    record.name.trim().length > 0
  );
}

// Missing or unreadable data means no categories yet.
export function categoriesFromStorage(raw: string | null): Category[] {
  if (raw == null || raw.trim() === '') return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: Category[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    if (!isCategory(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push({ id: item.id, name: item.name.trim() });
  }
  return out;
}
