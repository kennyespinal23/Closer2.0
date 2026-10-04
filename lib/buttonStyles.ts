import { StyleSheet } from 'react-native';
import { typography } from './typography';

/** Shared button geometry and label roles. Colors remain screen-specific.
 * label: full-size actions; compactLabel: toolbars/chips; textLabel: secondary links.
 * Tappable content cards keep their content typography; native system buttons retain system text.
 */
export const buttonStyles = StyleSheet.create({
  primary: {
    minHeight: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.button, fontWeight: '800', lineHeight: 24, letterSpacing: 0, textAlign: 'center', flexShrink: 1 },
  compactLabel: { fontFamily: 'System', fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: 0, textAlign: 'center', flexShrink: 1 },
  textLabel: { fontFamily: 'System', fontSize: 15, lineHeight: 22, fontWeight: '600', letterSpacing: 0, textAlign: 'center', flexShrink: 1 },
});
