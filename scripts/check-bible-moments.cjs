// Run with node scripts/check-bible-moments.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const data = require('../constants/bibleMomentsData.json');
assert.equal(data.length, 78);
assert.equal(new Set(data.map(m => m.id)).size, 78);
const totals = {};
const anchors = new Set();
for (const moment of data) {
  assert(moment.tags.includes(moment.category));
  for (const tag of moment.tags) totals[tag] = (totals[tag] || 0) + 1;
  for (const anchor of [moment, ...(moment.additionalAnchors || [])]) {
    const bible = require(`../assets/bibles/web/${anchor.bookId}.json`);
    const chapter = bible.chapters.find(c => c.chapter === anchor.chapter);
    assert(chapter, moment.id);
    for (let verse = anchor.verse; verse <= anchor.endVerse; verse++) {
      assert(chapter.verses.some(v => v.number === verse), moment.id);
      const key = `${anchor.bookId}/${anchor.chapter}/${verse}`;
      assert(!anchors.has(key), `Unresolved overlapping verse: ${key}`);
      anchors.add(key);
    }
    if (anchor === moment) {
      assert.equal(moment.happened, chapter.verses.filter(v => v.number >= anchor.verse && v.number <= anchor.endVerse).map(v => v.text).join(' '));
    }
  }
}
assert.deepEqual(totals, { 'turning-points': 26, prophecy: 14, lessons: 14, changed: 15, promises: 14 });
function loadTS(file, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    assert(name in dependencies, `Unexpected dependency ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const catalog = loadTS('constants/bibleMoments.ts', { './bibleMomentsData.json': data });
assert.equal(catalog.findBibleMoment('isaiah', 7, 14).id, 'emmanuel');
assert.equal(catalog.findBibleMoment('matthew', 1, 23).id, 'emmanuel');
assert.equal(catalog.findBibleMoment('john', 10, 14).id, catalog.findBibleMoment('john', 10, 15).id);
assert.equal(catalog.findBibleMoment('genesis', 1, 2), undefined);
const disk = new Map([['closer.bible-moment.creation.v1', 'true'], ['closer.bible-moment.resurrection.v1', 'true']]);
let failWrite = false;
const makeStore = () => loadTS('state/bibleMoments.ts', {
  '@/constants/bibleMoments': catalog,
  react: { useEffect: () => {}, useSyncExternalStore: (_, get) => get() },
  '@react-native-async-storage/async-storage': {
    multiGet: async keys => keys.map(key => [key, disk.get(key) ?? null]),
    setItem: async (key, value) => { if (failWrite) throw Error('Disk unavailable'); disk.set(key, value); },
  },
});
(async () => {
  const store = makeStore();
  await store.hydrateBibleMoments();
  assert.deepEqual([...store.useBibleMomentCollection().ids].sort(), ['creation', 'resurrection']);
  const results = await Promise.all([store.unlockBibleMoment('good-shepherd'), store.unlockBibleMoment('good-shepherd')]);
  assert.equal(results.filter(r => r === 'new').length, 1);
  assert.equal(store.useBibleMomentCollection().ids.length, 3);
  failWrite = true;
  await assert.rejects(store.unlockBibleMoment('first-promise'));
  assert(!store.useBibleMomentCollection().ids.includes('first-promise'));
  failWrite = false;
  await store.unlockBibleMoment('first-promise');
  const restarted = makeStore();
  await restarted.hydrateBibleMoments();
  assert.equal(restarted.useBibleMomentCollection().ids.length, 4);
  assert.equal(await restarted.unlockBibleMoment('first-promise'), 'existing');
  console.log(`Verified 78 cards, ${anchors.size} verse triggers, category totals, legacy unlocks, concurrent discovery, write failure, and relaunch persistence.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
