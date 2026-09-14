#!/usr/bin/env node
// Offline checks for the Instagram client and copy modules. No network, no credentials.
//
//   node --test scripts/instagram-selftest.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createClient,request,validateCaption,validateImage,validateReel,validateCarousel,
  assertPublicUrl,waitForContainer,publishImage,publishCarousel,publishReel,publishingLimit,
  InstagramError,LIMITS
} from '../lib/instagram.js';
import {
  buildHashtags,captionForProduct,captionForRelease,voiceCheck,draftReply,bannedPhrases
} from '../lib/instagram-copy.js';
import {
  parseReleaseDate,canPostNow,buildCandidates,resolveMedia,selectPost,recordPost,
  captionFor,bucketUrl,defaultConfig
} from '../lib/instagram-autopilot.js';
import {readImageSize} from '../lib/instagram.js';

function mockFetch(handler){
  const calls=[];
  const fetchImpl=async(url,init={})=>{
    const body=init.body instanceof URLSearchParams?Object.fromEntries(init.body):{};
    const call={url:String(url),method:init.method||'GET',body,auth:init.headers?.Authorization||''};
    calls.push(call);
    const reply=await handler(call,calls.length);
    return{
      ok:reply.status===undefined||reply.status<400,
      status:reply.status??200,
      headers:new Map(),
      text:async()=>JSON.stringify(reply.json??{})
    };
  };
  return{fetchImpl,calls};
}

const client=(fetchImpl,extra={})=>createClient({token:'test-token',userId:'17841400000000000',fetch:fetchImpl,retries:0,...extra});

test('caption validation enforces Instagram limits',()=>{
  assert.equal(validateCaption('Clean pair. Link in bio.').ok,true);
  const long=validateCaption('x'.repeat(LIMITS.captionChars+1));
  assert.equal(long.ok,false);
  assert.match(long.errors[0],/limit is 2200/);
  const tags=validateCaption(Array.from({length:31},(_,i)=>`#tag${i}`).join(' '));
  assert.equal(tags.ok,false);
  assert.match(tags.errors[0],/31 hashtags/);
  assert.equal(validateCaption('#af1 #nike travis heat').hashtags.length,2);
});

test('image validation rejects out-of-range aspect ratios and oversize files',()=>{
  assert.equal(validateImage({width:1080,height:1350}).ok,true);            // 4:5
  assert.equal(validateImage({width:1080,height:1080}).ok,true);            // 1:1
  assert.equal(validateImage({width:1080,height:1920}).ok,false);           // 9:16 is not a feed ratio
  assert.equal(validateImage({bytes:9*1024*1024}).ok,false);
  assert.equal(validateImage({format:'png'}).ok,false);
  assert.ok(validateImage({width:400,height:400}).warnings.length);
});

test('reel validation enforces the duration cap',()=>{
  assert.equal(validateReel({seconds:45,width:1080,height:1920}).ok,true);
  const long=validateReel({seconds:LIMITS.reelSeconds+1});
  assert.equal(long.ok,false);
  assert.match(long.errors[0],new RegExp(`cap is ${LIMITS.reelSeconds}s`));
  assert.equal(validateReel({seconds:1}).ok,false);
  assert.ok(validateReel({seconds:30,width:1080,height:1080}).warnings.length);
});

test('carousel validation enforces the 2-10 slide range',()=>{
  assert.equal(validateCarousel([{imageUrl:'https://a/1.jpg'}]).ok,false);
  assert.equal(validateCarousel(Array.from({length:11},(_,i)=>({imageUrl:`https://a/${i}.jpg`}))).ok,false);
  assert.equal(validateCarousel([{imageUrl:'https://a/1.jpg'},{imageUrl:'https://a/2.jpg'}]).ok,true);
  assert.equal(validateCarousel([{imageUrl:'https://a/1.jpg'},{}]).ok,false);
});

test('media URLs must be public https',()=>{
  assert.throws(()=>assertPublicUrl('http://cdn.example.com/a.jpg'),/must be https/);
  assert.throws(()=>assertPublicUrl('https://localhost:3000/a.jpg'),/publicly reachable/);
  assert.throws(()=>assertPublicUrl('not-a-url'),/not a valid URL/);
  assert.equal(assertPublicUrl('https://cdn.example.com/a.jpg'),'https://cdn.example.com/a.jpg');
});

