#!/usr/bin/env node
// Publish to Instagram from the terminal or from GitHub Actions.
//
//   node scripts/instagram-publish.mjs --type image --image https://... --product samba-og-white-black-gum
//   node scripts/instagram-publish.mjs --type carousel --images https://a.jpg,https://b.jpg --caption "..."
//   node scripts/instagram-publish.mjs --type reel --video https://clip.mp4 --cover https://cover.jpg --caption "..."
//   node scripts/instagram-publish.mjs --queue next --queue-write
//
// Add --dry-run to validate, preflight the media and print the exact payload without publishing.

import fs from 'node:fs/promises';
import {
  createClient,publishImage,publishCarousel,publishReel,comment,publishingLimit,request,
  probeMedia,validateCaption,validateCarousel,assertPublicUrl,InstagramError,LIMITS
} from '../lib/instagram.js';
import {captionForProduct,captionForRelease,buildCaption,voiceCheck} from '../lib/instagram-copy.js';

const QUEUE_FILE='data/instagram-queue.json';

const ERROR_HINTS={
  190:'Access token is invalid or expired. Mint a new long-lived token and update IG_ACCESS_TOKEN.',
  4:'Application-level rate limit. Wait for the window to reset before retrying.',
  17:'User-level rate limit. Wait for the window to reset before retrying.',
  10:'The token is missing a permission — content publishing needs instagram_business_content_publish.',
  100:'A parameter was rejected. Check the media URL, container fields and media_type.',
  2207003:'Instagram could not download the media URL. It must be public https, no auth and no redirect wall.',
  2207020:'Instagram could not fetch the media. Re-host it and retry.',
  2207026:'Unsupported video format. Use MP4 (H.264 + AAC), 9:16, under the duration cap.',
  2207032:'Container creation failed on Instagram side. Retry with a fresh container.',
  9007:'The media does not meet Instagram spec (size, aspect ratio or duration).',
  36003:'Aspect ratio is outside the accepted range for this media type.'
};

function parseArgs(argv){
  const args={_:[]};
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(!token.startsWith('--')){args._.push(token);continue}
    const [flag,inline]=token.slice(2).split('=');
    const key=flag.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
    if(inline!==undefined){args[key]=inline;continue}
    const next=argv[i+1];
    if(next===undefined||next.startsWith('--')){
      if(key.startsWith('no')&&key.length>2)args[key[2].toLowerCase()+key.slice(3)]=false;
      else args[key]=true;
      continue;
    }
    args[key]=next;i++;
  }
  return args;
}

const log=(...parts)=>console.log(...parts);
const fail=(message,details)=>{console.error(`✗ ${message}`);if(details)console.error(details);process.exitCode=1};

async function readQueue(file=QUEUE_FILE){
  try{return JSON.parse(await fs.readFile(file,'utf8'))}
  catch{return{updatedAt:null,items:[]}}
}

function selectQueueItem(queue,selector){
  const items=queue.items||[];
  if(selector&&selector!=='next'&&selector!==true)return items.find(i=>i.id===selector)||null;
  const now=Date.now();
  return items
    .filter(i=>i.status==='ready'&&(!i.publishAt||Date.parse(i.publishAt)<=now))
    .sort((a,b)=>Date.parse(a.publishAt||0)-Date.parse(b.publishAt||0))[0]||null;
}

async function writeQueue(queue,file=QUEUE_FILE){
  queue.updatedAt=new Date().toISOString();
  await fs.writeFile(file,`${JSON.stringify(queue,null,2)}\n`);
}

async function resolveCopy(args){
  if(args.captionFile)return{caption:(await fs.readFile(args.captionFile,'utf8')).trim(),firstComment:args.firstComment||'',altText:args.altText||''};
  if(args.product){
    const built=captionForProduct(args.product,{intent:args.intent||'feature',angle:args.angle||'',cta:args.cta||''});
    return{caption:args.caption||built.caption,firstComment:args.firstComment??built.firstComment,altText:args.altText||built.altText};
  }
  if(args.release){
    const built=captionForRelease(args.release,{intent:args.intent||'drop',angle:args.angle||'',cta:args.cta||''});
    return{caption:args.caption||built.caption,firstComment:args.firstComment??built.firstComment,altText:args.altText||built.altText};
  }
  if(args.caption)return{caption:args.caption,firstComment:args.firstComment||'',altText:args.altText||''};
  if(args.headline){
    const built=buildCaption({intent:args.intent||'news',headline:args.headline,angle:args.angle||''});
    return{caption:built.caption,firstComment:args.firstComment??built.firstComment,altText:args.altText||built.altText};
  }
  return{caption:'',firstComment:args.firstComment||'',altText:args.altText||''};
}

function mediaUrls(args){
  if(args.type==='reel')return[args.video,args.cover].filter(Boolean);
  if(args.type==='carousel')return String(args.images||'').split(',').map(s=>s.trim()).filter(Boolean);
  return [args.image].filter(Boolean);
}

async function preflight(urls,{probe=true}={}){
  const rows=[];
  for(const url of urls){
    assertPublicUrl(url,'media');
    if(!probe){rows.push({url,skipped:true});continue}
    const head=await probeMedia(url);
    const mb=head.bytes?(head.bytes/1048576).toFixed(2):'?';
    if(!head.ok)rows.push({url,ok:false,note:`HEAD ${head.status||'failed'} — Instagram must be able to fetch this URL`});
    else if(head.contentType.startsWith('image/')&&head.bytes>LIMITS.imageBytes)rows.push({url,ok:false,note:`image is ${mb}MB, limit is 8MB`});
    else rows.push({url,ok:true,note:`${head.contentType||'unknown type'} · ${mb}MB`});
  }
  return rows;
}

