import type { TextStyle } from 'react-native';

export const NUNITO_FONTS = {
  400: 'NunitoRegular', 500: 'NunitoMedium', 600: 'NunitoSemiBold',
  700: 'NunitoBold', 800: 'NunitoExtraBold', 900: 'NunitoBlack',
} as const;

export const SCRIPTURE_ITALIC = 'NunitoSemiBoldItalic';

/** Explicit faces avoid synthetic weights and preserve Scripture/handwritten families. */
export function interfaceFont(style: TextStyle, inherited: TextStyle = {}): TextStyle {
  const family = style.fontFamily ?? inherited.fontFamily;
  if (family && family !== 'System' && !family.startsWith('Nunito')) return {};
  // Nunito ships one italic face: Scripture's. Any italic Nunito text uses it.
  if (family?.endsWith('Italic') || (style.fontStyle ?? inherited.fontStyle) === 'italic') return { fontFamily: SCRIPTURE_ITALIC, fontWeight: '600', fontStyle: 'normal' };
  const weight = style.fontWeight ?? inherited.fontWeight ?? '400';
  const numeric = weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight);
  const size = style.fontSize ?? inherited.fontSize ?? 17;
  // Headings are Extra bold (basics picker): big bold text and anything asked for at 900 use 800.
  const heading = size >= 28 && numeric >= 700;
  const resolved = heading || numeric >= 800 ? 800 : numeric >= 700 ? 700 : numeric >= 600 ? 600 : numeric >= 500 ? 500 : 400;
  return { fontFamily: NUNITO_FONTS[resolved], fontWeight: String(resolved) as TextStyle['fontWeight'], ...(heading ? { letterSpacing: -.02 * size } : {}) };
}
