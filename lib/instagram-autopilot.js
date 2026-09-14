// Autopilot: picks what Dicey Shoes posts next without a human in the loop.
// Ranking is queue item -> confirmed drop -> catalog rotation. A candidate is only
// eligible once its media has been fetched and measured, so a broken or badly cropped
// asset is skipped rather than published.

import {products} from './products.js';
import {dailyReleaseUpdates} from './releases-daily.js';
import {buildCaption,findProduct} from './instagram-copy.js';
import {imageDimensions,probeMedia,validateImage,LIMITS} from './instagram.js';

export const defaultConfig={
  enabled:true,
  maxPostsPerDay:1,
  minHoursBetweenPosts:12,
  dropLeadDays:1,
  catalogCooldownDays:21,
  maxCandidates:8,
  // Public bucket holding artwork named by catalog slug, e.g. https://media.example.com/instagram.
  // Preferred over the catalog's third-party CDN links, which can refuse Instagram's fetcher.
  mediaBaseUrl:'',
  mediaExtension:'jpg'
};

const MONTHS={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
const DAY_MS=86400000;
const dayKey=date=>new Date(date).toISOString().slice(0,10);

// Release rows carry "Sep 19" with no year — resolve against now, rolling forward at year end.
export function parseReleaseDate(value='',now=new Date()){
  const match=String(value).trim().match(/^([A-Za-z]{3})[a-z]*\s+(\d{1,2})$/);
  if(!match)return null;
  const month=MONTHS[match[1].toLowerCase()];
  if(month===undefined)return null;
  const reference=new Date(now);
  let date=new Date(Date.UTC(reference.getUTCFullYear(),month,Number(match[2])));
  if(date.getTime()-reference.getTime()<-60*DAY_MS)date=new Date(Date.UTC(reference.getUTCFullYear()+1,month,Number(match[2])));
  return date;
}

export function postsOn(state,date){
  const key=dayKey(date);
  return (state.history||[]).filter(entry=>dayKey(entry.at)===key).length;
}

export function canPostNow(state={},config=defaultConfig,now=new Date()){
  if(config.enabled===false)return{ok:false,reason:'Autopilot is disabled in data/instagram-autopilot.json.'};
  const today=postsOn(state,now);
  if(today>=config.maxPostsPerDay)return{ok:false,reason:`Already posted ${today} time(s) today, cap is ${config.maxPostsPerDay}.`};
  const last=state.lastPostAt?Date.parse(state.lastPostAt):0;
  const gapHours=(now.getTime()-last)/3600000;
  if(last&&gapHours<config.minHoursBetweenPosts)return{ok:false,reason:`Last post was ${gapHours.toFixed(1)}h ago, minimum gap is ${config.minHoursBetweenPosts}h.`};
  return{ok:true,reason:''};
}

function postedAt(state,id){
  const rows=(state.history||[]).filter(entry=>entry.id===id);
  return rows.length?Math.max(...rows.map(entry=>Date.parse(entry.at)||0)):0;
}

export function bucketUrl(config,slug){
  const base=String(config.mediaBaseUrl||process.env.IG_MEDIA_BASE_URL||'').replace(/\/+$/,'');
  return base?`${base}/${slug}.${config.mediaExtension||'jpg'}`:'';
}

function queueCandidates(queue,state,now){
  return (queue.items||[])
    .filter(item=>item.status==='ready'&&(!item.publishAt||Date.parse(item.publishAt)<=now.getTime()))
    .filter(item=>!postedAt(state,`queue:${item.id}`))
    .sort((a,b)=>Date.parse(a.publishAt||0)-Date.parse(b.publishAt||0))
    .map(item=>({
      id:`queue:${item.id}`,kind:'queue',queueId:item.id,
      type:item.type||'image',intent:item.intent||'feature',
      sources:[item.image||String(item.images||'').split(',')[0]].filter(Boolean),
      imageUrl:item.image||'',imageUrls:item.images||'',videoUrl:item.video||'',coverUrl:item.cover||'',
      product:item.product?findProduct(item.product):null,
      release:item.release?dailyReleaseUpdates.find(r=>r.name.toLowerCase().includes(String(item.release).toLowerCase())):null,
      caption:item.caption||''
    }));
}

function dropCandidates(state,config,now){
  const horizon=now.getTime()+config.dropLeadDays*DAY_MS;
  return dailyReleaseUpdates
    .map(release=>({release,date:parseReleaseDate(release.date,now)}))
    .filter(row=>row.date&&row.date.getTime()>=now.getTime()-DAY_MS&&row.date.getTime()<=horizon)
    // Only a release's own artwork is usable. Borrowing another shoe's photo would
    // caption one sneaker over a picture of a different one.
    .filter(row=>row.release.image)
    .filter(row=>!postedAt(state,`drop:${row.release.name}`))
    .sort((a,b)=>a.date-b.date)
    .map(row=>({
      id:`drop:${row.release.name}`,kind:'drop',type:'image',intent:'drop',
      sources:[row.release.image],imageUrl:row.release.image,release:row.release,product:null,caption:''
    }));
}

function catalogCandidates(state,config,now){
  const cooldown=config.catalogCooldownDays*DAY_MS;
  const rows=products
    .filter(product=>product.image&&['In Stock','Low Stock','New Release'].includes(product.status))
    .map(product=>({product,last:postedAt(state,`catalog:${product.slug}`)}));
  const rested=rows.filter(row=>!row.last||now.getTime()-row.last>cooldown);
  // Cooldown is a preference, not a dead end: once the whole catalog has been through,
  // keep rotating from the least recently posted instead of going silent.
  return (rested.length?rested:rows)
    .sort((a,b)=>a.last-b.last||a.product.slug.localeCompare(b.product.slug))
    .map(row=>({
      id:`catalog:${row.product.slug}`,kind:'catalog',type:'image',
      intent:row.product.status==='New Release'?'drop':row.product.status==='Low Stock'?'restock':'feature',
      sources:[bucketUrl(config,row.product.slug),row.product.image].filter(Boolean),
      imageUrl:row.product.image,product:row.product,release:null,caption:''
    }));
}

export function buildCandidates({queue={items:[]},state={},config=defaultConfig,now=new Date()}={}){
  return[
    ...queueCandidates(queue,state,now),
    ...dropCandidates(state,config,now),
    ...catalogCandidates(state,config,now)
  ].slice(0,config.maxCandidates);
}

export async function resolveMedia(url,{fetchImpl=globalThis.fetch}={}){
  if(!url)return{ok:false,reason:'no media URL'};
  if(!/^https:\/\//i.test(url))return{ok:false,reason:'media URL is not https'};
  const head=await probeMedia(url,{fetchImpl});
  if(head.ok&&head.contentType&&!head.contentType.startsWith('image/'))return{ok:false,reason:`content-type is ${head.contentType}`};
  if(head.ok&&head.bytes>LIMITS.imageBytes)return{ok:false,reason:`image is ${(head.bytes/1048576).toFixed(1)}MB`};
  // Some CDNs refuse HEAD but serve a ranged GET, which is also how we measure the image.
  const size=await imageDimensions(url,{fetchImpl});
  if(!size.ok)return{ok:false,reason:head.ok?`could not read image header (${size.reason||size.status})`:`unreachable (HTTP ${head.status||size.status||'error'})`};
  const check=validateImage({width:size.width,height:size.height});
  if(!check.ok)return{ok:false,reason:check.errors[0],width:size.width,height:size.height};
  return{ok:true,url,width:size.width,height:size.height,format:size.format,warnings:check.warnings};
}

export function captionFor(candidate){
  if(candidate.caption)return{caption:candidate.caption,firstComment:'',altText:''};
  return buildCaption({
    intent:candidate.intent,
    product:candidate.product,
    release:candidate.release,
    seed:candidate.id
  });
}

export async function selectPost({queue,state,config=defaultConfig,now=new Date(),fetchImpl=globalThis.fetch,onSkip=null}={}){
  const candidates=buildCandidates({queue,state,config,now});
  const skipped=[];
  for(const candidate of candidates){
    const sources=candidate.sources?.length?candidate.sources:[candidate.imageUrl].filter(Boolean);
    let media=null;
    for(const url of sources){
      const attempt=await resolveMedia(url,{fetchImpl});
      if(attempt.ok){media=attempt;break}
      skipped.push({id:candidate.id,url,reason:attempt.reason});
      if(onSkip)onSkip({id:candidate.id,url,reason:attempt.reason});
    }
    if(!media)continue;
    return{candidate:{...candidate,imageUrl:media.url},media,copy:captionFor(candidate),skipped};
  }
  return{candidate:null,media:null,copy:null,skipped};
}

export function recordPost(state,entry){
  const next={...state,lastPostAt:entry.at,history:[...(state.history||[]),entry]};
  next.history=next.history.slice(-200);
  return next;
}
