import AsyncStorage from '@react-native-async-storage/async-storage';
import { HIGHLIGHT_COLORS, type HighlightColorId } from '@/state/annotations';
let last: HighlightColorId = 'amber';
let changed = false;
void AsyncStorage.getItem('closer.reader.lastHighlight').then(value => { if (!changed && HIGHLIGHT_COLORS.some(c => c.id === value)) last = value as HighlightColorId; }).catch(() => {});
export const lastReaderHighlight = () => last;
export function rememberReaderHighlight(color: HighlightColorId) { changed = true; last = color; void AsyncStorage.setItem('closer.reader.lastHighlight', color).catch(() => {}); }
