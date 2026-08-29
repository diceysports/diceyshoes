import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const BASE='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const APP='2FWOTDVM2O', SEARCH_KEY='ac96de6fef0e02bb95d433d8d5c7038a';
const SHARD=Number(process.env.SHARD||0), SHARD_SIZE=Number(process.env.SHARD_SIZE||25);
const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
const clean=s=>String(s||'').trim(), norm=s=>clean(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
async function get(path){const r=await fetch(`${BASE}/${path}`,{headers});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);return r.json()}
async function searchSku(sku){const params=new URLSearchParams({query:sku,hitsPerPage:'20',distinct:'true'}).toString();const r=await fetch(`https://${APP.toLowerCase()}-dsn.algolia.net/1/indexes/product_variants_v2/query`,{method:'POST',headers:{'content-type':'application/json','x-algolia-application-id':APP,'x-algolia-api-key':SEARCH_KEY,'x-algolia-agent':'Algolia for JavaScript'},body:JSON.stringify({params})});if(!r.ok)return null;const d=await r.json(),hits=Array.isArray(d.hits)?d.hits:[];const exact=hits.filter(x=>norm(x.sku||x.styleId||x.style_id)===norm(sku));return exact.length===1?exact[0]:null}
async function mediaCounts(ids){const m=new Map();for(let i=0;i<ids.length;i+=100){const part=ids.slice(i,i+100);const rows=await get(`shoe_storefront_media?select=master_product_id&master_product_id=in.(${part.join(',')})&limit=5000`);for(const x of rows)m.set(Number(x.master_product_id),(m.get(Number(x.master_product_id))||0)+1)}return m}
let products=await get('shoe_storefront_catalog?select=product_id,name,model,style_code,colorway,brand_name&style_code=not.is.null&order=product_id.asc&limit=12000');
const counts=await mediaCounts(products.map(x=>Number(x.product_id)));products=products.filter(x=>norm(x.style_code).length>=5&&(counts.get(Number(x.product_id))||0)<4);
const targets=products.slice(SHARD*SHARD_SIZE,(SHARD+1)*SHARD_SIZE);
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:900},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'});const page=await context.newPage();
const results=[],misses=[];
for(let i=0;i<targets.length;i++){
 const p=targets[i],sku=clean(p.style_code);let hit=null;try{hit=await searchSku(sku)}catch{}if(!hit){misses.push({productId:p.product_id,styleCode:sku,reason:'no unique exact GOAT SKU'});continue}
 const slug=clean(hit.slug),id=String(hit.product_template_id||hit.productTemplateId||'');if(!slug){misses.push({productId:p.product_id,styleCode:sku,reason:'exact hit missing slug'});continue}
 let res=null;try{res=await page.goto(`https://www.goat.com/sneakers/${slug}`,{waitUntil:'domcontentloaded',timeout:40000})}catch{}if(!res||res.status()>=400){misses.push({productId:p.product_id,styleCode:sku,reason:'GOAT page unavailable'});continue}
 await page.waitForTimeout(1500);let detail=null;for(const key of [slug,id].filter(Boolean)){try{const d=await page.evaluate(async k=>{const r=await fetch(`/web-api/v1/product_templates/${encodeURIComponent(k)}`,{headers:{accept:'application/json'}});return r.ok?await r.json():null},key);if(d){detail=d;break}}catch{}}
 if(!detail){misses.push({productId:p.product_id,styleCode:sku,reason:'GOAT detail unavailable'});continue}
 const urls=[];const walk=v=>{if(!v)return;if(typeof v==='string'){if(/^https:\/\/image\.goat\.com\//i.test(v)&&!urls.includes(v))urls.push(v);return}if(Array.isArray(v)){v.forEach(walk);return}if(typeof v==='object')Object.values(v).forEach(walk)};walk(detail);
 const images=urls.filter(u=>!/avatar|logo|icon|banner/i.test(u)).slice(0,16);if(images.length<2){misses.push({productId:p.product_id,styleCode:sku,reason:'fewer than 2 GOAT images'});continue}
 results.push({provider:'GOAT',productId:p.product_id,brand:p.brand_name,name:p.name,model:p.model,styleCode:sku,colorway:p.colorway,sourceUrl:`https://www.goat.com/sneakers/${slug}`,externalId:id||slug,matchMethod:'EXACT_STYLE_CODE',images:images.map(url=>({url}))});console.log(`[${i+1}/${targets.length}] MATCH ${p.product_id} ${sku} ${images.length}`)
}
await browser.close();const file=`goat-gallery-${SHARD}.json`;await fs.writeFile(file,JSON.stringify({provider:'GOAT',shard:SHARD,thinProducts:products.length,targetCount:targets.length,matched:results.length,missed:misses.length,results,misses,createdAt:new Date().toISOString()},null,2));console.log(JSON.stringify({file,thinProducts:products.length,targetCount:targets.length,matched:results.length,missed:misses.length}));
