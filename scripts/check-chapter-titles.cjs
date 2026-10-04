const assert = require('node:assert/strict');
const fs = require('node:fs');
const titles = require('../constants/chapterTitles.json');
const books = [...fs.readFileSync(require.resolve('../constants/books.ts'), 'utf8').matchAll(/id: "([^"]+)".*?chapters: (\d+)/g)];
assert.equal(books.length, 66);
assert.deepEqual(Object.keys(titles).sort(), books.map(b => b[1]).sort());
for (const [, id, count] of books) {
  assert.equal(titles[id].length, Number(count), `${id}: chapter count`);
  assert(titles[id].every(title => typeof title === 'string' && title.trim()), `${id}: empty title`);
}
assert.equal(Object.values(titles).flat().length, 1189);
console.log('Verified all 1,189 chapter titles across 66 books, with no missing or extra chapters.');
