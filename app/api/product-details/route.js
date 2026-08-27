const BASE='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const IMAGE_HOSTS=['image.goat.com','static.nike.com','images.stockx.com','www.stadiumgoods.com','stadiumgoods.com','cdn.shopify.com','media.gucci.com','ca.louisvuitton.com','media.balenciaga.cn','cdn-images.farfetch-contents.com','img.mytheresa.com'];

export const runtime='nodejs';
export const dynamic='force-dynamic';

const headers={apikey:KEY,Authorization:`Bearer ${KEY}`};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
function allowedImage(value=''){
  try{const u=new URL(value.replace(/^http:/,'https:'));return u.protocol==='https:'&&IMAGE_HOSTS.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}
}
function addImage(list,value){
  if(!value)return;
  const v=String(value).replace(/^http:/,'https:').replace(/&amp;/g,'&');
  if(allowedImage(v)&&!list.includes(v))list.push(v);
}
function goatAngles(url=''){
  const m=String(url).match(/^(.*\/original\/\d+_)(\d{2})(\.jpg\.jpeg.*)$/i);
  if(!m)return [];
  return Array.from({length:8},(_,i)=>`${m[1]}${String(i+1).padStart(2,'0')}${m[3]}`);
}
function jsonLd(html=''){
  const blocks=[...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const out=[];
  for(const b of blocks){try{const x=JSON.parse(b[1]);out.push(...(Array.isArray(x)?x:[x]))}catch{}}
  return out;
}
function walkProducts(node,out=[]){
  if(!node||typeof node!=='object')return out;
  if(String(node['@type']||'').toLowerCase()==='product')out.push(node);
  if(Array.isArray(node['@graph']))node['@graph'].forEach(x=>walkProducts(x,out));
  return out;
}
function decodeHtml(s=''){return clean(s.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'))}
function metaContent(html,key){
  const esc=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const a=new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']+)["']`,'i').exec(html);
  const b=new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${esc}["']`,'i').exec(html);
  return decodeHtml((a||b||[])[1]||'');
}
function betterFallback(p){
  const name=clean(p.name).replace(/\s*\|\s*(Flight Club|GOAT|StockX).*$/i,'').replace(/\s+-\s+[^-]+\s+-\s+[A-Z0-9 ]+\s+-\s+/,' — ');
  const brand=clean(p.brand_name||p.brand||'');
  const model=clean(p.model||'');
  const sku=clean(p.style_code||'');
  const quoted=(name.match(/[‘'“"]([^’'”"]{2,45})[’'”"]/ )||[])[1];
  const collab=/\b(x|×)\b/i.test(name)?' collaborative':'';
  const lane=String(p.category||'').toLowerCase()==='running'?'performance running':String(p.category||'').toLowerCase()==='basketball'?'basketball':String(p.category||'').toLowerCase()==='skate'?'skate':String(p.category||'').toLowerCase()==='luxury'?'luxury footwear':'lifestyle';
  let text=`The ${name} is a${collab} ${brand}${model?` ${model}`:''} release built for ${lane} wear.`;
  if(quoted)text+=` This edition is known as “${quoted},” giving the silhouette its own distinct identity within the ${model||brand} line.`;
  if(sku)text+=` The style code for this pair is ${sku}.`;
  text+=' The photos above show the actual colorway and detailing from multiple angles when source imagery is available.';
  return text;
}
async function getProduct(id,image){
  const select='product_id,brand_id,name,model,colorway,style_code,gender,category,description,retail_price,currency,product_url,image_url,image_source,image_usage,source_name,source_data,status';
  const qs=new URLSearchParams({select,limit:'1'});
  if(id)qs.set('product_id',`eq.${id}`);else if(image)qs.set('image_url',`eq.${image}`);else return null;
  const r=await fetch(`${BASE}/shoe_products?${qs}`,{headers,cache:'no-store'});
  if(!r.ok)return null;const rows=await r.json();return rows[0]||null;
}
async function existingMedia(id){
  const qs=new URLSearchParams({select:'media_url,position,angle,media_type',master_product_id:`eq.${id}`,media_type:'eq.IMAGE',order:'position.asc.nullslast,media_id.asc',limit:'20'});
  const r=await fetch(`${BASE}/shoe_product_media?${qs}`,{headers,cache:'no-store'});if(!r.ok)return[];return r.json();
}
async function sourcePage(url){
  if(!url||!/^https:\/\//i.test(url))return {description:'',images:[]};
  try{
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)','accept':'text/html,application/xhtml+xml'},redirect:'follow',next:{revalidate:604800}});
    if(!r.ok)return {description:'',images:[]};
    const html=await r.text();const images=[];let description='';
    const products=[];jsonLd(html).forEach(x=>walkProducts(x,products));
    for(const product of products){
      if(!description&&product.description)description=decodeHtml(String(product.description).replace(/<[^>]*>/g,' '));
      const imgs=Array.isArray(product.image)?product.image:[product.image];imgs.filter(Boolean).forEach(x=>addImage(images,typeof x==='string'?x:x?.url));
    }
    if(!description)description=metaContent(html,'og:description')||metaContent(html,'description');
    addImage(images,metaContent(html,'og:image'));
    const candidates=html.match(/https?:\\?\/\\?\/[^"'<> ]+?\.(?:png|jpe?g|webp)(?:\?[^"'<> ]*)?/gi)||[];
    candidates.slice(0,100).forEach(x=>addImage(images,x.replace(/\\\//g,'/').replace(/\\u0026/g,'&')));
    return {description,images:images.slice(0,12)};
  }catch{return {description:'',images:[]}}
}
export async function GET(request){
  const q=new URL(request.url).searchParams;const id=q.get('id');const image=q.get('image');
  const p=await getProduct(id,image);if(!p)return Response.json({error:'Product not found'},{status:404});
  const images=[];addImage(images,p.image_url);
  (await existingMedia(p.product_id)).forEach(m=>addImage(images,m.media_url));
  goatAngles(p.image_url).forEach(x=>addImage(images,x));
  const best=p.source_data?.bestPrice?.url||p.product_url||'';
  const source=await sourcePage(best);
  source.images.forEach(x=>addImage(images,x));
  const generic=/\bby\s+.+\sis a sneakers\b|International size conversions are provided separately|Cataloged as unisex/i.test(p.description||'');
  const description=(!generic&&clean(p.description).length>90?clean(p.description):clean(source.description).length>100?clean(source.description):betterFallback(p));
  return Response.json({productId:p.product_id,description,images:images.slice(0,10),model:p.model||'',styleCode:p.style_code||'',colorway:p.colorway||'',sourceUrl:best},{headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}});
}
