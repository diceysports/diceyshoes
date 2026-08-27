import fs from 'node:fs';
const path='app/api/product-details/route.js';
let s=fs.readFileSync(path,'utf8');
const before="'cdn-images.farfetch-contents.com','img.mytheresa.com'];";
const after="'cdn-images.farfetch-contents.com','img.mytheresa.com','www.brooksrunning.com'];";
if(!s.includes('www.brooksrunning.com')){
  if(!s.includes(before))throw new Error('Expected image host list not found');
  s=s.replace(before,after);
  fs.writeFileSync(path,s);
  console.log('Patched Brooks host');
}else console.log('Brooks host already allowed');