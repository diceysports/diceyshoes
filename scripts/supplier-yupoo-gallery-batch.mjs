import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const SOURCE_SHARD=Number(process.env.SOURCE_SHARD||0);
const SOURCE_SHARDS=Number(process.env.SOURCE_SHARDS||8);
const MAX_PAGES=Number(process.env.MAX_PAGES||6);
const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
const clean=s=>String(s||'').trim();
const norm=s=>clean(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
async function get(path){const r=await fetch(`${BASE}/${path}`,{headers});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);return r.json()}
function sameSupplierHost(a,b){try{const x=new URL(a),y=new URL(b);if(x.hostname===y.hostname)return true;const ux=x.pathname.match(/^\/photos\/([^/]+)/)?.[1],uy=y.pathname.match(/^\/photos\/([^/]+)/)?.[1];return x.hostname==='x.yupoo.com'&&y.hostname==='x.yupoo.com'&&ux&&ux===uy}catch{return false}}
function pageUrl(base,n){const u=new URL(base);u.searchParams.set('page',String(n));if(!u.searchParams.has('tab')&&(u.pathname.includes('/albums')||u.pathname==='/'||u.pathname===''))u.searchParams.set('tab','gallery');return u.toString()}
function codeCandidates(s){return [...new Set(clean(s).toUpperCase().match(/[A-Z0-9][A-Z0-9-]{4,}/g)||[])].map(norm).filter(x=>x.length>=5)}
function imageUrlOK(u){try{const x=new URL(u),h=x.hostname.toLowerCase(),p=x.pathname.toLowerCase();return x.protocol==='https:'&&(h==='photo.yupoo.com'||h.endsWith('.yupoo.com')||h==='x.zhidian-inc.cn'||h.endsWith('.zhidian-inc.cn')||h.endsWith('.alicdn.com'))&&!/avatar|logo|icon|sprite|banner|qr|qrcode/.test(p)}catch{return false}}
function canonical(u){try{const x=new URL(u);['w','h','width','height','q','quality'].forEach(k=>x.searchParams.delete(k));return x.origin+x.pathname}catch{return u}}

