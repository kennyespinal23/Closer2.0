// No additional test dependency: execute the pure reward rules and collection store with storage mocks.
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
function load(path, imports) {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(js, { exports: module.exports, module, require: imports });
  return module.exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
const { BOOKS } = load('constants/books.ts', require);
const { earnedBibleReadingRewards: earned } = load('lib/bibleReadingRewards.ts', () => ({ BOOKS }));
const rows = books => books.flatMap(b => Array.from({ length: b.chapters }, (_, i) => ({ bookId: b.id, chapter: i + 1 })));
const old = rows(BOOKS.filter(b => b.testament === 'old'));
const fresh = rows(BOOKS.filter(b => b.testament === 'new'));
assert.deepEqual(plain(earned([])), []);
assert.deepEqual(plain(earned(old.slice(1))), []);
assert.deepEqual(plain(earned([...old.slice(1), old[1]])), []);
assert.deepEqual(plain(earned(old)), ['old-gold']);
assert.deepEqual(plain(earned(fresh)), ['new-gold']);
assert.deepEqual(plain(earned([...old, ...fresh])), ['old-gold', 'new-gold', 'crown']);
const BIBLE_MOMENTS = JSON.parse(fs.readFileSync('constants/bibleMomentsData.json', 'utf8'));
const saved = new Map();
let fail = false;
const storage = { multiGet: async keys => keys.map(k => [k, saved.get(k) ?? null]), setItem: async (k, v) => { if (fail) throw Error('Write failed'); saved.set(k, v); } };
const store = load('state/bibleMoments.ts', id => id === 'react' ? { useEffect() {}, useSyncExternalStore: (_, snapshot) => snapshot() } : id.includes('async-storage') ? { default: storage } : { BIBLE_MOMENTS });
(async () => {
  const genesis = BIBLE_MOMENTS.filter(m => m.bookId === 'genesis');
  fail = true;
  await assert.rejects(store.unlockBibleMomentWithRewards(genesis[0].id));
  assert.equal(store.useBibleMomentCollection().ids.length, 0);
  fail = false;
  const results = await Promise.all(genesis.map(m => store.unlockBibleMomentWithRewards(m.id)));
  assert.equal(results.filter(r => r.bookCompleted).length, 1);
  assert.equal(store.useBibleMomentCollection().ids.length, genesis.length);
  const repeat = await store.unlockBibleMomentWithRewards(genesis[0].id);
  assert.equal(repeat.status, 'existing');
  assert.equal(repeat.bookCompleted, false);
  // Reproduce a hydrated collection missing only Genesis 22:13–14.
  const finalId = 'god-provides';
  const nine = new Map(genesis.filter(m => m.id !== finalId).map(m => [`closer.bible-moment.${m.id}.v1`, 'true']));
  let writes = 0;
  const finalStorage = { multiGet: async keys => keys.map(k => [k, nine.get(k) ?? null]), setItem: async (k,v) => { writes++; nine.set(k,v); } };
  const finalStore = load('state/bibleMoments.ts', id => id === 'react' ? { useEffect() {}, useSyncExternalStore: (_, snapshot) => snapshot() } : id.includes('async-storage') ? { default: finalStorage } : { BIBLE_MOMENTS });
  await finalStore.hydrateBibleMoments();
  assert.equal(finalStore.useBibleMomentCollection().ids.length, 9);
  const first = finalStore.unlockBibleMomentWithRewards(finalId);
  const resubscribed = finalStore.unlockBibleMomentWithRewards(finalId);
  assert.equal(first, resubscribed);
  assert.equal((await resubscribed).bookCompleted, true);
  assert.equal(writes, 1);
  assert.equal(finalStore.useBibleMomentCollection().ids.length, 10);
  assert.equal(nine.get(`closer.bible-moment.${finalId}.v1`), 'true');
  assert.equal((await finalStore.unlockBibleMomentWithRewards(finalId)).bookCompleted, false);
  console.log('PASS: chapter thresholds, duplicate records, gold/Crown eligibility, failed save, concurrent book completion, repeat collection.');
})().catch(error => { console.error(error); process.exitCode = 1; });
