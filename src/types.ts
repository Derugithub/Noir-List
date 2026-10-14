export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  /** Missing on todos saved before categories existed; those show only under All. */
  categoryId?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Filter = 'all' | 'active' | 'done';

/** Where the next task is inserted. Set in Settings. */
export type InsertEdge = 'top' | 'bottom';

/** Theme preference. "system" follows the Android setting. */
export type ThemePreference = 'system' | 'dark' | 'light';