const NAME_STOP=new Set(['NIKE','ADIDAS','JORDAN','PUMA','ASICS','SHOE','SHOES','SNEAKER','SNEAKERS','MENS','MEN','WOMENS','WOMEN','WMNS','UNISEX','NEW','SIZE','SIZES','FLIGHT','CLUB','EBAY','STOCKX','GOAT','AUTHENTIC','ORIGINAL','RETRO','PRO','SP']);
const MODEL_STOP=new Set(['NIKE','ADIDAS','JORDAN','PUMA','ASICS','SHOE','SHOES','SNEAKER','SNEAKERS','MENS','MEN','WOMENS','WOMEN','WMNS','UNISEX']);
const KNOWN_BRANDS=['NIKE','ADIDAS','JORDAN','PUMA','ASICS','NEW BALANCE','REEBOK','VANS','CONVERSE','SAUCONY','HOKA','SALOMON','MIZUNO','UNDER ARMOUR'];
const GENERIC_COLORS=new Set(['BLACK','WHITE','RED','BLUE','GREEN','GREY','GRAY','BROWN','TAN','CREAM','GOLD','SILVER','PINK','PURPLE','ORANGE','YELLOW','MULTI','MULTICOLOR']);
function words(s){return clean(s).toUpperCase().replace(/[^A-Z0-9]+/g,' ').split(/\s+/).filter(Boolean)}
function unique(arr){return [...new Set(arr)]}
function modelWords(s){return unique(words(s).filter(w=>w.length>=2&&!MODEL_STOP.has(w)));}
function descriptiveWords(s,style=''){const sc=norm(style);return unique(words(s).filter(w=>w.length>=3&&!NAME_STOP.has(w)&&norm(w)!==sc&&!/^\d+(?:\.\d+)?$/.test(w)));}
function sourceWords(s){return new Set(words(s));}
function allPresent(required,have){return required.length>0&&required.every(w=>have.has(w));}
function explicitBrand(title){const up=clean(title).toUpperCase();return KNOWN_BRANDS.find(b=>new RegExp(`(^|[^A-Z0-9])${b.replace(' ','\\s+')}([^A-Z0-9]|$)`,'i').test(up))||null;}
function brandCompatible(title,p){const b=explicitBrand(title);if(!b)return true;const pb=clean(p.brand_name).toUpperCase();if(b==='JORDAN')return pb==='JORDAN'||pb==='NIKE';if(pb==='JORDAN'&&b==='NIKE')return true;return pb===b;}
function productNameProfile(p){
  const model=modelWords(p.model||'');
  const color=descriptiveWords(p.colorway||'',p.style_code);
  const brandWords=descriptiveWords(p.brand_name||'',p.style_code);
  const rawName=descriptiveWords(p.name||'',p.style_code);
  const variant=rawName.filter(w=>!model.includes(w)&&!color.includes(w)&&!brandWords.includes(w)&&!GENERIC_COLORS.has(w));
  return {model,color,variant};
}
function nameMatchCandidates(sourceTitle,products){
  const have=sourceWords(sourceTitle), out=[];
  for(const p of products){
    if(!brandCompatible(sourceTitle,p))continue;
    const pr=p._profile;
    if(pr.model.length<1||!allPresent(pr.model,have))continue;
    const nonGenericColor=pr.color.filter(w=>!GENERIC_COLORS.has(w));
    const genericColor=pr.color.filter(w=>GENERIC_COLORS.has(w));
    if(nonGenericColor.length>0&&!allPresent(nonGenericColor,have))continue;
    if(nonGenericColor.length===0&&genericColor.length>0&&!allPresent(genericColor,have))continue;
    const matchedVariant=pr.variant.filter(w=>have.has(w));
    const distinctModel=pr.model.filter(w=>!/^[0-9]+$/.test(w));
    const strongVariant=matchedVariant.filter(w=>w.length>=4);
    const styleInTitle=norm(p.style_code).length>=5&&norm(sourceTitle).includes(norm(p.style_code));
    const colorEvidence=pr.color.length>0&&pr.color.every(w=>have.has(w));
    const variantNeeded=styleInTitle?0:(colorEvidence?1:2);
    if(strongVariant.length<variantNeeded)continue;
    const evidence=unique([...pr.model,...pr.color,...strongVariant]);
    if(!styleInTitle&&distinctModel.length<1)continue;
    if(!styleInTitle&&new Set(evidence).size<3)continue;
    const score=(styleInTitle?500:0)+pr.model.length*35+pr.color.length*45+strongVariant.length*20;
    out.push({p,score,evidence,styleInTitle});
  }
  out.sort((a,b)=>b.score-a.score);
  if(!out.length)return null;
  if(out.length>1&&(out[0].score-out[1].score)<20)return null;
  return out[0];
}
async function unlock(page,password){if(!password)return;const inputs=page.locator('input[type="password"], input[name*="pass" i]');if(await inputs.count()){await inputs.first().fill(password).catch(()=>{});const btn=page.locator('button, input[type="submit"]').filter({hasText:/enter|submit|confirm|访问|确定/i}).first();if(await btn.count())await btn.click().catch(()=>{});else await page.keyboard.press('Enter').catch(()=>{});await page.waitForTimeout(1000)}}
async function collectAlbums(page,src){const found=new Map();for(let n=1;n<=MAX_PAGES;n++){const u=n===1?src.url:pageUrl(src.url,n);let res;try{res=await page.goto(u,{waitUntil:'domcontentloaded',timeout:28000})}catch{continue}if(!res||res.status()>=400)continue;await unlock(page,src.password);await page.waitForTimeout(650);const links=await page.locator('a[href]').evaluateAll(els=>els.map(a=>({href:a.href,text:(a.textContent||'').trim(),title:a.getAttribute('title')||''})).filter(x=>/\/albums\/\d+/.test(x.href)));let added=0;for(const x of links){if(!sameSupplierHost(src.url,x.href))continue;const key=x.href.split('?')[0],label=clean(`${x.title} ${x.text}`);if(!found.has(key)){found.set(key,{url:key,label});added++}}if(n>1&&added===0)break}return [...found.values()]}
async function inspectAlbum(page,album,src,byCode,thin){let res;try{res=await page.goto(album.url,{waitUntil:'domcontentloaded',timeout:28000})}catch{return null}if(!res||res.status()>=400)return null;await unlock(page,src.password);await page.waitForTimeout(700);const title=await page.title().catch(()=>''),body=await page.locator('body').innerText().catch(()=>''),codeBlob=clean(`${album.label} ${title} ${body.slice(0,1800)}`),tokens=codeCandidates(codeBlob);let match=null,matchMethod=null,evidence=[];
  for(const t of tokens){const rows=byCode.get(t);if(rows?.length===1){match=rows[0];matchMethod='STYLE_CODE';evidence=[match.style_code];break}}
  if(match){const styleNorm=norm(match.style_code);if(!styleNorm||!norm(codeBlob).includes(styleNorm))return null}
  if(!match){
    const sourceTitle=clean(`${album.label} ${title}`);
    const found=nameMatchCandidates(sourceTitle,thin);
    if(found){match=found.p;matchMethod='EXACT_NAME_COMPONENTS';evidence=found.evidence}
  }
  if(!match)return null;
  const imgs=await page.locator('img').evaluateAll(els=>{const out=[];for(const img of els){for(const v of [img.currentSrc,img.src,img.getAttribute('data-src'),img.getAttribute('data-original'),img.getAttribute('data-lazy-src')])if(v&&/^https?:/i.test(v))out.push({url:v,alt:img.alt||'',w:img.naturalWidth||0,h:img.naturalHeight||0});for(const p of (img.getAttribute('srcset')||img.getAttribute('data-srcset')||'').split(',')){const v=p.trim().split(/\s+/)[0];if(/^https?:/i.test(v))out.push({url:v,alt:img.alt||'',w:img.naturalWidth||0,h:img.naturalHeight||0})}}return out});const seen=new Set(),images=[];for(const x of imgs){if(!imageUrlOK(x.url))continue;if((x.w||0)<300&&(x.h||0)<300)continue;const k=canonical(x.url);if(seen.has(k))continue;seen.add(k);images.push({angle:'UNKNOWN',url:x.url})}if(images.length<2)return null;return {productId:match.product_id,brand:match.brand_name,name:match.name,model:match.model,styleCode:match.style_code,colorway:match.colorway,catalogName:match.name,sourceName:clean(`${album.label} ${title}`),sourceUrl:page.url(),albumId:album.url.match(/\/albums\/(\d+)/)?.[1]||null,exactMatch:true,matchMethod,matchEvidence:evidence,images:images.slice(0,16)}}

