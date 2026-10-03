// Exercise the real hold handlers with a controlled animation clock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const test = require('node:test');
function mount() {
  const cleanups = [], completions = [];
  let background, unwraps = 0;
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    '@/components/CloserText': { Text: 'Text' },
    '@/lib/buttonStyles': { buttonStyles: { primary: {}, label: {} } },
    react: { useRef: current => ({ current }), useEffect: fn => cleanups.push(fn()) },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Pressable: 'Pressable', Text: 'Text', StyleSheet: { create: x => x, absoluteFill: {} }, AppState: { addEventListener: (_, fn) => { background = fn; return { remove() {} }; } } },
    'react-native-reanimated': { default: { View: 'Animated.View', createAnimatedComponent: x => x }, useSharedValue: value => ({ value }), useAnimatedStyle: fn => fn(), cancelAnimation() {}, Easing: { linear: x => x }, withTiming: (value, config, callback) => { if (callback) completions.push(callback); return value; }, runOnJS: fn => fn },
    'react-native-gesture-handler': {}, 'react-native-svg': {},
    '@/lib/useReducedMotion': {}, '@/state/theme': { useResolvedScheme: () => 'light' }, './ReaderMaterialGradient': {}, '@/lib/haptics': { soft() {}, success() {} },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('components/OnboardingBibleReveal.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  const button = module.exports.HoldToUnwrap({ onUnwrap: () => unwraps++ }).props;
  return { button, finish: (index = -1) => completions.at(index)(true), background: () => background('background'), unmount: () => cleanups.forEach(fn => fn?.()), count: () => unwraps };
}
test('early release ignores an already queued animation completion', () => {
  const x = mount(); x.button.onPressIn(); x.button.onPressOut(); x.finish(); assert.equal(x.count(), 0);
});
test('completed hold unwraps exactly once', () => {
  const x = mount(); x.button.onPressIn(); x.finish(); x.finish(); x.button.onAccessibilityTap(); assert.equal(x.count(), 1);
});
test('backgrounding cancels the hold', () => {
  const x = mount(); x.button.onPressIn(); x.background(); x.finish(); assert.equal(x.count(), 0);
});
test('leaving the screen cannot complete a pending hold', () => {
  const x = mount(); x.button.onPressIn(); x.unmount(); x.finish(); assert.equal(x.count(), 0);
});
test('VoiceOver activation unwraps without a physical hold', () => {
  const x = mount(); x.button.onAccessibilityTap(); assert.equal(x.count(), 1);
});

test('a canceled hold cannot complete a newer hold', () => {
  const x = mount(); x.button.onPressIn(); x.button.onPressOut(); x.button.onPressIn(); x.finish(0); assert.equal(x.count(), 0); x.finish(); assert.equal(x.count(), 1);
});
