export const Colors = {
  background: '#000000',
  card: '#111111',
  cardLight: '#1A1A1A',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  active: '#22C55E',
  alert: '#FF3B3B',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#27272A',
  yellow: '#FACC15',
  purple: '#8B5CF6',
  orange: '#F97316',
} as const;

export type ColorType = keyof typeof Colors;
