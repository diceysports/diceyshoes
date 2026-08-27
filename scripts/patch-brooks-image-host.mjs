import fs from 'node:fs';
const path='app/api/product-details/route.js';
let s=fs.readFileSync(path,'utf8');
let changed=false;
const before="'cdn-images.farfetch-contents.com','img.mytheresa.com'];";
const after="'cdn-images.farfetch-contents.com','img.mytheresa.com','www.brooksrunning.com'];";
if(!s.includes('www.brooksrunning.com')){
  if(!s.includes(before))throw new Error('Expected image host list not found');
  s=s.replace(before,after);changed=true;
}
if(s.includes(`${BASE}/shoe_product_media?`)){
  s=s.replaceAll(`${BASE}/shoe_product_media?`,`${BASE}/shoe_storefront_media?`);changed=true;
}
if(changed){fs.writeFileSync(path,s);console.log('Patched verified storefront media access')}else console.log('Storefront media access already patched');