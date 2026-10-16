const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/dailyTaskCompletion.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported });
const eligible = exported.canCompleteDailyTasks;
// Exercise every supported subset of prayer, quiz, and action; reading is always required.
for (let required = 0; required < 8; required++) {
  const steps = ['reading', ...['prayer', 'quiz', 'action'].filter((_, i) => required & (1 << i))];
  for (let mask = 0; mask < 16; mask++) {
    const practice = { prayer: !!(mask & 1), quiz: !!(mask & 2), action: !!(mask & 4) };
    const readings = mask & 8 ? [{ day: 3, dateISO: '2026-10-04' }] : [];
    assert.equal(eligible(3, '2026-10-04', practice, readings, steps),
      !!(mask & 8) && (mask & required) === required,
      `required=${required}, completed=${mask}`);
  }
  const complete = { prayer: true, quiz: true, action: true };
  assert.equal(eligible(3, '2026-10-04', complete, [{ day: 2, dateISO: '2026-10-04' }], steps), false);
  assert.equal(eligible(3, '2026-10-04', complete, [{ day: 3, dateISO: '2026-10-03' }], steps), false);
}
console.log('PASS: 128 category task combinations, different readings, and previous dates.');