test('missing credentials fail before any network call',async()=>{
  const {fetchImpl,calls}=mockFetch(()=>({json:{}}));
  const bare=createClient({token:'',userId:'',fetch:fetchImpl});
  await assert.rejects(()=>request(bare,'me'),/Missing credentials/);
  assert.equal(calls.length,0);
});

test('image publish runs create -> poll -> publish and keeps the token out of the URL',async()=>{
  const {fetchImpl,calls}=mockFetch(call=>{
    if(call.url.includes('/media_publish'))return{json:{id:'MEDIA_1'}};
    if(call.url.includes('/media'))return{json:{id:'CONTAINER_1'}};
    if(call.url.includes('CONTAINER_1'))return{json:{id:'CONTAINER_1',status_code:calls.length<3?'IN_PROGRESS':'FINISHED'}};
    return{json:{}};
  });
  const result=await publishImage(client(fetchImpl),{
    imageUrl:'https://cdn.example.com/aj1.jpg',caption:'Air Jordan 1 in stock.',poll:{intervalMs:1}
  });
  assert.deepEqual(result,{mediaId:'MEDIA_1',containerId:'CONTAINER_1',type:'IMAGE'});
  assert.equal(calls[0].method,'POST');
  assert.equal(calls[0].body.image_url,'https://cdn.example.com/aj1.jpg');
  assert.equal(calls[0].body.caption,'Air Jordan 1 in stock.');
  assert.equal(calls[0].auth,'Bearer test-token');
  assert.ok(calls.every(c=>!c.url.includes('test-token')),'token must never appear in a request URL');
  assert.ok(calls.some(c=>c.url.includes('status_code')),'container status must be polled');
  assert.equal(calls.at(-1).body.creation_id,'CONTAINER_1');
});

test('carousel publish creates one child per slide then the parent container',async()=>{
  const {fetchImpl,calls}=mockFetch(call=>{
    if(call.url.includes('/media_publish'))return{json:{id:'MEDIA_2'}};
    if(call.body?.media_type==='CAROUSEL')return{json:{id:'PARENT'}};
    if(call.url.includes('/media')&&call.method==='POST')return{json:{id:`CHILD_${calls.length}`}};
    return{json:{id:'PARENT',status_code:'FINISHED'}};
  });
  const result=await publishCarousel(client(fetchImpl),{
    items:[{imageUrl:'https://cdn.example.com/1.jpg'},{imageUrl:'https://cdn.example.com/2.jpg'},{imageUrl:'https://cdn.example.com/3.jpg'}],
    caption:'Three angles.',poll:{intervalMs:1}
  });
  assert.equal(result.children.length,3);
  assert.equal(result.mediaId,'MEDIA_2');
  const parent=calls.find(c=>c.body?.media_type==='CAROUSEL');
  assert.equal(parent.body.children,result.children.join(','));
  assert.ok(calls.filter(c=>c.body?.is_carousel_item==='true').length===3);
});

test('reel publish sets media_type REELS and share_to_feed',async()=>{
  const {fetchImpl,calls}=mockFetch(call=>{
    if(call.url.includes('/media_publish'))return{json:{id:'MEDIA_3'}};
    if(call.method==='POST')return{json:{id:'REEL_1'}};
    return{json:{id:'REEL_1',status_code:'FINISHED'}};
  });
  const result=await publishReel(client(fetchImpl),{
    videoUrl:'https://cdn.example.com/clip.mp4',coverUrl:'https://cdn.example.com/cover.jpg',
    caption:'On feet.',shareToFeed:false,poll:{intervalMs:1}
  });
  assert.equal(result.type,'REELS');
  assert.equal(calls[0].body.media_type,'REELS');
  assert.equal(calls[0].body.share_to_feed,'false');
  assert.equal(calls[0].body.cover_url,'https://cdn.example.com/cover.jpg');
});

