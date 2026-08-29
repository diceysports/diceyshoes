import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const BASE='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const APP='2FWOTDVM2O', SEARCH_KEY='ac96de6fef0e02bb95d433d8d5c7038a';
const SHARD=Number(process.env.SHARD||0), SHARD_SIZE=Number(process.env.SHARD_SIZE||25);
const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
const clean=s=>String(s||'').trim(), norm=s=>clean(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
async function get(path){const r=await fetch(`${BASE}/${path}`,{headers});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);return r.json()}
function skuValues(hit){const out=[];const walk=(v,k='')=>{if(v==null)return;if(typeof v==='string'||typeof v==='number'){if(/sku|style.?id|style.?code|style.?number|article/i.test(k))out.push(String(v));return}if(Array.isArray(v)){for(const x of v)walk(x,k);return}if(typeof v==='object'){for(const [kk,x] of Object.entries(v))walk(x,kk)}};walk(hit);return [...new Set(out)]}
function productKey(x){return String(x?.product_template_id||x?.productTemplateId||x?.product?.id||x?.product?.slug||x?.slug||'')}
let algoliaErrors=0;
async function searchSku(sku){
  const params=new URLSearchParams({query:sku,hitsPerPage:'60',distinct:'true'}).toString();
  const r=await fetch(`https://${APP.toLowerCase()}-dsn.algolia.net/1/indexes/product_variants_v2/query`,{method:'POST',headers:{'content-type':'application/json','x-algolia-application-id':APP,'x-algolia-api-key':SEARCH_KEY,'x-algolia-agent':'Algolia for JavaScript'},body:JSON.stringify({params})});
  if(!r.ok){const body=(await r.text().catch(()=>'' )).slice(0,240);if(algoliaErrors++<5)console.log(`ALGOLIA_HTTP ${r.status} ${body}`);return null}
  const d=await r.json(),hits=Array.isArray(d.hits)?d.hits:[];
  const exact=hits.filter(x=>norm(x?.sku||x?.styleId||x?.style_id)===norm(sku)||skuValues(x).some(v=>norm(v)===norm(sku)));
  const byProduct=new Map();for(const x of exact){const key=productKey(x);if(key&&!byProduct.has(key))byProduct.set(key,x)}
  if(byProduct.size===1)return [...byProduct.values()][0];
  if(byProduct.size>1)console.log(`ALGOLIA_AMBIGUOUS ${sku} ${byProduct.size}`);
  return null;
}
async function mediaCounts(ids){const m=new Map();for(let i=0;i<ids.length;i+=100){const part=ids.slice(i,i+100);const rows=await get(`shoe_storefront_media?select=master_product_id&master_product_id=in.(${part.join(',')})&limit=5000`);for(const x of rows)m.set(Number(x.master_product_id),(m.get(Number(x.master_product_id))||0)+1)}return m}
async function knownGoatUrls(){const rows=await get('shoe_product_media?select=master_product_id,source_page_url&source_id=in.(4,61)&source_page_url=not.is.null&limit=20000').catch(()=>[]);const out=new Map();for(const r of rows){const u=clean(r.source_page_url);if(!u||!/^https?:\/\/(www\.)?goat\.com\/sneakers\//i.test(u))continue;if(!out.has(Number(r.master_product_id)))out.set(Number(r.master_product_id),u.replace(/^http:/,'https:'))}return out}
function urlsFromHtml(html){const out=[];for(const raw of String(html||'').match(/https:\\/\\/image\.goat\.com\\/[^"'<>\\\s]+/gi)||[]){const u=raw.replace(/\\u0026/g,'&').replace(/\\\//g,'/').replace(/&amp;/g,'&');if(/^https:\/\/image\.goat\.com\//i.test(u)&&!out.includes(u))out.push(u)}return out}
async function verifiedKnownPage(page,p,url){
  const network=[];const onResponse=res=>{try{const u=res.url();if(/^https:\/\/image\.goat\.com\//i.test(u))network.push(u)}catch{}};page.on('response',onResponse);
  let res=null;try{res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000})}catch{}
  if(!res||res.status()>=400){page.off('response',onResponse);return null}
  await page.waitForTimeout(900);for(let i=0;i<3;i++){await page.mouse.wheel(0,900).catch(()=>{});await page.waitForTimeout(250)}
  const body=await page.locator('body').innerText().catch(()=>''), skuNorm=norm(p.style_code);
  if(!skuNorm||!norm(body).includes(skuNorm)){page.off('response',onResponse);return null}
  const dom=await page.locator('img').evaluateAll(imgs=>imgs.flatMap(img=>[img.currentSrc,img.src,img.getAttribute('data-src'),img.getAttribute('data-original'),...(img.getAttribute('srcset')||'').split(',').map(x=>x.trim().split(/\s+/)[0])].filter(Boolean))).catch(()=>[]);
  const html=await page.content().catch(()=>''), all=[...dom,...network,...urlsFromHtml(html)], seen=new Set(), images=[];
  for(const u0 of all){const u=clean(u0).replace(/\\u0026/g,'&').replace(/\\\//g,'/');if(!/^https:\/\/image\.goat\.com\//i.test(u)||/avatar|logo|icon|banner/i.test(u))continue;let k=u;try{const x=new URL(u);['w','h','width','height','q','quality'].forEach(a=>x.searchParams.delete(a));k=x.origin+x.pathname}catch{}if(seen.has(k))continue;seen.add(k);images.push(u)}
  page.off('response',onResponse);if(images.length<2)return null;
  return {url:page.url(),slug:page.url().match(/\/sneakers\/([^?#/]+)/)?.[1]||'',id:'',images:images.slice(0,16)}
}
async function loadDetail(page,slug,id){let res=null;try{res=await page.goto(`https://www.goat.com/sneakers/${slug}`,{waitUntil:'domcontentloaded',timeout:40000})}catch{}if(!res||res.status()>=400)return null;await page.waitForTimeout(900);for(const key of [slug,id].filter(Boolean)){try{const d=await page.evaluate(async k=>{const r=await fetch(`/web-api/v1/product_templates/${encodeURIComponent(k)}`,{headers:{accept:'application/json'}});return r.ok?await r.json():null},key);if(d)return {detail:d,url:`https://www.goat.com/sneakers/${slug}`}}catch{}}return null}
async function exactDetailForSku(page,sku,hit){const slug=clean(hit?.slug),id=String(hit?.product_template_id||hit?.productTemplateId||'');if(!slug)return null;const loaded=await loadDetail(page,slug,id);if(!loaded)return null;const vals=skuValues(loaded.detail);return vals.some(v=>norm(v)===norm(sku))?{...loaded,slug,id}:null}
async function websiteFallback(page,sku){let res=null;try{res=await page.goto(`https://www.goat.com/search?query=${encodeURIComponent(sku)}`,{waitUntil:'domcontentloaded',timeout:35000})}catch{}if(!res||res.status()>=400)return null;await page.waitForTimeout(1100);const links=await page.locator('a[href*="/sneakers/"]').evaluateAll(as=>[...new Set(as.map(a=>a.href).filter(Boolean))]).catch(()=>[]);const verified=[];for(const href of links.slice(0,8)){const slug=href.match(/\/sneakers\/([^?#/]+)/)?.[1];if(!slug)continue;const loaded=await loadDetail(page,slug,'');if(!loaded)continue;const vals=skuValues(loaded.detail);if(vals.some(v=>norm(v)===norm(sku)))verified.push({...loaded,slug,id:''});if(verified.length>1)break}return verified.length===1?verified[0]:null}
function extractImages(detail){const urls=[];const walk=v=>{if(!v)return;if(typeof v==='string'){if(/^https:\/\/image\.goat\.com\//i.test(v)&&!urls.includes(v)&&!/avatar|logo|icon|banner/i.test(v))urls.push(v);return}if(Array.isArray(v)){v.forEach(walk);return}if(typeof v==='object')Object.values(v).forEach(walk)};walk(detail);return urls.slice(0,16)}
let products=await get('shoe_storefront_catalog?select=product_id,name,model,style_code,colorway,brand_name&style_code=not.is.null&order=product_id.asc&limit=12000');
const counts=await mediaCounts(products.map(x=>Number(x.product_id))),known=await knownGoatUrls();products=products.filter(x=>norm(x.style_code).length>=5&&(counts.get(Number(x.product_id))||0)<4);
// Prioritize products with a GOAT product URL already associated in our catalog; that is stronger evidence than search discovery.
products.sort((a,b)=>(known.has(Number(b.product_id))?1:0)-(known.has(Number(a.product_id))?1:0)||Number(a.product_id)-Number(b.product_id));
const targets=products.slice(SHARD*SHARD_SIZE,(SHARD+1)*SHARD_SIZE);
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:900},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36'});const page=await context.newPage();
const results=[],misses=[];
for(let i=0;i<targets.length;i++){
 const p=targets[i],sku=clean(p.style_code);let verified=null,method='KNOWN_GOAT_URL_EXACT_SKU';
 const ku=known.get(Number(p.product_id));if(ku){try{verified=await verifiedKnownPage(page,p,ku)}catch(e){console.log('GOAT_KNOWN_ERR',sku,String(e).slice(0,160))}}
 if(!verified){method='ALGOLIA_EXACT_SKU';try{const hit=await searchSku(sku);if(hit)verified=await exactDetailForSku(page,sku,hit)}catch(e){console.log('GOAT_SEARCH_ERR',sku,String(e).slice(0,160))}}
 if(!verified){method='WEBSITE_SEARCH_EXACT_SKU';try{verified=await websiteFallback(page,sku)}catch(e){console.log('GOAT_FALLBACK_ERR',sku,String(e).slice(0,160))}}
 if(!verified){misses.push({productId:p.product_id,styleCode:sku,knownUrl:ku||null,reason:'no unique GOAT page whose visible/detail SKU exactly matches'});continue}
 const images=verified.images||extractImages(verified.detail);if(images.length<2){misses.push({productId:p.product_id,styleCode:sku,knownUrl:ku||null,reason:'fewer than 2 GOAT product images'});continue}
 results.push({provider:'GOAT',productId:p.product_id,brand:p.brand_name,name:p.name,model:p.model,styleCode:sku,colorway:p.colorway,sourceUrl:verified.url,externalId:verified.id||verified.slug,matchMethod:'EXACT_STYLE_CODE',discoveryMethod:method,images:images.map(url=>({url}))});console.log(`[${i+1}/${targets.length}] MATCH ${p.product_id} ${sku} ${images.length} ${method}`)
}
await browser.close();const file=`goat-gallery-${SHARD}.json`;await fs.writeFile(file,JSON.stringify({provider:'GOAT',shard:SHARD,thinProducts:products.length,targetCount:targets.length,knownUrlTargets:targets.filter(x=>known.has(Number(x.product_id))).length,matched:results.length,missed:misses.length,algoliaErrors,results,misses,createdAt:new Date().toISOString()},null,2));console.log(JSON.stringify({file,thinProducts:products.length,targetCount:targets.length,knownUrlTargets:targets.filter(x=>known.has(Number(x.product_id))).length,matched:results.length,missed:misses.length,algoliaErrors}));
