// Run with node scripts/check-express-books.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const books = require('../constants/expressBooksData.json');
const source = fs.readFileSync(path.join(root, 'docs/content/EXPRESS_VERSIONS_SOURCE.md'), 'utf8');
const headings = [...source.matchAll(/^#{2,3} (.+?) \((\d+) (scenes|beats)\)\s*$/gm)];
assert.equal(books.length, 44);
assert.equal(new Set(books.map(book => book.bookId)).size, 44);
assert.equal(books.reduce((n, book) => n + book.scenes.length, 0), 174);
assert.equal(books.filter(book => book.kind === 'beats').length, 10);
for (const [i, book] of books.entries()) {
  const heading = headings[i];
  assert.equal(book.bookId, heading[1].toLowerCase().replaceAll(' ', '-'));
  assert.equal(book.scenes.length, Number(heading[2]));
  assert.equal(book.kind, heading[3]);
  const block = source.slice(heading.index + heading[0].length, headings[i + 1]?.index ?? source.length);
  const entries = [...block.matchAll(book.kind === 'scenes' ? /\*\*Scene (\d+): (.+?)\*\*\s*\n([^\n]+)/g : /^(\d+)\. \*\*(.+?)\*\* — (.+)$/gm)];
  for (const [j, scene] of book.scenes.entries()) {
    assert.equal(scene.title, entries[j][2]);
    assert.equal(scene.body, entries[j][3]);
    assert(scene.passages.length > 0);
    for (const passage of scene.passages) {
      assert(passage.startChapter < passage.endChapter || (passage.startChapter === passage.endChapter && passage.startVerse <= passage.endVerse));
      const bible = require(`../assets/bibles/web/${passage.bookId}.json`);
      for (const [chapter, verse] of [[passage.startChapter, passage.startVerse], [passage.endChapter, passage.endVerse]]) {
        assert(bible.chapters.find(c => c.chapter === chapter)?.verses.some(v => v.number === verse), `${book.bookId}: ${passage.reference}`);
      }
    }
  }
}
const excluded = ['psalms','proverbs','ecclesiastes','song-of-solomon','ruth','jonah','obadiah','nahum','habakkuk','haggai','malachi','philemon','titus','1-john','2-john','3-john','jude','philippians','1-thessalonians','2-thessalonians','james','2-peter'];
for (const id of excluded) assert(!books.some(book => book.bookId === id));
const progressSource = fs.readFileSync(path.join(root, 'state/expressProgress.ts'), 'utf8');
const code = ts.transpileModule(progressSource, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const moduleStub = { exports: {} };
new Function('require', 'module', 'exports', code)(() => ({}), moduleStub, moduleStub.exports);
const normalize = moduleStub.exports.normalizeExpressProgress;
assert.deepEqual(normalize(null, 6), { index: 0, completed: false });
assert.deepEqual(normalize({ index: 3, completed: false }, 6), { index: 3, completed: false });
assert.deepEqual(normalize({ index: 6, completed: false }, 6), { index: 6, completed: true });
assert.deepEqual(normalize({ index: 0, completed: true }, 6), { index: 0, completed: true });
assert.deepEqual(normalize({ index: -2 }, 6), { index: 0, completed: false });
assert.deepEqual(normalize({ index: '3' }, 6), { index: 0, completed: false });
assert.deepEqual(normalize({ index: 100 }, 6), { index: 6, completed: true });
const reader = fs.readFileSync(path.join(root, 'app/book/[id]/[chapter].tsx'), 'utf8');
assert(!/isRedLetterVerse|redLetterColor|jesusInk|isJesus/.test(reader));
assert(!/useProgress|unlockBibleMoment|recordCompletion/.test(progressSource));
console.log('Verified 44 books, 174 verbatim scenes/beats, 22 exclusions, passage endpoints, saved-position validation, and removal of red-letter styling.');
