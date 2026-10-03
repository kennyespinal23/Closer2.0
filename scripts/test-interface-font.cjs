const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/interfaceFont.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: moduleUnderTest, exports: moduleUnderTest.exports });
const { interfaceFont: font } = moduleUnderTest.exports;
assert.equal(font({fontSize:36,fontWeight:'700'}).fontFamily,'NunitoBlack');
assert.equal(font({fontSize:17,fontWeight:'800'}).fontFamily,'NunitoExtraBold');
assert.equal(font({fontSize:17}).fontFamily,'NunitoRegular');
assert.equal(font({}, {fontSize:36,fontWeight:'700'}).fontFamily,'NunitoBlack');
for (const family of ['Georgia','ui-serif','ShantellSans_700Bold']) {
  assert.equal(Object.keys(font({fontFamily:family})).length,0);
  assert.equal(Object.keys(font({}, {fontFamily:family})).length,0);
}
assert.equal(font({fontFamily:'System',fontSize:17},{fontFamily:'Georgia'}).fontFamily,'NunitoRegular');
console.log('Font roles and nested Scripture/handwriting preservation passed.');
