const fs=require('node:fs');const path=require('node:path');
const specs=[
['first-letter','First Letter','Letters','Cotton paper · Coral wax','A small beginning, worth keeping.','#efcea9','#63422d'],
['seven-letters','Seven Letters','Letters','Layered paper · Rose silk','A week of words, tied together.','#efd3c8','#643c40'],
['thirty-letters','Thirty Letters','Letters','Walnut · Brushed brass','Your quiet moments have become a treasure.','#e4bf92','#59412a'],
['seven-days','Seven Days','Streaks','Glass · Brass · Warm light','You kept a little light burning.','#efcf90','#57432b'],
['in-the-beginning','In the Beginning','Reading','Emerald leather · Gilt edges','The first book. A whole world opened.','#c5d6b8','#254a39'],
['garden-set','Garden Set','Bible Moments','Living moss · Iridescent glass','Every Genesis moment, gathered and growing.','#d1ddc0','#294b40']
];
const data=specs.map(([id,title,family,material,description,light,dark])=>({id,title,family,material,description,background:{light,dark},image:id+'.png'}));
fs.writeFileSync(path.join(__dirname,'index.html'),fs.readFileSync(path.join(__dirname,'template.html'),'utf8').replace('/* COLLECTION_DATA */',JSON.stringify(data)));
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({status:'art-direction-preview',assets:data},null,2));
