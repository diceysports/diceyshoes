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
