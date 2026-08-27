import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const SHARD=Number(process.env.SHARD||0);
const SHARD_SIZE=Number(process.env.SHARD_SIZE||40);
const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};

async function get(path){const r=await fetch(`${BASE}/${path}`,{headers});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);return r.json()}
const slugify=s=>String(s||'').toLowerCase().replace(/^brooks\s+/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const styleParts=s=>{const m=String(s||'').match(/^(\d{6})-[^-]+-(\d{3})$/);return m?{base:m[1],color:m[2]}:null};
const trail=s=>/\b(trail|cascadia|caldera|catamount|divide)\b/i.test(String(s||''));
const genderPaths=g=>String(g).toLowerCase().startsWith('women')?['womens']:String(g).toLowerCase().startsWith('men')?['mens']:['mens','womens'];
function candidates(p){const sp=styleParts(p.style_code);if(!sp)return[];const slug=slugify(p.model||p.name),lane=trail(p.model||p.name)?'trail-running-shoes':'road-running-shoes';const out=[];for(const g of genderPaths(p.gender)){
  out.push(`https://www.brooksrunning.com/en_gb/${g}/${lane}/${slug}/${sp.base}.html?dwvar_${sp.base}_color=${sp.color}`);
  out.push(`https://www.brooksrunning.com/en_us/${g}/shoes/${lane}/${slug}/${sp.base}.html?dwvar_${sp.base}_color=${sp.color}`);
  out.push(`https://www.brooksrunning.com/en_ca/${g}/shoes/${lane}/${slug}/${sp.base}.html?dwvar_${sp.base}_color=${sp.color}`);
}return [...new Set(out)]}
function canonicalImages(urls,base,color){const map=new Map();for(const raw of urls){try{const u=new URL(raw);if(!/brooksrunning\.com$/i.test(u.hostname))continue;const re=new RegExp(`/original/${base}/${base}-${color}-([a-z0-9]+)-`,'i');const m=u.pathname.match(re);if(!m)continue;const angle=m[1].toLowerCase();if(!map.has(angle)||Number(u.searchParams.get('sw')||0)>Number(new URL(map.get(angle)).searchParams.get('sw')||0))map.set(angle,u.toString())}catch{}}return [...map.entries()].map(([angle,url])=>({angle,url})).slice(0,12)}
async function extract(page,p,url){let res;try{res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000})}catch{return null}if(!res||res.status()>=400)return null;await page.waitForTimeout(2200);const sp=styleParts(p.style_code);if(!sp)return null;const body=(await page.locator('body').innerText().catch(()=>''));if(!body.includes(sp.base))return null;const urls=await page.locator('img').evaluateAll(els=>{const out=[];for(const img of els){for(const v of [img.currentSrc,img.src,img.getAttribute('data-src'),img.getAttribute('data-lazy'),img.getAttribute('data-original')])if(v&&/^https?:/i.test(v))out.push(v);for(const part of (img.getAttribute('srcset')||img.getAttribute('data-srcset')||'').split(',')){const v=part.trim().split(/\s+/)[0];if(/^https?:/i.test(v))out.push(v)}}return [...new Set(out)]});const images=canonicalImages(urls,sp.base,sp.color);if(!images.length)return null;const ld=await page.locator('script[type="application/ld+json"]').evaluateAll(els=>els.map(x=>x.textContent||''));let product=null;for(const text of ld){try{const x=JSON.parse(text);const arr=Array.isArray(x)?x:[x];const all=[];for(const y of arr){if(y?.['@type']==='Product')all.push(y);if(Array.isArray(y?.['@graph']))all.push(...y['@graph'].filter(z=>z?.['@type']==='Product'))}if(all.length){product=all[0];break}}catch{}}
return {productId:p.product_id,name:p.name,model:p.model,styleCode:p.style_code,gender:p.gender,colorway:p.colorway,sourceUrl:page.url(),images,description:product?.description||null,officialName:product?.name||null,price:product?.offers?.price||product?.offers?.lowPrice||null,currency:product?.offers?.priceCurrency||null};}

const products=await get('shoe_products?select=product_id,name,model,style_code,gender,category,colorway&brand_id=eq.27&status=eq.PUBLISHED&order=product_id.asc');
const crawlable=products.filter(p=>styleParts(p.style_code));
const targets=crawlable.slice(SHARD*SHARD_SIZE,(SHARD+1)*SHARD_SIZE);
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:900},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'});const page=await context.newPage();
const results=[],misses=[];
for(let i=0;i<targets.length;i++){const p=targets[i];let found=null;for(const url of candidates(p)){found=await extract(page,p,url);if(found&&found.images.length>=2)break}if(found){results.push(found);console.log(`[${i+1}/${targets.length}] ${p.product_id} ${p.style_code}: ${found.images.length} angles`)}else{misses.push({productId:p.product_id,name:p.name,styleCode:p.style_code});console.log(`[${i+1}/${targets.length}] ${p.product_id} ${p.style_code}: MISS`)}}
await browser.close();
const output={brand:'Brooks',shard:SHARD,shardSize:SHARD_SIZE,totalCrawlable:crawlable.length,targetCount:targets.length,matched:results.length,missed:misses.length,results,misses,createdAt:new Date().toISOString()};
const file=`brooks-gallery-results-${SHARD}.json`;await fs.writeFile(file,JSON.stringify(output,null,2));console.log(JSON.stringify({file,totalCrawlable:crawlable.length,targetCount:targets.length,matched:results.length,missed:misses.length},null,2));