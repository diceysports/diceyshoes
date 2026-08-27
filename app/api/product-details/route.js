const BASE='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const BRANDS={1:'Nike',2:'Jordan',3:'Adidas',4:'Yeezy',5:'Balmain',6:'Christian Louboutin',7:'Louis Vuitton',8:'Gucci',9:'Versace',10:'Balenciaga',11:'New Balance',12:'ASICS',13:'Puma',14:'Reebok',15:'Converse',16:'Vans',17:'Saucony',18:'Salomon',19:'HOKA',20:'On',21:'Dior',22:'Maison Margiela',23:'Alexander McQueen',24:'BAPE',25:'Off-White',26:'Fear of God',27:'Brooks',28:'Mizuno',29:'Under Armour',30:'Onitsuka Tiger'};
const IMAGE_HOSTS=['image.goat.com','static.nike.com','secure-images.nike.com','images.stockx.com','www.stadiumgoods.com','stadiumgoods.com','cdn.shopify.com','media.gucci.com','ca.louisvuitton.com','media.balenciaga.cn','cdn-images.farfetch-contents.com','img.mytheresa.com'];

export const runtime='nodejs';
export const dynamic='force-dynamic';

const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const normSku=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const htmlDecode=s=>String(s||'').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function plainDescription(value=''){
  let text=String(value||'').replace(/\\n/g,'\n').replace(/<br\s*\/?\s*>/gi,'\n\n').replace(/<\/p\s*>/gi,'\n\n').replace(/<a\b[^>]*>(.*?)<\/a>/gis,'$1').replace(/<[^>]+>/g,' ');
  return htmlDecode(text).replace(/DISCLAIMER:\s*There is a possibility that the box will be a Nike Replacement Box\.?/gi,'').replace(/To shop all [^.]{0,160}(?:click here\.?|$)/gi,'').replace(/[ \t]+/g,' ').replace(/\s*\n\s*/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function allowedImage(value=''){
  try{const u=new URL(String(value).replace(/^http:/,'https:'));return u.protocol==='https:'&&IMAGE_HOSTS.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}
}
function addImage(list,value){
  if(!value)return;
  const v=String(value).replace(/^http:/,'https:').replace(/&amp;/g,'&').replace(/\\u0026/gi,'&');
  if(allowedImage(v)&&!list.includes(v))list.push(v);
}
function addAnyImage(list,value){
  if(!value)return;
  if(typeof value==='string')return addImage(list,value);
  if(Array.isArray(value))return value.forEach(x=>addAnyImage(list,x));
  if(typeof value==='object')addImage(list,value.url||value.src||value.image||value.image_url||value.media_url);
}
function evenlySpaced(list=[],count=8){
  if(!Array.isArray(list)||!list.length)return[];
  if(list.length<=count)return list;
  if(count===1)return[list[0]];
  const out=[];for(let i=0;i<count;i++)out.push(list[Math.round(i*(list.length-1)/(count-1))]);return [...new Set(out)];
}
function sourceDataImages(data={}){
  const out=[];addAnyImage(out,data.images);addAnyImage(out,data.gallery);evenlySpaced(data.gallery_360,8).forEach(x=>addAnyImage(out,x));addAnyImage(out,data.image_url||data.image||data.imageurl);return out;
}
function sourceDataDescription(data={}){
  return [data.description,data.short_description,data.product_description,data.details?.description].map(plainDescription).find(x=>x.length>80)||'';
}
function unwrapSource(value=''){
  let current=String(value||'').replace(/^http:/,'https:');
  for(let i=0;i<3;i++){
    try{
      const u=new URL(current);const nested=u.searchParams.get('u')||u.searchParams.get('url')||u.searchParams.get('redirect');
      if(!nested||!/^https?:\/\//i.test(nested))break;
      current=nested.replace(/^http:/,'https:');
    }catch{break}
  }
  return current;
}
function localizedSource(value=''){
  try{const u=new URL(unwrapSource(value));if(/(^|\.)goat\.com$/i.test(u.hostname)&&/^\/sneakers\//.test(u.pathname))u.pathname='/en-ca'+u.pathname;return u.toString()}catch{return unwrapSource(value)}
}
function jsonLd(html=''){
  const blocks=[...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const out=[];for(const b of blocks){try{const x=JSON.parse(b[1]);out.push(...(Array.isArray(x)?x:[x]))}catch{}}return out;
}
function walkProducts(node,out=[]){
  if(!node||typeof node!=='object')return out;
  const type=Array.isArray(node['@type'])?node['@type'].join(' '):node['@type'];
  if(String(type||'').toLowerCase().includes('product'))out.push(node);
  if(Array.isArray(node['@graph']))node['@graph'].forEach(x=>walkProducts(x,out));
  return out;
}
function metaRaw(html,key){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags){if(!new RegExp(`(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(tag))continue;const m=tag.match(/content=(?:"([^"]*)"|'([^']*)')/i);if(m)return htmlDecode(m[1]||m[2]||'')}
  return '';
}
function embeddedDescription(html=''){
  const normalized=html.replace(/\\u002F/gi,'/').replace(/\\u0026/gi,'&').replace(/\\\//g,'/');
  for(const m of normalized.matchAll(/"description"\s*:\s*"((?:\\.|[^"\\]){80,2200})"/gi)){try{const value=JSON.parse('"'+m[1]+'"');const text=plainDescription(value);if(text.length>100&&!/shop the latest|discover our|buy and sell/i.test(text))return text}catch{}}
  return '';
}
function cleanProductName(raw=''){
  let name=clean(raw).replace(/\s*\|\s*(Flight Club|GOAT|StockX).*$/i,'');const parts=name.split(/\s+-\s+/);if(parts.length>=3)name=parts[0];return name;
}
function inferredColorway(raw=''){
  const parts=clean(raw).replace(/\s*\|.*$/,'').split(/\s+-\s+/);if(parts.length>=4)return clean(parts.slice(3).join(' - '));const q=(raw.match(/[‘'“"]([^’'”"]{2,45})[’'”"]/ )||[])[1];return q||'';
}
function betterFallback(p){
  const name=cleanProductName(p.name)||clean(p.name)||'this shoe',data=p.source_data||{},brand=data.brand||BRANDS[p.brand_id]||'Dicey Shoes',model=clean(data.model||p.model||''),sku=clean(data.sku||p.style_code||''),color=clean(data.colorway||data.nickname||p.colorway||inferredColorway(p.name||''));
  const collab=/\b(?:x|×)\b/i.test(name)||/(Travis Scott|Off-White|Fragment|Supreme|Kobe Bryant|Pharrell)/i.test(name);const lane=String(p.category||data.category||'').toLowerCase()==='running'?'running':String(p.category||data.category||'').toLowerCase()==='basketball'?'basketball':String(p.category||data.category||'').toLowerCase()==='skate'?'skateboarding':String(p.category||data.category||'').toLowerCase()==='luxury'?'luxury footwear':'lifestyle';
  let text=`The ${name} is ${collab?'a collaborative ':'a '}${brand}${model&&!name.toLowerCase().includes(model.toLowerCase())?` ${model}`:''} release made for ${lane} wear.`;if(color)text+=` This pair is presented in the ${color} colorway.`;if(model)text+=` It carries the recognizable ${model} silhouette with this edition's own color and detailing.`;if(sku)text+=` Style code: ${sku}.`;return text;
}
async function getProduct(id,image){
  const select='product_id,brand_id,name,model,colorway,style_code,gender,category,description,retail_price,currency,product_url,image_url,image_source,image_usage,source_name,source_data,status';
  const qs=new URLSearchParams({select,limit:'1'});if(id)qs.set('product_id',`eq.${id}`);else if(image)qs.set('image_url',`eq.${image}`);else return null;const r=await fetch(`${BASE}/shoe_products?${qs}`,{headers,cache:'no-store'});if(!r.ok)return null;const rows=await r.json();return rows[0]||null;
}
async function existingMedia(id){
  const qs=new URLSearchParams({select:'media_url,position,angle,media_type',master_product_id:`eq.${id}`,order:'position.asc.nullslast,media_id.asc',limit:'40'});const r=await fetch(`${BASE}/shoe_product_media?${qs}`,{headers,cache:'no-store'});if(!r.ok)return[];const rows=await r.json();return rows.filter(x=>['IMAGE','360_FRAME','THUMBNAIL'].includes(x.media_type));
}
function goatProductId(...values){
  for(const value of values){const m=String(value||'').match(/(?:\/|^)(\d{4,})_\d{2}\.(?:png|jpe?g|webp)/i);if(m)return m[1]}return '';
}
async function sourcePage(value,context={}){
  if(!value)return {description:'',images:[]};
  try{
    const url=localizedSource(value);if(!/^https:\/\//i.test(url))return {description:'',images:[]};
    const pageUrl=new URL(url),host=pageUrl.hostname.toLowerCase(),stockSlug=/stockx\.com$/i.test(host)?pageUrl.pathname.split('/').filter(Boolean).pop()?.toLowerCase()||'':'';
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1','accept':'text/html,application/xhtml+xml'},redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(6500)});if(!r.ok)return {description:'',images:[]};
    const html=await r.text(),normalized=html.replace(/\\u002F/gi,'/').replace(/\\u0026/gi,'&').replace(/\\\//g,'/'),images=[];let description='';
    const products=[];jsonLd(html).forEach(x=>walkProducts(x,products));for(const product of products){if(!description&&product.description)description=plainDescription(product.description);addAnyImage(images,product.image);addAnyImage(images,product.images)}
    if(!description)description=plainDescription(metaRaw(html,'og:description'))||plainDescription(metaRaw(html,'description'))||embeddedDescription(html);
    addImage(images,metaRaw(html,'og:image'));
    const goatId=goatProductId(context.mainImage,...images,normalized.match(/https:\/\/image\.goat\.com\/[^"'<> ]+/i)?.[0]);
    const raw=normalized.match(/https:\/\/[^"'<>\\ ]+?\.(?:png|jpe?g|webp)(?:\?[^"'<>\\ ]*)?/gi)||[];
    for(const candidate of raw.slice(0,400)){
      if(!allowedImage(candidate))continue;
      let ch='';try{ch=new URL(candidate).hostname.toLowerCase()}catch{continue}
      if(/(^|\.)goat\.com$/i.test(host)&&ch==='image.goat.com'){if(goatId&&candidate.includes(`${goatId}_`))addImage(images,candidate);continue}
      if(/(^|\.)stockx\.com$/i.test(host)&&ch==='images.stockx.com'){let path='';try{path=new URL(candidate).pathname.toLowerCase()}catch{}if(stockSlug&&path.includes('/360/')&&path.includes(stockSlug))addImage(images,candidate);continue}
    }
    return {description,images:images.slice(0,24)};
  }catch{return {description:'',images:[]}}
}
async function sneakerMarketLookup(p){
  const sku=clean(p.source_data?.sku||p.style_code||''),query=sku||cleanProductName(p.name)||p.name;if(!query)return {images:[],urls:[]};
  try{
    const r=await fetch(`https://sneakermarket.app/api/catalog/search?q=${encodeURIComponent(query)}&limit=8`,{headers:{accept:'application/json','user-agent':'DiceyShoesCatalog/1.0'},cache:'no-store',signal:AbortSignal.timeout(5500)});if(!r.ok)return {images:[],urls:[]};
    const payload=await r.json(),items=Array.isArray(payload.items)?payload.items:[],needle=normSku(sku);let item=needle?items.find(x=>normSku(x.sku)===needle):null;
    if(!item)item=items.find(x=>String(x.brand||'').toLowerCase()===String(BRANDS[p.brand_id]||'').toLowerCase())||items[0];if(!item)return {images:[],urls:[]};
    const images=[],urls=[];addAnyImage(images,item.image);for(const offer of Array.isArray(item.offers)?item.offers:[]){addAnyImage(images,offer.image);if(offer.url)urls.push(unwrapSource(offer.url))}if(item.bestPrice?.url)urls.push(unwrapSource(item.bestPrice.url));
    return {images,urls:[...new Set(urls.filter(Boolean))]};
  }catch{return {images:[],urls:[]}}
}
async function imageWorks(url){
  try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)','accept':'image/avif,image/webp,image/*,*/*;q=0.8','range':'bytes=0-2047'},redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(4500)});const type=(r.headers.get('content-type')||'').toLowerCase();return (r.ok||r.status===206)&&type.startsWith('image/')}catch{return false}
}
async function verifiedImages(images,main){
  const unique=[...new Set(images)].slice(0,24),checks=await Promise.all(unique.map(async url=>({url,ok:await imageWorks(url)}))),good=checks.filter(x=>x.ok).map(x=>x.url);if(!good.length&&main)addImage(good,main);return good.slice(0,12);
}
export async function GET(request){
  const q=new URL(request.url).searchParams,id=q.get('id'),image=q.get('image'),p=await getProduct(id,image);if(!p)return Response.json({error:'Product not found'},{status:404});
  const images=[];addImage(images,p.image_url);sourceDataImages(p.source_data||{}).forEach(x=>addImage(images,x));(await existingMedia(p.product_id)).forEach(m=>addImage(images,m.media_url));
  const best=p.source_data?.bestPrice?.url||p.source_data?.link||p.source_data?.itemurl||p.product_url||'';let sources=[],market={images:[],urls:[]};
  if(images.length<4){market=await sneakerMarketLookup(p);market.images.forEach(x=>addImage(images,x));const candidates=[best,...market.urls].map(unwrapSource).filter(Boolean);const priority=u=>/goat\.com/i.test(u)?0:/nike\.com/i.test(u)?1:/stockx\.com/i.test(u)?2:3;sources=[...new Set(candidates)].sort((a,b)=>priority(a)-priority(b)).slice(0,4)}else sources=[best].filter(Boolean);
  const needDescription=!sourceDataDescription(p.source_data||{})&&plainDescription(p.description).length<100;if(needDescription&&best&&!sources.includes(best))sources.push(best);
  const pageResults=await Promise.all(sources.slice(0,4).map(url=>sourcePage(url,{mainImage:p.image_url,sku:p.source_data?.sku||p.style_code,name:p.name})));
  for(const source of pageResults)source.images.forEach(x=>addImage(images,x));
  const gallery=await verifiedImages(images,p.image_url),dbDescription=plainDescription(p.description),storedDescription=sourceDataDescription(p.source_data||{}),generic=/\bby\s+.+\sis a sneakers\b|International size conversions are provided separately|Cataloged as unisex|Product imagery and market details are sourced/i.test(dbDescription),sourceDescription=pageResults.map(x=>plainDescription(x.description)).find(x=>x.length>100)||'';
  const description=storedDescription.length>100?storedDescription:(!generic&&dbDescription.length>100?dbDescription:sourceDescription||betterFallback(p)),model=p.source_data?.model||p.model||'',colorway=p.source_data?.colorway||p.source_data?.nickname||p.colorway||'';
  return Response.json({productId:p.product_id,description,images:gallery,model,styleCode:p.source_data?.sku||p.style_code||'',colorway,sourceUrl:localizedSource(best),gallerySearch:images.length<4?'source-only':'deep'},{headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}});
}