function report(result,args){
  if(args.json){log(JSON.stringify(result,null,2));return}
  log(`✓ Published ${result.type} → ${result.mediaId}`);
  if(result.permalink)log(`  ${result.permalink}`);
  if(result.firstCommentId)log(`  first comment ${result.firstCommentId}`);
  if(result.quota)log(`  quota ${result.quota.used}/${result.quota.total} used in the last ${result.quota.windowHours}h`);
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  if(args.help){
    const source=String(await fs.readFile(new URL(import.meta.url))).split('\n').slice(1);
    const help=[];
    for(const line of source){if(!line.startsWith('//'))break;help.push(line.replace(/^\/\/ ?/,''))}
    log(help.join('\n'));
    return;
  }

  let queue=null,queueItem=null;
  if(args.queue){
    queue=await readQueue(args.queueFile||QUEUE_FILE);
    queueItem=selectQueueItem(queue,args.queue);
    if(!queueItem){log('Nothing in the queue is ready to publish.');return}
    for(const[key,value]of Object.entries(queueItem)){
      if(['id','status','publishAt','notes','publishedAt','mediaId'].includes(key))continue;
      if(args[key]===undefined)args[key]=value;
    }
    log(`Queue item: ${queueItem.id}`);
  }

  const type=String(args.type||'image').toLowerCase();
  if(!['image','carousel','reel'].includes(type))return fail(`Unknown --type "${type}". Use image, carousel or reel.`);
  args.type=type;

  const copy=await resolveCopy(args);
  const captionCheck=validateCaption(copy.caption);
  const voice=voiceCheck(copy.caption);
  const urls=mediaUrls(args);
  if(!urls.length)return fail(`No media URL. Pass --image, --images or --video for --type ${type}.`);

  if(type==='carousel'){
    const shape=validateCarousel(urls.map(u=>({imageUrl:u})));
    if(!shape.ok)return fail(shape.errors.join(' '));
  }
  if(!captionCheck.ok)return fail(captionCheck.errors.join(' '));

  log(`— ${type.toUpperCase()} · ${urls.length} asset${urls.length>1?'s':''} · caption ${captionCheck.length}/${LIMITS.captionChars} chars · ${captionCheck.hashtags.length} hashtags`);
  log(copy.caption?copy.caption.split('\n').map(l=>`  │ ${l}`).join('\n'):'  │ (no caption)');
  if(copy.firstComment)log(`  first comment: ${copy.firstComment}`);
  for(const warning of[...captionCheck.warnings,...voice.issues.map(i=>`${i.level}: ${i.message}`)])log(`  ! ${warning}`);

  const checks=await preflight(urls,{probe:args.probe!==false});
  for(const row of checks)log(`  ${row.skipped?'·':row.ok?'✓':'✗'} ${row.url} ${row.note||''}`);
  const blocked=checks.filter(r=>r.ok===false);
  if(blocked.length&&!args.force)return fail(`${blocked.length} asset(s) failed preflight. Fix them or rerun with --force.`);

  if(args.dryRun){
    log('Dry run — nothing was published.');
    if(args.json)log(JSON.stringify({dryRun:true,type,urls,caption:copy.caption,firstComment:copy.firstComment,checks},null,2));
    return;
  }

  const client=createClient();
  const quota=await publishingLimit(client);
  if(!quota.remaining&&!args.force)return fail(`Daily publishing quota exhausted (${quota.used}/${quota.total} in ${quota.windowHours}h).`);
  log(`  quota ${quota.used}/${quota.total} used, ${quota.remaining} left`);

  const onTick=({code,elapsedMs})=>log(`  container ${code||'IN_PROGRESS'} (${Math.round(elapsedMs/1000)}s)`);
  let result;
  if(type==='image')result=await publishImage(client,{imageUrl:urls[0],caption:copy.caption,altText:copy.altText,locationId:args.locationId,collaborators:args.collaborators?String(args.collaborators).split(','):null,poll:{onTick}});
  else if(type==='carousel')result=await publishCarousel(client,{items:urls.map(u=>({imageUrl:u})),caption:copy.caption,locationId:args.locationId,collaborators:args.collaborators?String(args.collaborators).split(','):null,poll:{onTick}});
  else result=await publishReel(client,{videoUrl:args.video,coverUrl:args.cover||'',caption:copy.caption,shareToFeed:args.shareToFeed!==false,audioName:args.audioName||'',collaborators:args.collaborators?String(args.collaborators).split(','):null,poll:{onTick}});

  if(copy.firstComment)result.firstCommentId=await comment(client,result.mediaId,copy.firstComment);
  try{result.permalink=(await request(client,result.mediaId,{params:{fields:'permalink'}})).permalink}catch{}
  result.quota=await publishingLimit(client);
  result.publishedAt=new Date().toISOString();
  report(result,args);

  if(queueItem&&args.queueWrite){
    queueItem.status='published';
    queueItem.publishedAt=result.publishedAt;
    queueItem.mediaId=result.mediaId;
    if(result.permalink)queueItem.permalink=result.permalink;
    await writeQueue(queue,args.queueFile||QUEUE_FILE);
    log(`  queue item ${queueItem.id} marked published`);
  }
}

main().catch(e=>{
  if(e instanceof InstagramError){
    fail(e.message,[e.code?`code ${e.code}${e.subcode?`/${e.subcode}`:''}`:'',ERROR_HINTS[Number(e.code)]||'',e.fbtrace?`fbtrace ${e.fbtrace}`:''].filter(Boolean).join('\n'));
  }else fail(e.message,e.stack?.split('\n').slice(1,4).join('\n'));
  process.exitCode=1;
});
