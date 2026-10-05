const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript'), vm = require('node:vm');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/readerPagination.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports:api});
const {findVerseStartLines, paginateLines} = api;
function verify(verses, height=400, scale=1) {
 let y=0; const lines=[];
 for(const v of verses) {
  // Deliberately narrow wrapping stresses pagination; native layout is checked separately.
  const n=Math.max(1,Math.ceil(v.text.length/(26/scale)));
  for(let i=0;i<n;i++){lines.push({text:i===0?`${v.number}  ${v.text}`:'continued',y,height:30*scale});y+=30*scale;}
  lines.push({text:'\n',y,height:10*scale});y+=10*scale;
 }
 const starts=[...findVerseStartLines(lines,verses).values()];
 assert.equal(starts.length,verses.length);
 const pages=paginateLines(lines,height,130,starts,verses.length);
 const assigned=pages.flatMap(p=>Array.from({length:p.endVerseIdx-p.startVerseIdx+1},(_,i)=>p.startVerseIdx+i));
 assert.equal(JSON.stringify(assigned),JSON.stringify(verses.map((_,i)=>i)),'Every verse appears exactly once');
 for(const p of pages) if(p.contentHeight>height-(p.isFirst?130:0)) assert.equal(p.startVerseIdx,p.endVerseIdx,'Only single oversized verses may scroll');
}
verify([{number:0,text:'Title'},{number:1,text:'First'},{number:3,text:'Omitted second verse'},{number:5,text:'Long '.repeat(600)},{number:6,text:'End'}]);
let chapters=0;
for(const file of fs.readdirSync('assets/bibles/web').filter(f=>f.endsWith('.json'))) {
 const book=JSON.parse(fs.readFileSync(`assets/bibles/web/${file}`,'utf8'));
 for(const chapter of book.chapters){for(const scale of [.88,1,1.15,1.32])verify(chapter.verses,400,scale);chapters++;}
}
for(const count of [1,5,100])assert.equal(paginateLines([],400,130,[],count).length,count);
console.log(`Pagination passed: ${chapters} bundled chapters at four sizes, numbering gaps, long verses, and measurement fallback.`);