const manifest=JSON.parse(await fs.readFile('data/supplier-yupoo-sources.json','utf8'));
const sources=manifest.sources.filter((_,i)=>i%SOURCE_SHARDS===SOURCE_SHARD);
const products=await get('shoe_storefront_catalog?select=product_id,name,model,style_code,colorway,brand_name&order=product_id.asc&limit=12000');
const media=await get('shoe_storefront_media?select=master_product_id&limit=50000').catch(()=>[]);const counts=new Map();for(const m of media)counts.set(Number(m.master_product_id),(counts.get(Number(m.master_product_id))||0)+1);
const thin=products.filter(p=>(counts.get(Number(p.product_id))||0)<4).map(p=>({...p,_profile:productNameProfile(p)}));const byCode=new Map();for(const p of thin){const k=norm(p.style_code);if(k.length<5)continue;if(!byCode.has(k))byCode.set(k,[]);byCode.get(k).push(p)}
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:900},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'});const page=await context.newPage();const results=[],stats=[];
for(const src of sources){const s={url:src.url,kind:src.kind,albums:0,matched:0,styleMatches:0,nameMatches:0,error:null};try{const albums=await collectAlbums(page,src);s.albums=albums.length;for(const album of albums){if(results.length>=95)break;const r=await inspectAlbum(page,album,src,byCode,thin);if(r){results.push(r);s.matched++;if(r.matchMethod==='STYLE_CODE')s.styleMatches++;else s.nameMatches++;console.log('MATCH',r.matchMethod,r.productId,r.styleCode,r.sourceName,r.images.length)}}}catch(e){s.error=String(e)}stats.push(s);console.log('SOURCE',JSON.stringify(s))}
await browser.close();const file=`supplier-yupoo-gallery-${SOURCE_SHARD}.json`;await fs.writeFile(file,JSON.stringify({sourceShard:SOURCE_SHARD,sourceShards:SOURCE_SHARDS,sourceCount:sources.length,thinProducts:thin.length,matched:results.length,results,stats,createdAt:new Date().toISOString()},null,2));console.log(JSON.stringify({file,sourceShard:SOURCE_SHARD,sources:sources.length,matched:results.length},null,2));
