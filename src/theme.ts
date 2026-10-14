import { createContext, useContext } from 'react';

export type Palette = {
  scheme: 'dark' | 'light';
  bg: string;
  bgElevated: string;
  surface: string;
  border: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  accentMuted: string;
  complete: string;
  text: string;
  textMuted: string;
  textDim: string;
  /** Text and icons drawn on top of the accent color. */
  onAccent: string;
};

export const darkColors: Palette = {
  scheme: 'dark',
  bg: '#070708',
  bgElevated: '#111114',
  surface: '#18181C',
  border: '#2A2A32',
  accent: '#E11D48',
  accentSoft: 'rgba(225, 29, 72, 0.16)',
  accentGlow: 'rgba(225, 29, 72, 0.45)',
  accentMuted: '#BE123C',
  complete: '#22C55E',
  text: '#F5F5F7',
  textMuted: '#8A8A96',
  textDim: '#5C5C66',
  onAccent: '#F5F5F7',
};

export const lightColors: Palette = {
  scheme: 'light',
  bg: '#F4F4F6',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#DEDEE4',
  accent: '#E11D48',
  accentSoft: 'rgba(225, 29, 72, 0.10)',
  accentGlow: 'rgba(225, 29, 72, 0.30)',
  accentMuted: '#BE123C',
  complete: '#16A34A',
  text: '#111114',
  textMuted: '#5C5C66',
  textDim: '#9A9AA6',
  onAccent: '#FFFFFF',
};

/** Dark palette, kept for any code that still imports a static palette. */
export const colors = darkColors;

export const ThemeContext = createContext<Palette>(darkColors);

export function useColors(): Palette {
  return useContext(ThemeContext);
}

export const spacing = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  md: 16,
  pill: 999,
};
