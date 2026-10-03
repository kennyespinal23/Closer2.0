import { StyleSheet } from 'react-native';
import { typography } from './typography';

/** Shared geometry for full-size primary actions; colors remain screen-specific. */
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
  label: { ...typography.button, fontWeight: '800', lineHeight: 24, textAlign: 'center' },
});