test('a container that errors stops the publish',async()=>{
  const {fetchImpl}=mockFetch(()=>({json:{id:'C',status_code:'ERROR',status:'Media download failed'}}));
  await assert.rejects(
    ()=>waitForContainer(client(fetchImpl),'C',{intervalMs:1}),
    e=>e instanceof InstagramError&&/Media download failed/.test(e.message)
  );
});

test('an expired container is reported as expired, not retried forever',async()=>{
  const {fetchImpl}=mockFetch(()=>({json:{id:'C',status_code:'EXPIRED'}}));
  await assert.rejects(()=>waitForContainer(client(fetchImpl),'C',{intervalMs:1}),/expired/);
});

test('polling gives up once the timeout passes',async()=>{
  const {fetchImpl}=mockFetch(()=>({json:{id:'C',status_code:'IN_PROGRESS'}}));
  await assert.rejects(()=>waitForContainer(client(fetchImpl),'C',{intervalMs:1,timeoutMs:5}),/still IN_PROGRESS/);
});

test('API errors carry the Instagram code and never echo the token',async()=>{
  const {fetchImpl}=mockFetch(()=>({status:400,json:{error:{message:'Invalid OAuth access token test-token',code:190,fbtrace_id:'abc'}}}));
  await assert.rejects(()=>request(client(fetchImpl),'me'),e=>{
    assert.equal(e.code,190);
    assert.equal(e.fbtrace,'abc');
    assert.ok(!e.message.includes('test-token'),'token must be redacted from error messages');
    return true;
  });
});

test('transient failures are retried with backoff',async()=>{
  let seen=0;
  const {fetchImpl}=mockFetch(()=>{seen++;return seen===1?{status:500,json:{error:{message:'boom',code:2}}}:{json:{id:'ok'}}});
  const result=await request(client(fetchImpl,{retries:2}),'me');
  assert.equal(result.id,'ok');
  assert.equal(seen,2);
});

test('publishing limit reports remaining quota',async()=>{
  const {fetchImpl}=mockFetch(()=>({json:{data:[{config:{quota_total:50,quota_duration:86400},quota_usage:12}]}}));
  assert.deepEqual(await publishingLimit(client(fetchImpl)),{used:12,total:50,remaining:38,windowHours:24});
});

test('hashtags are tiered, deduped and capped',()=>{
  const tags=buildHashtags({brand:'Jordan',name:'Air Jordan 1 Low “Mocha”',intent:'drop',count:12});
  assert.ok(tags.includes('#diceyshoes'),'branded tag first');
  assert.ok(tags.includes('#airjordan1'),'model tag from the name');
  assert.ok(tags.includes('#sneakerrelease'),'intent tag');
  assert.equal(new Set(tags).size,tags.length,'no duplicates');
  assert.ok(tags.length<=12);
  assert.ok(buildHashtags({brand:'Nike',name:'Air Force 1',count:99}).length<=LIMITS.hashtags);
});

test('catalog captions are on-voice, within limits and deterministic',()=>{
  const first=captionForProduct('samba-og-white-black-gum');
  const second=captionForProduct('samba-og-white-black-gum');
  assert.equal(first.caption,second.caption,'same input, same copy');
  assert.ok(first.caption.includes('Samba OG'));
  assert.ok(first.caption.includes('$100'),'price comes from the catalog');
  assert.equal(validateCaption(first.caption).ok,true);
  assert.equal(voiceCheck(first.caption).ok,true);
  assert.equal(first.caption.includes('#'),false,'hashtags belong in the first comment');
  assert.ok(first.firstComment.startsWith('#'));
  assert.ok(first.altText.length>0,'alt text is generated for accessibility');
  assert.throws(()=>captionForProduct('no-such-shoe'),/No catalog product/);
});

test('release captions carry the drop date and source',()=>{
  const drop=captionForRelease('Space Jam');
  assert.ok(drop.caption.includes('Sep 19'));
  assert.ok(drop.caption.includes('$215'));
  assert.ok(/Nice Kicks/.test(drop.caption));
  assert.equal(voiceCheck(drop.caption).ok,true);
});

