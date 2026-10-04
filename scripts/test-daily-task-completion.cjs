const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/dailyTaskCompletion.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported });
const eligible = exported.canCompleteDailyTasks;
for (let mask = 0; mask < 16; mask++) {
  assert.equal(eligible(3, '2026-10-04', { prayer: !!(mask & 1), quiz: !!(mask & 2), action: !!(mask & 4) }, mask & 8 ? [{ day: 3, dateISO: '2026-10-04' }] : []), mask === 15);
}
const complete = { prayer: true, quiz: true, action: true };
assert.equal(eligible(3, '2026-10-04', complete, [{ day: 2, dateISO: '2026-10-04' }]), false);
assert.equal(eligible(3, '2026-10-04', complete, [{ day: 3, dateISO: '2026-10-03' }]), false);
console.log('Daily streak: all 16 task combinations, different readings, and previous dates passed.');
