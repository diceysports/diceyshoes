#!/usr/bin/env node
// Decide what to post and post it, with no human in the loop.
//
//   node scripts/instagram-autopilot.mjs --dry-run   # decide and validate, publish nothing
//   node scripts/instagram-autopilot.mjs             # decide and publish
//
// Order of preference: a ready queue item, then a release dropping within the lead window,
// then the least recently posted shoe in the catalog. Media is fetched and measured first,
// so a dead CDN link or a bad crop is skipped instead of published. Cadence, the kill switch
// and the post history live in data/instagram-autopilot.json.

import fs from 'node:fs/promises';
import {createClient,publishImage,comment,publishingLimit,request,tokenStatus,InstagramError} from '../lib/instagram.js';
import {voiceCheck} from '../lib/instagram-copy.js';
import {defaultConfig,canPostNow,selectPost,recordPost} from '../lib/instagram-autopilot.js';

const STATE_FILE='data/instagram-autopilot.json';
const QUEUE_FILE='data/instagram-queue.json';
const inCI=Boolean(process.env.GITHUB_ACTIONS);

const log=(...parts)=>console.log(...parts);
const notice=text=>log(inCI?`::notice::${text}`:`— ${text}`);
const warn=text=>log(inCI?`::warning::${text}`:`! ${text}`);

function parseArgs(argv){
  const args={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--'))continue;
    const [flag,inline]=argv[i].slice(2).split('=');
    const key=flag.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
    args[key]=inline!==undefined?inline:(argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true);
  }
  return args;
}

async function readJson(file,fallback){
  try{return JSON.parse(await fs.readFile(file,'utf8'))}catch{return fallback}
}

const writeJson=(file,value)=>fs.writeFile(file,`${JSON.stringify(value,null,2)}\n`);

async function main(){
  const args=parseArgs(process.argv.slice(2));
  const now=args.now?new Date(args.now):new Date();
  const state=await readJson(STATE_FILE,{config:{},lastPostAt:null,history:[]});
  const queue=await readJson(QUEUE_FILE,{items:[]});
  const config={...defaultConfig,...(state.config||{})};
  const result={decidedAt:now.toISOString(),posted:false};

  const allowed=canPostNow(state,config,now);
  if(!allowed.ok&&!args.force){
    notice(`Standing down: ${allowed.reason}`);
    if(args.json)log(JSON.stringify({...result,reason:allowed.reason},null,2));
    return;
  }

  const choice=await selectPost({queue,state,config,now,onSkip:s=>log(`  skipped ${s.id}: ${s.reason}`)});
  if(!choice.candidate){
    warn(`Nothing publishable today — ${choice.skipped.length} candidate(s) failed media checks. The account will stay silent until an asset resolves.`);
    if(args.json)log(JSON.stringify({...result,skipped:choice.skipped},null,2));
    return;
  }

  const {candidate,media,copy}=choice;
  const voice=voiceCheck(copy.caption);
  log(`— ${candidate.kind} · ${candidate.id} · ${media.width}×${media.height} ${media.format}`);
  log(copy.caption.split('\n').map(line=>`  │ ${line}`).join('\n'));
  if(copy.firstComment)log(`  first comment: ${copy.firstComment}`);
  for(const issue of voice.issues)log(`  ! ${issue.level}: ${issue.message}`);
  for(const warning of media.warnings||[])log(`  ! ${warning}`);
  if(!voice.ok){
    warn('Generated copy failed the voice check — not posting.');
    process.exitCode=1;return;
  }

  if(args.dryRun){
    log('Dry run — nothing was published.');
    if(args.json)log(JSON.stringify({...result,candidate:candidate.id,caption:copy.caption,media},null,2));
    return;
  }

  const client=createClient();
  const token=await tokenStatus(client);
  if(token.checked&&!token.healthy)warn(`Instagram token expires in ${token.expiresInDays} days — refresh IG_ACCESS_TOKEN before it lapses.`);

  const quota=await publishingLimit(client);
  if(!quota.remaining){
    warn(`Publishing quota exhausted (${quota.used}/${quota.total}).`);
    return;
  }

  const published=await publishImage(client,{
    imageUrl:candidate.imageUrl,
    caption:copy.caption,
    altText:copy.altText,
    poll:{onTick:({code,elapsedMs})=>log(`  container ${code||'IN_PROGRESS'} (${Math.round(elapsedMs/1000)}s)`)}
  });
  if(copy.firstComment)published.firstCommentId=await comment(client,published.mediaId,copy.firstComment);
  try{published.permalink=(await request(client,published.mediaId,{params:{fields:'permalink'}})).permalink}catch{}

  const entry={
    id:candidate.id,kind:candidate.kind,at:new Date().toISOString(),
    mediaId:published.mediaId,permalink:published.permalink||'',caption:copy.caption
  };
  await writeJson(STATE_FILE,{...recordPost(state,entry),config:state.config||{}});

  if(candidate.queueId){
    const item=(queue.items||[]).find(row=>row.id===candidate.queueId);
    if(item){
      item.status='published';
      item.publishedAt=entry.at;
      item.mediaId=published.mediaId;
      if(published.permalink)item.permalink=published.permalink;
      queue.updatedAt=entry.at;
      await writeJson(QUEUE_FILE,queue);
    }
  }

  Object.assign(result,{posted:true,...entry,quota:await publishingLimit(client)});
  notice(`Posted ${candidate.id} → ${published.permalink||published.mediaId}`);
  if(args.json)log(JSON.stringify(result,null,2));
}

main().catch(e=>{
  if(e instanceof InstagramError)console.error(`✗ ${e.message}${e.code?` (code ${e.code})`:''}${e.fbtrace?` fbtrace ${e.fbtrace}`:''}`);
  else console.error(`✗ ${e.message}`);
  process.exitCode=1;
});