test('voice check flags marketing filler and shouting',()=>{
  assert.equal(voiceCheck(`This ${bannedPhrases[0]} drop is here.`).ok,false);
  assert.ok(voiceCheck('HUGE DROP ALERT TODAY').issues.some(i=>/caps/.test(i.message)));
  assert.ok(voiceCheck('🔥🔥🔥🔥 heat').issues.some(i=>/emoji/.test(i.message)));
  assert.ok(voiceCheck('Fire pair!!').issues.some(i=>/exclamation/.test(i.message)));
  assert.equal(voiceCheck('Samba OG is back. $100. Link in bio.').ok,true);
});

test('comment replies are classified before drafting',()=>{
  assert.equal(draftReply('how much is this?').intent,'price');
  assert.equal(draftReply('do you have a size 10?').intent,'sizing');
  assert.equal(draftReply('do you ship to Canada?').intent,'shipping');
  assert.equal(draftReply('is this legit?').intent,'authenticity');
  assert.equal(draftReply('these are 🔥').intent,'hype');
  assert.equal(draftReply('good morning').intent,'general');
  assert.ok(draftReply('these are 🔥',{username:'kicksfan'}).reply.includes('@kicksfan'));
  for(const text of['how much','size 10','ship to canada','legit?','🔥','hello'])
    assert.equal(voiceCheck(draftReply(text).reply).ok,true,`reply to "${text}" must stay on voice`);
});

// ---------- autopilot ----------

function pngBuffer(width,height){
  const bytes=new Uint8Array(32);
  bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a],0);
  const view=new DataView(bytes.buffer);
  view.setUint32(16,width);
  view.setUint32(20,height);
  return bytes;
}

function jpegBuffer(width,height){
  const bytes=new Uint8Array(40);
  bytes.set([0xff,0xd8],0);
  bytes.set([0xff,0xe0,0x00,0x10],2);      // APP0, next marker at 20
  bytes.set([0xff,0xc0,0x00,0x11,0x08],20); // SOF0
  const view=new DataView(bytes.buffer);
  view.setUint16(25,height);
  view.setUint16(27,width);
  return bytes;
}

function mediaFetch(routes){
  return async(url,init={})=>{
    const route=routes[String(url)]||{status:404};
    if(route.throws)throw new Error(route.throws);
    const headers=new Map([['content-type',route.contentType||'image/png'],['content-length',String(route.bytes??32)]]);
    return{
      ok:(route.status??200)<400,
      status:route.status??(init.headers?.Range?206:200),
      headers,
      arrayBuffer:async()=>(route.buffer||pngBuffer(1080,1350)).buffer,
      text:async()=>''
    };
  };
}

const NOW=new Date('2026-09-14T15:00:00Z');

test('image headers are parsed for PNG, JPEG and junk',()=>{
  assert.deepEqual(readImageSize(pngBuffer(1080,1350)),{width:1080,height:1350,format:'png'});
  assert.deepEqual(readImageSize(jpegBuffer(1080,1350)),{width:1080,height:1350,format:'jpeg'});
  assert.equal(readImageSize(new Uint8Array([1,2,3])),null);
});

test('release dates resolve against now and roll over the year boundary',()=>{
  assert.equal(parseReleaseDate('Sep 19',NOW).toISOString().slice(0,10),'2026-09-19');
  assert.equal(parseReleaseDate('Jan 05',NOW).toISOString().slice(0,10),'2027-01-05');
  assert.equal(parseReleaseDate('Aug 31',NOW).toISOString().slice(0,10),'2026-08-31');
  assert.equal(parseReleaseDate('not a date',NOW),null);
});

test('cadence limits stop the autopilot posting twice in a day',()=>{
  assert.equal(canPostNow({history:[]},defaultConfig,NOW).ok,true);
  const postedToday={history:[{id:'catalog:x',at:'2026-09-14T09:00:00Z'}],lastPostAt:'2026-09-14T09:00:00Z'};
  assert.equal(canPostNow(postedToday,defaultConfig,NOW).ok,false);
  assert.match(canPostNow(postedToday,defaultConfig,NOW).reason,/cap is 1/);
  const yesterday={history:[{id:'catalog:x',at:'2026-09-13T22:00:00Z'}],lastPostAt:'2026-09-13T22:00:00Z'};
  assert.equal(canPostNow(yesterday,defaultConfig,NOW).ok,true,'a 17h gap into a new day must clear the daily slot');
  assert.equal(canPostNow(yesterday,{...defaultConfig,minHoursBetweenPosts:24},NOW).ok,false);
  assert.equal(canPostNow({history:[]},{...defaultConfig,enabled:false},NOW).ok,false);
});

