// Editable vector source for the review-only achievement collection.
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, '../assets/achievements');
const seed = require('../assets/achievements/source/approved-materials.json');
const symbols = {
 envelope: '<rect x="91" y="109" width="118" height="79" rx="10"/><path d="M94 113L150 156L206 113M95 184L131 153M205 184L169 153"/>',
 stack: '<path d="M86 170L150 202L217 165M86 150L150 182L217 145"/><path d="M86 123L149 94L216 123L150 157Z"/>',
 library: '<rect x="79" y="103" width="35" height="94" rx="5"/><rect x="118" y="92" width="35" height="105" rx="5"/><path d="M166 103L193 96L219 186L191 194ZM83 207H220M89 121H103M128 111H143"/>',
 match: '<path d="M140 203L160 144"/><path d="M157 146C127 145 128 117 156 90C156 110 181 108 179 126Q177 144 157 146Z"/>',
 sunrise: '<path d="M81 178H220M91 192H210M103 175A48 48 0 0 1 199 175M150 90V72M96 111L83 98M204 111L218 98M77 152H63M226 152H240"/>',
 sun: '<circle cx="150" cy="145" r="39"/><path d="M150 83V64M150 207V226M88 145H69M212 145H231M107 102L93 88M193 188L207 202M107 188L93 202M193 102L207 88"/>',
 page: '<path d="M99 87H169L202 120V211H99ZM169 87V122H202M116 145H184M116 163H184M116 181H165"/>',
 pencil: '<path d="M100 190L107 161L181 87L204 110L130 184ZM107 161L130 184M168 101L190 123M95 208H206"/>',
 note: '<path d="M92 88H210V172L170 212H92ZM170 212V172H210M113 114H185M113 135H185M113 156H151"/>',
 headphones: '<path d="M94 170V145A56 56 0 0 1 206 145V170"/><rect x="85" y="146" width="27" height="48" rx="11"/><rect x="188" y="146" width="27" height="48" rx="11"/><path d="M206 191Q202 214 163 210"/>',
 bolt: '<path d="M160 75L105 153H146L133 217L202 130H158Z"/>',
 law: '<path d="M88 109Q88 85 109 85Q130 85 130 109V209H88ZM138 109Q138 85 160 85Q181 85 181 109V209H138ZM192 103H216V209H192M101 120H119M101 137H119M151 120H169M151 137H169M101 154H119M151 154H169"/>',
 crown: '<path d="M90 116L116 143L150 95L185 143L210 116L196 192H104ZM104 207H196"/><circle cx="88" cy="108" r="5"/><circle cx="150" cy="87" r="5"/><circle cx="213" cy="108" r="5"/>',
 card: '<rect x="101" y="83" width="98" height="131" rx="10"/><path d="M150 112L158 137L182 146L158 154L150 180L142 154L119 146L142 137Z"/>',
 cards: '<rect x="92" y="96" width="90" height="118" rx="8" transform="rotate(-12 130 160)"/><rect x="119" y="81" width="90" height="118" rx="8" transform="rotate(8 160 140)"/><path d="M165 113L172 135L193 142L172 149L165 170L158 149L138 142L158 135Z"/>',
 olive: '<path d="M109 210Q167 166 179 87M142 179Q102 171 111 143Q143 143 142 179ZM159 151Q197 148 198 121Q164 121 159 151ZM170 122Q139 111 149 88Q177 95 170 122Z"/>',
 heart: '<path d="M150 204C37 137 116 72 150 124C184 72 263 137 150 204Z"/>',
 eye: '<path d="M79 150Q150 78 222 150Q150 223 79 150Z"/><circle cx="150" cy="150" r="24"/><path d="M143 151L150 159L164 141"/>',
 verse: '<path d="M83 111Q116 94 150 113Q184 94 217 111V193Q183 175 150 195Q116 175 83 193ZM150 115V195M150 87V66M119 88L108 72M180 88L192 73"/>',
};
const families={
 'Daily letters':{a:'#D68A5B',b:'#884C34',light:'#EED2AB',dark:'#694028',metal:'copper',material:'Copper · Folded paper',motion:'unfold'},
 'Streaks':{a:'#ECC36A',b:'#7B4328',light:'#F1CA82',dark:'#624020',metal:'gold',material:'Amber enamel · Gold',motion:'ignite'},
 'Reading':{a:'#7FA38B',b:'#183C31',light:'#C6D6BD',dark:'#254B39',metal:'gold',material:'Forest enamel · Ivory',motion:'pages'},
 'Bible Moments':{a:'#78B9B4',b:'#264F60',light:'#C5DEDC',dark:'#23434D',metal:'silver',material:'Teal enamel · Silver',motion:'foil'},
 'Prayer and questions':{a:'#B2C399',b:'#52775C',light:'#D9DFC1',dark:'#3B5140',metal:'gold',material:'Sage enamel · Champagne',motion:'bloom'},
};
const rows=[
 ['letters-1','Daily letters','First Letter','envelope',1],['letters-7','Daily letters','Seven Letters','stack',2],['letters-30','Daily letters','Thirty Letters','library',3],['letters-100','Daily letters','A Hundred Letters','library',4],
 ['streak-1','Streaks','Lit the Match','match',1],['streak-7','Streaks','Seven Days','flame',2],['streak-30','Streaks','Thirty Days','sunrise',3],['streak-100','Streaks','A Hundred Days','sun',4],
 ['chapter','Reading','Turned the Page','page',1],['highlight','Reading','First Highlight','pencil',1],['note','Reading','First Note','note',1],['listener','Reading','Listener','headphones',2],['genesis','Reading','In the Beginning','book',2],['express','Reading','Express Lane','bolt',2],['law','Reading','The Law','law',3],['bible','Reading','Every Word','crown',4],
 ['moment','Bible Moments','First Moment','card',1],['garden','Bible Moments','Garden Set','silver',3],['ten','Bible Moments','Ten Moments','cards',2],['all','Bible Moments','Every Moment','crown',4],
 ['amen','Prayer and questions','First Amen','olive',1],['honest','Prayer and questions','Honest Answer','heart',1],['quiz','Prayer and questions','Sharp Eye','eye',2],['verse','Prayer and questions','Your Verse','verse',2],
];
function shape(f){return f==='Streaks'?'M150 25L241 63V150Q241 225 150 277Q59 225 59 150V63Z':f==='Bible Moments'?'M150 20L254 80V218L150 280L46 218V80Z':f==='Prayer and questions'?'M150 32C212 26 258 87 247 151C260 213 200 259 150 249C83 261 38 210 51 151C38 88 87 26 150 32Z':'M100 38H200Q249 38 249 87V204Q249 250 200 250H100Q51 250 51 204V87Q51 38 100 38Z'}
function artwork(id,family,symbol,tier){
 const f=families[family],outline=shape(family);
 let art=seed[symbol];
 if(!art){const wreath=tier===4?Array.from({length:12},(_,i)=>`<ellipse cx="${74+Math.sin(i*.25)*18}" cy="${204-i*10}" rx="5" ry="12" transform="rotate(${-40+i*3} ${74+Math.sin(i*.25)*18} ${204-i*10})" fill="url(#${f.metal})"/>`).join(''):'';
 art=`${tier>=3?'<g class="ribbon"><path d="M90 208L70 281L111 258L132 278L148 212M161 212L180 278L200 258L234 278L215 209" fill="url(#'+f.metal+')"/></g>':''}<path d="${outline}" fill="${f.b}" transform="translate(3 7)"/><path d="${outline}" fill="url(#${f.metal})"/><path d="${outline}" fill="url(#${id==='all'?'foil':'enamel'})" transform="translate(150 150) scale(.9) translate(-150 -150)"/><path d="${outline}" fill="none" stroke="#fff8d4" stroke-opacity=".35" transform="translate(150 150) scale(.82) translate(-150 -150)"/><g class="symbol" stroke="#17291e" stroke-opacity=".25" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(1 4)">${symbols[symbol]}</g><g class="symbol" stroke="url(#${f.metal})" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none">${symbols[symbol]}</g>${wreath}${tier===4?'<g transform="translate(300 0) scale(-1 1)">'+wreath+'</g>':''}${tier>=2?'<path d="M89 83Q111 66 139 66" fill="none" stroke="#fff7da" stroke-width="3" stroke-opacity=".45" stroke-linecap="round"/>':''}`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-labelledby="title"><title id="title">${rows.find(r=>r[0]===id)[2]} badge</title>${seed.defs}<defs><linearGradient id="enamel" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${f.a}"/><stop offset=".55" stop-color="${f.b}"/><stop offset="1" stop-color="#182720"/></linearGradient><clipPath id="surface"><path d="${symbol==='envelope'?'M32 59H263V225H32Z':symbol==='book'?'M40 31H251V247H40Z':outline}"/></clipPath></defs>${art}<g clip-path="url(#surface)"><path class="shine" d="M-100 0H-35L165 300H100Z" fill="url(#sheen)"/></g></svg>`;
}
const entries=rows.map(([id,family,title,symbol,tier])=>{const f=families[family],foil=id==='garden'||id==='all';const svg=artwork(id,family,symbol,tier);fs.writeFileSync(path.join(base,id+'.svg'),svg);return {id,title,family,tier,asset:`assets/achievements/${id}.svg`,material:foil?'Brushed silver · Iridescent foil':f.material,background:{light:foil?'#CEDBDF':f.light,dark:foil?'#34434D':f.dark},reveal:f.motion,availability:id==='listener'?'Reserved — recordings not yet available':'Existing achievement',svg};});
fs.writeFileSync(path.join(base,'manifest.json'),JSON.stringify({status:'review-only',version:1,achievements:entries.map(({svg,...x})=>x)},null,2)+'\n');
const milestoneSource=fs.readFileSync(path.join(__dirname,'../assets/data/milestones.js'),'utf8');const days=[...milestoneSource.matchAll(/day: (\d+),[\s\S]*?title: "([^"]+)"/g)].map(m=>({day:Number(m[1]),title:m[2],assetId:Number(m[1])<7?'streak-1':Number(m[1])<30?'streak-7':Number(m[1])<100?'streak-30':'streak-100',treatment:[30,90,180,365].includes(Number(m[1]))?'landmark':'checkpoint'}));fs.writeFileSync(path.join(base,'streak-checkpoint-map.json'),JSON.stringify({status:'family mapping only; custom checkpoint artwork not yet designed',checkpoints:days},null,2)+'\n');
let template=fs.readFileSync(path.join(base,'source/gallery-template.html'),'utf8');template=template.replace('/* COLLECTION_DATA */',JSON.stringify(entries));fs.writeFileSync(path.join(base,'preview.html'),template);
console.log(`Generated ${entries.length} badges and mapped ${days.length} streak checkpoints.`);
