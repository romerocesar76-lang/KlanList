// src/theme.js

export const colors = {
  bg:           '#FFFFFF',
  bgSoft:       '#F8F7F4',
  surface:      '#FFFFFF',
  border:       '#EBEBEB',
  borderMd:     '#D4D2CC',
  text:         '#181818',
  text2:        '#696760',
  text3:        '#AAAAA8',
  accent:       '#4338CA',
  accentDark:   '#3730A3',
  accentSoft:   '#EEF2FF',
  red:          '#DC2626',
  redSoft:      '#FEF2F2',
  green:        '#16A34A',
  white:        '#FFFFFF',
};

export const radius = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
};

export const shadow = {
  shadowColor:   '#000',
  shadowOffset:  { width: 0, height: 1 },
  shadowOpacity: 0.07,
  shadowRadius:  4,
  elevation:     2,
};

// Avatar palette — deterministic by name
const PALETTE = [
  { bg: '#EEF2FF', fg: '#3730A3' },
  { bg: '#ECFDF5', fg: '#065F46' },
  { bg: '#FFF7ED', fg: '#9A3412' },
  { bg: '#FDF4FF', fg: '#6B21A8' },
  { bg: '#FFFBEB', fg: '#92400E' },
  { bg: '#F0FDF4', fg: '#166534' },
  { bg: '#EFF6FF', fg: '#1E40AF' },
  { bg: '#FEF2F2', fg: '#991B1B' },
];

export function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