test('candidates rank queue first and skip releases with no artwork of their own',()=>{
  const queue={items:[
    {id:'ready-one',status:'ready',publishAt:'2026-09-01T00:00:00Z',type:'image',image:'https://cdn.example.com/q.jpg',product:'samba-og-white-black-gum'},
    {id:'draft-one',status:'draft',image:'https://cdn.example.com/d.jpg'}
  ]};
  const candidates=buildCandidates({queue,state:{history:[]},now:NOW});
  assert.equal(candidates[0].id,'queue:ready-one');
  assert.equal(candidates[0].product.slug,'samba-og-white-black-gum');
  assert.ok(!candidates.some(c=>c.id.startsWith('queue:draft-one')),'drafts are never candidates');
  assert.ok(!candidates.some(c=>c.kind==='drop'),'releases without their own image are not posted over another shoe photo');
  assert.ok(candidates.some(c=>c.kind==='catalog'));
  assert.ok(candidates.every(c=>c.sources.length),'every candidate carries at least one media source');
});

test('own-bucket artwork is tried before the catalog CDN link',async()=>{
  const config={...defaultConfig,mediaBaseUrl:'https://media.example.com/ig/',maxCandidates:1};
  const candidate=buildCandidates({state:{history:[]},config,now:NOW})[0];
  assert.equal(candidate.sources.length,2);
  assert.equal(candidate.sources[0],bucketUrl(config,candidate.id.split(':')[1]));
  assert.ok(candidate.sources[1].startsWith('http'),'the catalog link stays as the fallback');

  // Bucket miss falls through to the catalog link rather than skipping the shoe.
  const fetchImpl=mediaFetch({[candidate.sources[1]]:{buffer:pngBuffer(1080,1080)}});
  const chosen=await selectPost({state:{history:[]},config,now:NOW,fetchImpl});
  assert.equal(chosen.candidate.id,candidate.id);
  assert.equal(chosen.candidate.imageUrl,candidate.sources[1]);
  assert.equal(chosen.skipped[0].url,candidate.sources[0]);

  // Bucket hit wins outright.
  const both=mediaFetch({
    [candidate.sources[0]]:{buffer:pngBuffer(1080,1350)},
    [candidate.sources[1]]:{buffer:pngBuffer(1080,1080)}
  });
  const preferred=await selectPost({state:{history:[]},config,now:NOW,fetchImpl:both});
  assert.equal(preferred.candidate.imageUrl,candidate.sources[0]);
  assert.equal(preferred.skipped.length,0);
});

test('bucketUrl is empty until a bucket is configured',()=>{
  assert.equal(bucketUrl(defaultConfig,'samba-og-white-black-gum'),'');
  assert.equal(bucketUrl({mediaBaseUrl:'https://m.example.com/ig/',mediaExtension:'png'},'x'),'https://m.example.com/ig/x.png');
});

test('catalog rotation respects history and cooldown',()=>{
  const fresh=buildCandidates({state:{history:[]},now:NOW}).filter(c=>c.kind==='catalog');
  const first=fresh[0].id;
  const after=buildCandidates({state:{history:[{id:first,at:'2026-09-13T15:00:00Z'}]},now:NOW}).filter(c=>c.kind==='catalog');
  assert.ok(!after.some(c=>c.id===first),'a shoe posted yesterday is on cooldown');
  const wide={...defaultConfig,maxCandidates:99};
  const stale=buildCandidates({state:{history:[{id:first,at:'2026-01-01T15:00:00Z'}]},config:wide,now:NOW}).filter(c=>c.kind==='catalog');
  assert.ok(stale.some(c=>c.id===first),'cooldown expires');
  assert.notEqual(stale[0].id,first,'a previously posted shoe ranks behind ones never posted');
});

