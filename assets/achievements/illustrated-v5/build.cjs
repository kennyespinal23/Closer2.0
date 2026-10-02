const fs=require('node:fs'),path=require('node:path');
const root=__dirname,prior=path.join(root,'../illustrated-v4');
const manifest=JSON.parse(fs.readFileSync(path.join(prior,'manifest.json')));
const anchors=new Set(['letters-1','streak-7','streak-30','genesis','garden','amen']);
const vivid=new Set(['letters-7','streak-100','moment']);
// Interior, bright enamel edge, saturated enamel, shaded enamel, secondary enamel.
const colors={
'letters-30':['#40204e','#ffd3fa','#dc62ce','#76248d','#ffce76'],
'letters-100':['#442334','#ffe4aa','#ff9c44','#b94335','#ffdb87'],
'streak-1':['#452039','#ffe1a4','#ff9762','#d53d4d','#ffcd87'],
'chapter':['#302363','#f6e6ff','#b89aff','#7050d4','#f5d7ff'],
'highlight':['#383725','#fff8b4','#ffda32','#d28b0c','#ffea8c'],
'note':['#073f47','#c4fff0','#22d8b2','#087f89','#ffda96'],
'listener':['#302061','#e5c6ff','#b060ff','#6224c8','#ffb9e4'],
'express':['#4e2427','#fff0b4','#ffb32e','#ea5d16','#ffe6a2'],
'law':['#183c5b','#e2f7ff','#72b5f3','#346aac','#efcc8c'],
'bible':['#103d39','#d9ffdd','#47d399','#118761','#ffe1a1'],
 'ten':['#4b2a31','#fff5b4','#ffc943','#b57714','#fff0b2'],
 'all':['#302449','#f7e0ff','#c587ff','#8050d9','#b6f4fb'],
 'honest':['#4f1e41','#ffe1f2','#ff68a8','#c42a76','#ffd2e6'],
 'quiz':['#183856','#e4f7ff','#60bbff','#216ed5','#bae7ff'],
 'verse':['#203e32','#efffc7','#a1db48','#529628','#ffdf99']
};
const highlights={
'letters-30':'M94 128Q145 88 204 127M93 175V216M93 172H128',
'letters-100':'M96 134Q96 107 116 107M162 109H177M95 180V151',
'streak-1':'M156 116Q164 105 164 98',
'chapter':'M111 92V204M120 91H162',
'highlight':'M160 151L193 111M94 147H118',
'note':'M119 179L181 107M108 195L113 201',
'listener':'M109 116Q125 85 155 89M89 154V178M198 146H209',
'express':'M157 93L118 147M152 168L142 206',
'law':'M86 123Q86 95 108 95M166 122Q166 96 186 96',
'bible':'M87 116Q111 108 136 121M163 122Q184 109 211 116',
 'ten':'M113 112V143Q113 162 124 170M120 223H137',
 'all':'M100 149L112 183M152 110L174 144M111 208H137',
 'honest':'M97 134Q96 113 117 112M98 145Q100 159 113 171',
 'quiz':'M93 145Q112 126 130 124',
 'verse':'M118 91V208M128 90H182'
};
const grad=(id,stops)=>`<linearGradient id="${id}" x2=".8" y2="1">${stops.map((c,i)=>`<stop offset="${i/(stops.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const setGrad=(s,id,stops)=>s.replace(new RegExp('<linearGradient id="'+id+'"[\\s\\S]*?</linearGradient>'),grad(id,stops));
const data=manifest.badges.map(x=>{
 let s=fs.readFileSync(path.join(prior,x.asset),'utf8');let status='Approved · unchanged';
 if(vivid.has(x.id)){s=fs.readFileSync(path.join(root,'../vivid-study',x.id+'-new.svg'),'utf8');x.background={light:x.id==='moment'?'#d4bdf8':x.id==='letters-7'?'#b9edf1':'#f5d492',dark:x.id==='moment'?'#354177':x.id==='letters-7'?'#443071':'#315d42'};}
 if(colors[x.id]){const c=colors[x.id];status='New enamel finish';
 s=setGrad(s,'sky',[c[0],'#0b1528']);
 for(const g of ['blue','green','fire'])s=setGrad(s,g,[c[1],c[2],c[3]]);
 s=setGrad(s,'pink',[c[4],c[1],c[2]]);
 const gold=x.material.includes('gold'),rose=x.material.includes('rose');
 s=setGrad(s,'rim',gold?['#fff1ad','#cb9129','#fff5be','#825415','#efc665']:rose?['#ffe7d2','#cc8267','#ffdab7','#743b4b','#f4b18e']:['#f5fcff','#7299b7','#e7faff','#405e88','#c3def1']);
 s=s.replace('</defs>','<filter id="relief" x="-25%" y="-25%" width="160%" height="170%"><feDropShadow dx="2" dy="5" stdDeviation="2.2" flood-color="#000d1f" flood-opacity=".6"/></filter></defs>');
 s=s.replace('<g clip-path="url(#inside)">','<g clip-path="url(#inside)"><g filter="url(#relief)">');
 s=s.replace('<path class="shine"',`</g><path d="${highlights[x.id]}" fill="none" stroke="${c[1]}" stroke-width="3" stroke-linecap="round" opacity=".85"/><path class="shine"`);
 x.background={light:c[1],dark:c[0]};
 }
 fs.writeFileSync(path.join(root,x.asset),s);return {...x,svg:s,status};
});
let template=fs.readFileSync(path.join(root,'../source/gallery-template.html'),'utf8').replace('A collection worth keeping.','Rich color. A story in every badge.').replace('Different stories, different materials. Choose a badge to explore its reveal and its own atmosphere.','All 24 achievements, with the approved enamel direction carried through the collection.').replace("$('.description').textContent=copy[x.family]","$('.description').textContent=x.description").replace('/* COLLECTION_DATA */',JSON.stringify(data));
fs.writeFileSync(path.join(root,'index.html'),template);
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({status:'review-only',badges:data.map(({svg,...x})=>x)},null,2));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Closer · Full enamel collection</title><style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#eeeae4;color:#302922;font-family:-apple-system,BlinkMacSystemFont,sans-serif}header{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:22px}h1{font-size:29px;letter-spacing:-1px;margin:0 0 8px}p{margin:0;color:#7b7066;font-size:14px}a{color:inherit;font-size:14px}main{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}article{border-radius:20px;background:#fffaf2;border:1px solid #d9d0c4;overflow:hidden;text-align:center}.art{height:120px;background:linear-gradient(150deg,var(--tone),#141c29);display:grid;place-items:center}img{height:115px;width:100%;filter:drop-shadow(0 6px 4px #0004)}h2{font-size:13px;margin:12px 4px 6px}small{display:block;color:#8b7d70;font-size:10px;margin-bottom:13px}@media(max-width:780px){main{grid-template-columns:repeat(3,minmax(0,1fr))}header{display:block}header a{display:block;margin-top:14px}}@media(max-width:450px){body{padding:18px}main{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><header><div><h1>The complete enamel collection.</h1><p>Nine approved designs preserved. Fifteen updated with richer color and sculpted highlights.</p></div><a href="index.html">Explore each badge →</a></header><main>${data.map(x=>`<article><div class="art" style="--tone:${x.background.dark}"><img src="${x.asset}" alt="${x.title}"></div><h2>${x.title}</h2><small>${x.status}</small></article>`).join('')}</main></html>`;
fs.writeFileSync(path.join(root,'collection.html'),html);
