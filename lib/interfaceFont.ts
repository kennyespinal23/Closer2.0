import type { TextStyle } from 'react-native';

export const NUNITO_FONTS = {
  400: 'NunitoRegular', 500: 'NunitoMedium', 600: 'NunitoSemiBold',
  700: 'NunitoBold', 800: 'NunitoExtraBold', 900: 'NunitoBlack',
} as const;

/** Explicit faces avoid synthetic weights and preserve Scripture/handwritten families. */
export function interfaceFont(style: TextStyle, inherited: TextStyle = {}): TextStyle {
  const family = style.fontFamily ?? inherited.fontFamily;
  if (family && family !== 'System' && !family.startsWith('Nunito')) return {};
  const weight = style.fontWeight ?? inherited.fontWeight ?? '400';
  const numeric = weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight);
  const size = style.fontSize ?? inherited.fontSize ?? 17;
  const resolved = size >= 28 && numeric >= 700 ? 900 : numeric >= 900 ? 900 : numeric >= 800 ? 800 : numeric >= 700 ? 700 : numeric >= 600 ? 600 : numeric >= 500 ? 500 : 400;
  return { fontFamily: NUNITO_FONTS[resolved], fontWeight: String(resolved) as TextStyle['fontWeight'], ...(resolved === 900 ? { letterSpacing: -.02 * size } : {}) };
}
