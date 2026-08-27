import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const APP='2FWOTDVM2O';
const SEARCH_KEY='ac96de6fef0e02bb95d433d8d5c7038a';
const SKU=process.env.TEST_SKU||'KK2273';
const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

async function searchSku(sku){
  const params=new URLSearchParams({query:sku,hitsPerPage:'12',distinct:'true'}).toString();
  const r=await fetch(`https://${APP.toLowerCase()}-dsn.algolia.net/1/indexes/product_variants_v2/query`,{method:'POST',headers:{'content-type':'application/json','x-algolia-application-id':APP,'x-algolia-api-key':SEARCH_KEY,'x-algolia-agent':'Algolia for JavaScript'},body:JSON.stringify({params})});
  if(!r.ok)throw new Error(`GOAT search ${r.status}`);const d=await r.json(),hits=Array.isArray(d.hits)?d.hits:[];return hits.find(x=>norm(x.sku)===norm(sku))||null;
}

const hit=await searchSku(SKU);if(!hit)throw new Error(`No exact GOAT hit for ${SKU}`);
const slug=hit.slug,id=String(hit.product_template_id||hit.productTemplateId||'');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'});
const page=await context.newPage();
const captured=[];
page.on('response',async response=>{try{const u=response.url();if(/product_templates|product_template/i.test(u)&&response.status()<400){const type=response.headers()['content-type']||'';if(type.includes('json')){const d=await response.json();captured.push({url:u,status:response.status(),data:d})}}}catch{}});
let productStatus=null;
try{const res=await page.goto(`https://www.goat.com/sneakers/${slug}`,{waitUntil:'domcontentloaded',timeout:45000});productStatus=res?.status()||null;await page.waitForTimeout(5000)}catch(e){console.log('product page navigation:',String(e))}
let direct=null;
for(const key of [slug,id].filter(Boolean)){
  try{const data=await page.evaluate(async key=>{const r=await fetch(`/web-api/v1/product_templates/${encodeURIComponent(key)}`,{headers:{accept:'application/json'}});const text=await r.text();let json=null;try{json=JSON.parse(text)}catch{}return {status:r.status,type:r.headers.get('content-type'),json,preview:json?null:text.slice(0,300)}},key);if(data.status===200&&data.json){direct={key,...data};break}}catch(e){console.log('direct fetch:',String(e))}
}
const detail=direct?.json||captured.map(x=>x.data).find(Boolean)||null;
const pics=Array.isArray(detail?.productTemplateExternalPictures)?detail.productTemplateExternalPictures:[];
const images=[];const walk=v=>{if(!v)return;if(typeof v==='string'){if(/^https:\/\/image\.goat\.com\//i.test(v)&&!images.includes(v))images.push(v);return}if(Array.isArray(v)){v.forEach(walk);return}if(typeof v==='object')Object.values(v).forEach(walk)};walk(detail);
const out={sku:SKU,slug,id,productStatus,directStatus:direct?.status||null,directKey:direct?.key||null,capturedCount:captured.length,externalPictureCount:pics.length,imageCount:images.length,images:images.slice(0,30),detailKeys:detail?Object.keys(detail).slice(0,100):[]};
await fs.writeFile('goat-web-gallery-test.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
await browser.close();