test('rotation keeps going once every shoe is inside its cooldown',()=>{
  const everything=buildCandidates({state:{history:[]},config:{...defaultConfig,maxCandidates:99},now:NOW})
    .filter(c=>c.kind==='catalog');
  const history=everything.map((c,i)=>({id:c.id,at:new Date(NOW.getTime()-(i+1)*3600000).toISOString()}));
  const next=buildCandidates({state:{history},config:{...defaultConfig,maxCandidates:99},now:NOW})
    .filter(c=>c.kind==='catalog');
  assert.ok(next.length>0,'the autopilot must not go silent after a full rotation');
  assert.equal(next[0].id,history.at(-1).id,'it resumes with the least recently posted shoe');
});

test('media resolution rejects unreachable, mistyped and badly cropped assets',async()=>{
  const good='https://cdn.example.com/good.png';
  const tall='https://cdn.example.com/tall.png';
  const missing='https://cdn.example.com/missing.png';
  const html='https://cdn.example.com/page.html';
  const fetchImpl=mediaFetch({
    [good]:{buffer:pngBuffer(1080,1350)},
    [tall]:{buffer:pngBuffer(1080,1920)},
    [html]:{contentType:'text/html'},
    [missing]:{status:404}
  });
  const ok=await resolveMedia(good,{fetchImpl});
  assert.equal(ok.ok,true);
  assert.equal(ok.width,1080);
  assert.equal((await resolveMedia(tall,{fetchImpl})).ok,false);
  assert.match((await resolveMedia(tall,{fetchImpl})).reason,/Aspect ratio/);
  assert.equal((await resolveMedia(html,{fetchImpl})).ok,false);
  assert.equal((await resolveMedia(missing,{fetchImpl})).ok,false);
  assert.equal((await resolveMedia('http://cdn.example.com/a.png',{fetchImpl})).ok,false);
  assert.equal((await resolveMedia('',{fetchImpl})).ok,false);
});

test('selection falls through broken media to the next candidate',async()=>{
  const queue={items:[
    {id:'broken',status:'ready',type:'image',image:'https://cdn.example.com/broken.png',product:'samba-og-white-black-gum'},
    {id:'works',status:'ready',type:'image',image:'https://cdn.example.com/works.png',product:'yeezy-zebra'}
  ]};
  const fetchImpl=mediaFetch({
    'https://cdn.example.com/broken.png':{status:403},
    'https://cdn.example.com/works.png':{buffer:pngBuffer(1080,1080)}
  });
  const skips=[];
  const chosen=await selectPost({queue,state:{history:[]},now:NOW,fetchImpl,onSkip:s=>skips.push(s.id)});
  assert.equal(chosen.candidate.id,'queue:works');
  assert.equal(chosen.media.width,1080);
  assert.ok(skips.includes('queue:broken'));
  assert.ok(chosen.copy.caption.includes('Yeezy'),'copy is built from the chosen product, not the skipped one');
  assert.equal(voiceCheck(chosen.copy.caption).ok,true);
});

test('selection returns nothing rather than posting when every asset fails',async()=>{
  const fetchImpl=mediaFetch({});
  const chosen=await selectPost({state:{history:[]},now:NOW,fetchImpl,config:{...defaultConfig,maxCandidates:3}});
  assert.equal(chosen.candidate,null);
  assert.equal(chosen.skipped.length,3);
});

test('a queue caption is used verbatim, never regenerated',()=>{
  const copy=captionFor({id:'queue:x',caption:'Exactly this.',intent:'feature'});
  assert.equal(copy.caption,'Exactly this.');
  assert.equal(copy.firstComment,'');
});

test('history records the post and stays bounded',()=>{
  const entry={id:'catalog:x',kind:'catalog',at:'2026-09-14T15:00:00Z',mediaId:'M1'};
  const state=recordPost({history:[]},entry);
  assert.equal(state.lastPostAt,entry.at);
  assert.deepEqual(state.history,[entry]);
  const big=recordPost({history:Array.from({length:250},(_,i)=>({id:`old${i}`,at:'2026-01-01T00:00:00Z'}))},entry);
  assert.equal(big.history.length,200);
  assert.equal(big.history.at(-1).mediaId,'M1');
});
