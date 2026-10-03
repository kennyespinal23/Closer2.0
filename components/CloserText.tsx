import { createContext, forwardRef, useContext } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet, type TextProps, type TextInputProps, type TextStyle } from 'react-native';
import { interfaceFont } from '@/lib/interfaceFont';

const TextContext = createContext<TextStyle>({});
// Keep semantic (unresolved) weight in context so nested spans inherit the right face.
export const Text = forwardRef<NativeText, TextProps>(function CloserText({ style, ...props }, ref) {
  const inherited = useContext(TextContext);
  const flattened = StyleSheet.flatten(style) ?? {};
  const semantic = { ...inherited, ...flattened };
  return <TextContext.Provider value={semantic}><NativeText ref={ref} {...props} style={[style, interfaceFont(flattened, inherited)]}/></TextContext.Provider>;
});
export type Text = NativeText;
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function CloserTextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={[style, interfaceFont(StyleSheet.flatten(style) ?? {})]}/>;
});
export type TextInput = NativeTextInput;
