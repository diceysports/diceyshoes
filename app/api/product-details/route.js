const BASE='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const BRANDS={1:'Nike',2:'Jordan',3:'Adidas',4:'Yeezy',5:'Balmain',6:'Christian Louboutin',7:'Louis Vuitton',8:'Gucci',9:'Versace',10:'Balenciaga',11:'New Balance',12:'ASICS',13:'Puma',14:'Reebok',15:'Converse',16:'Vans',17:'Saucony',18:'Salomon',19:'HOKA',20:'On',21:'Dior',22:'Maison Margiela',23:'Alexander McQueen',24:'BAPE',25:'Off-White',26:'Fear of God',27:'Brooks',28:'Mizuno',29:'Under Armour',30:'Onitsuka Tiger'};
const IMAGE_HOSTS=['image.goat.com','static.nike.com','images.stockx.com','www.stadiumgoods.com','stadiumgoods.com','cdn.shopify.com','media.gucci.com','ca.louisvuitton.com','media.balenciaga.cn','cdn-images.farfetch-contents.com','img.mytheresa.com'];

export const runtime='nodejs';
export const dynamic='force-dynamic';

const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const htmlDecode=s=>clean(String(s||'').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));

function allowedImage(value=''){
  try{const u=new URL(String(value).replace(/^http:/,'https:'));return u.protocol==='https:'&&IMAGE_HOSTS.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}
}
function addImage(list,value){
  if(!value)return;
  const v=String(value).replace(/^http:/,'https:').replace(/&amp;/g,'&');
  if(allowedImage(v)&&!list.includes(v))list.push(v);
}
function localizedSource(value=''){
  try{const u=new URL(value);if(/(^|\.)goat\.com$/i.test(u.hostname)&&/^\/sneakers\//.test(u.pathname))u.pathname='/en-ca'+u.pathname;return u.toString()}catch{return value}
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
function metaContent(html,key){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags){
    if(!new RegExp(`(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(tag))continue;
    const m=tag.match(/content=(?:"([^"]*)"|'([^']*)')/i);if(m)return htmlDecode(m[1]||m[2]||'');
  }
  return '';
}
function embeddedDescription(html=''){
  const normalized=html.replace(/\\u002F/gi,'/').replace(/\\u0026/gi,'&').replace(/\\\//g,'/');
  for(const m of normalized.matchAll(/"description"\s*:\s*"((?:\\.|[^"\\]){80,1800})"/gi)){
    try{const value=JSON.parse('"'+m[1]+'"');const text=htmlDecode(value.replace(/<[^>]*>/g,' '));if(text.length>100&&!/shop the latest|discover our|buy and sell/i.test(text))return text}catch{}
  }
  return '';
}
function cleanProductName(raw=''){
  let name=clean(raw).replace(/\s*\|\s*(Flight Club|GOAT|StockX).*$/i,'');
  const parts=name.split(/\s+-\s+/);
  if(parts.length>=3)name=parts[0];
  return name;
}
function inferredColorway(raw=''){
  const parts=clean(raw).replace(/\s*\|.*$/,'').split(/\s+-\s+/);
  if(parts.length>=4)return clean(parts.slice(3).join(' - '));
  const q=(raw.match(/[‘'“"]([^’'”"]{2,45})[’'”"]/ )||[])[1];return q||'';
}
function betterFallback(p){
  const name=cleanProductName(p.name)||clean(p.name)||'this shoe';
  const brand=BRANDS[p.brand_id]||'Dicey Shoes';
  const model=clean(p.model||'');
  const sku=clean(p.style_code||'');
  const color=inferredColorway(p.name||'');
  const collab=/\b(?:x|×)\b/i.test(name)||/(Travis Scott|Off-White|Fragment|Supreme|Kobe Bryant|Pharrell)/i.test(name);
  const lane=String(p.category||'').toLowerCase()==='running'?'running':String(p.category||'').toLowerCase()==='basketball'?'basketball':String(p.category||'').toLowerCase()==='skate'?'skateboarding':String(p.category||'').toLowerCase()==='luxury'?'luxury footwear':'lifestyle';
  let text=`The ${name} is ${collab?'a collaborative ':'a '}${brand}${model?` ${model}`:''} release made for ${lane} wear.`;
  if(color)text+=` This pair is presented in the ${color} colorway.`;
  if(model)text+=` It keeps the recognizable ${model} silhouette while this edition gives the shoe its own color and detailing.`;
  if(sku)text+=` Style code: ${sku}.`;
  return text;
}
async function getProduct(id,image){
  const select='product_id,brand_id,name,model,colorway,style_code,gender,category,description,retail_price,currency,product_url,image_url,image_source,image_usage,source_name,source_data,status';
  const qs=new URLSearchParams({select,limit:'1'});if(id)qs.set('product_id',`eq.${id}`);else if(image)qs.set('image_url',`eq.${image}`);else return null;
  const r=await fetch(`${BASE}/shoe_products?${qs}`,{headers,cache:'no-store'});if(!r.ok)return null;const rows=await r.json();return rows[0]||null;
}
async function existingMedia(id){
  const qs=new URLSearchParams({select:'media_url,position,angle,media_type',master_product_id:`eq.${id}`,media_type:'eq.IMAGE',order:'position.asc.nullslast,media_id.asc',limit:'20'});
  const r=await fetch(`${BASE}/shoe_product_media?${qs}`,{headers,cache:'no-store'});if(!r.ok)return[];return r.json();
}
async function sourcePage(value,mainImage=''){
  if(!value||!/^https:\/\//i.test(value))return {description:'',images:[]};
  try{
    const url=localizedSource(value);
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1','accept':'text/html,application/xhtml+xml'},redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!r.ok)return {description:'',images:[]};
    const html=await r.text();const normalized=html.replace(/\\u002F/gi,'/').replace(/\\u0026/gi,'&').replace(/\\\//g,'/');const images=[];let description='';
    const products=[];jsonLd(html).forEach(x=>walkProducts(x,products));
    for(const product of products){
      if(!description&&product.description)description=htmlDecode(String(product.description).replace(/<[^>]*>/g,' '));
      const imgs=Array.isArray(product.image)?product.image:[product.image];imgs.filter(Boolean).forEach(x=>addImage(images,typeof x==='string'?x:x?.url));
    }
    if(!description)description=metaContent(html,'og:description')||metaContent(html,'description')||embeddedDescription(html);
    addImage(images,metaContent(html,'og:image'));
    let mainId='';try{mainId=(new URL(mainImage).pathname.match(/\/original\/(\d+)_\d{2}/)||[])[1]||''}catch{}
    if(/(^|\.)goat\.com$/i.test(new URL(url).hostname)&&mainId){
      const candidates=normalized.match(/https:\/\/image\.goat\.com\/[^"'<> ]+?\.(?:png|jpe?g|webp)(?:\?[^"'<> ]*)?/gi)||[];
      candidates.filter(x=>x.includes(`/original/${mainId}_`)).slice(0,20).forEach(x=>addImage(images,x));
    }
    return {description,images:images.slice(0,12)};
  }catch{return {description:'',images:[]}}
}
async function imageWorks(url){
  try{
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)','accept':'image/avif,image/webp,image/*,*/*;q=0.8','range':'bytes=0-2047'},redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(4500)});
    const type=(r.headers.get('content-type')||'').toLowerCase();return (r.ok||r.status===206)&&type.startsWith('image/');
  }catch{return false}
}
async function verifiedImages(images,main){
  const unique=[...new Set(images)].slice(0,12);const checks=await Promise.all(unique.map(async url=>({url,ok:await imageWorks(url)})));const good=checks.filter(x=>x.ok).map(x=>x.url);if(!good.length&&main)addImage(good,main);return good.slice(0,10);
}
export async function GET(request){
  const q=new URL(request.url).searchParams;const id=q.get('id');const image=q.get('image');const p=await getProduct(id,image);if(!p)return Response.json({error:'Product not found'},{status:404});
  const images=[];addImage(images,p.image_url);(await existingMedia(p.product_id)).forEach(m=>addImage(images,m.media_url));
  const best=p.source_data?.bestPrice?.url||p.product_url||'';const source=await sourcePage(best,p.image_url);source.images.forEach(x=>addImage(images,x));
  const gallery=await verifiedImages(images,p.image_url);
  const generic=/\bby\s+.+\sis a sneakers\b|International size conversions are provided separately|Cataloged as unisex/i.test(p.description||'');
  const sourceDescription=clean(source.description);
  const description=(!generic&&clean(p.description).length>90?clean(p.description):sourceDescription.length>100?sourceDescription:betterFallback(p));
  return Response.json({productId:p.product_id,description,images:gallery,model:p.model||'',styleCode:p.style_code||'',colorway:p.colorway||'',sourceUrl:best},{headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}});
}
