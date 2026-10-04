const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/onboardingOpening.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports});
const {openingBeatAt:beat,OPENING_BEATS:copy}=mod.exports;
assert.equal(copy.length,4);
assert.equal(beat(0).index,-1);
assert.equal(beat(2).index,0);
assert.equal(beat(8).index,1);
assert.equal(beat(12).index,2);
assert.equal(beat(15.6).index,-1);
assert.equal(beat(17).index,3);
assert.equal(beat(200).opacity,1);
for(let t=0;t<22;t+=.03){const b=beat(t);assert.ok(Number.isFinite(b.opacity)&&b.opacity>=0&&b.opacity<=1);}
for(const t of [3,8,12,17])assert.equal(beat(t).opacity,1);
console.log('Opening text windows, gaps, fades, and indefinite final hold passed.');
