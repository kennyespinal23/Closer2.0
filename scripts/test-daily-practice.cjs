const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const data = new Map();
let day = '2026-10-04', fail = false;
const storage = { getItem: async k => data.get(k) ?? null, setItem: async (k,v) => { if(fail) throw Error('disk full'); data.set(k,v); }, multiSet: async rows => { for (const [k,v] of rows) data.set(k,v); } };
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/dailyPractice.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText, {
  exports: exportsObject, require: n => n.includes('async-storage') ? storage : n === 'react' ? { useEffect: fn => fn(), useState: initial => [initial, () => {}] } : { todayISO: () => day },
});
(async () => {
  data.set('closer.daily-practice.test.v1', JSON.stringify({prayer:true}));
  const first = exportsObject.useDailyPractice('test');
  await first.save('quiz', 2);
  const current = exportsObject.useDailyPractice('test');
  assert.equal(current.saved.prayer,true); assert.equal(current.saved.quiz,true); assert.equal(current.saved.quizScore,2);
  fail=true; await assert.rejects(()=>current.save('action')); fail=false;
  assert.equal(exportsObject.useDailyPractice('test').saved.action,undefined);
  day='2026-10-05'; const tomorrow=exportsObject.useDailyPractice('test'); await tomorrow.save('action');
  const next=exportsObject.useDailyPractice('test'); assert.equal(next.saved.prayer,undefined); assert.equal(next.saved.quiz,undefined); assert.equal(next.saved.action,true);
  assert.equal(JSON.parse(data.get('closer.daily-practice.test.2026-10-04.v2')).quizScore,2);
  console.log('PASS: migration, shared completion, quiz score, failed-save rollback, and next-day reset');
})().catch(e=>{console.error(e);process.exitCode=1});
