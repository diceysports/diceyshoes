// Instagram Graph API client for Dicey Shoes.
// Covers the two-phase publish flow (create container -> poll status -> publish),
// publishing limits, insights and comment management. No dependencies: global fetch only.

export const LIMITS={
  captionChars:2200,
  hashtags:30,
  mentions:20,
  carouselMin:2,
  carouselMax:10,
  imageBytes:8*1024*1024,
  reelBytes:1024*1024*1024,
  reelSeconds:Number(process.env.IG_REEL_MAX_SECONDS||90),
  reelMinSeconds:3,
  feedAspectMin:0.8,      // 4:5 portrait
  feedAspectMax:1.91,     // 1.91:1 landscape
  reelAspect:9/16,
  dailyPosts:50
};

export const IMAGE_FORMATS=['jpeg','jpg','heic','heif'];
export const VIDEO_FORMATS=['mp4','mov'];

export class InstagramError extends Error{
  constructor(message,details={}){
    super(message);
    this.name='InstagramError';
    Object.assign(this,details);
  }
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const RETRY_CODES=new Set([1,2,4,17,32,341,613]);

export function createClient(config={}){
  const token=config.token||process.env.IG_ACCESS_TOKEN||'';
  const userId=config.userId||process.env.IG_USER_ID||'';
  const client={
    token,
    userId,
    base:(config.base||process.env.IG_API_BASE||'https://graph.instagram.com').replace(/\/+$/,''),
    version:config.version||process.env.IG_GRAPH_VERSION||'v23.0',
    timeoutMs:Number(config.timeoutMs||process.env.IG_TIMEOUT_MS||20000),
    retries:Number(config.retries??2),
    fetch:config.fetch||globalThis.fetch
  };
  return client;
}

export function assertCredentials(client){
  const missing=[];
  if(!client.token)missing.push('IG_ACCESS_TOKEN');
  if(!client.userId)missing.push('IG_USER_ID');
  if(missing.length)throw new InstagramError(`Missing credentials: ${missing.join(', ')}`,{phase:'config',missing});
  if(/^(changeme|placeholder|your[-_])/i.test(client.token))throw new InstagramError('IG_ACCESS_TOKEN looks like a placeholder value.',{phase:'config'});
  return client;
}

function redact(text='',token=''){
  if(!token)return text;
  return String(text).split(token).join('***');
}

export async function request(client,path,{method='GET',params={},body=null,attempt=0}={}){
  assertCredentials(client);
  const url=new URL(`${client.base}/${client.version}/${String(path).replace(/^\/+/,'')}`);
  for(const[k,v]of Object.entries(params))if(v!==undefined&&v!==null&&v!=='')url.searchParams.set(k,String(v));
  const init={method,headers:{Accept:'application/json',Authorization:`Bearer ${client.token}`}};
  if(body){
    const form=new URLSearchParams();
    for(const[k,v]of Object.entries(body))if(v!==undefined&&v!==null&&v!=='')form.set(k,typeof v==='object'?JSON.stringify(v):String(v));
    init.body=form;
    init.headers['Content-Type']='application/x-www-form-urlencoded';
  }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),client.timeoutMs);
  let res,text;
  try{
    res=await client.fetch(url,{...init,signal:controller.signal});
    text=await res.text();
  }catch(e){
    clearTimeout(timer);
    if(attempt<client.retries){await sleep(1000*2**attempt);return request(client,path,{method,params,body,attempt:attempt+1})}
    throw new InstagramError(`Network failure calling ${path}: ${redact(e.message,client.token)}`,{phase:'network',path});
  }
  clearTimeout(timer);
  let json={};
  try{json=text?JSON.parse(text):{}}catch{json={raw:text}}
  if(!res.ok||json.error){
    const err=json.error||{};
    const retryable=res.status>=500||res.status===429||RETRY_CODES.has(Number(err.code));
    if(retryable&&attempt<client.retries){await sleep(1000*2**attempt);return request(client,path,{method,params,body,attempt:attempt+1})}
    throw new InstagramError(redact(err.message||`Instagram API ${res.status} on ${path}`,client.token),{
      phase:'api',path,status:res.status,code:err.code,subcode:err.error_subcode,type:err.type,
      fbtrace:err.fbtrace_id,userMessage:err.error_user_msg,body:redact(text,client.token).slice(0,600)
    });
  }
  return json;
}

// ---------- validation ----------

export function parseCaption(caption=''){
  const text=String(caption);
  const hashtags=text.match(/#[\p{L}\p{N}_]+/gu)||[];
  const mentions=text.match(/@[A-Za-z0-9._]+/g)||[];
  return{text,length:[...text].length,hashtags,mentions};
}

export function validateCaption(caption=''){
  const parsed=parseCaption(caption);
  const errors=[],warnings=[];
  if(parsed.length>LIMITS.captionChars)errors.push(`Caption is ${parsed.length} characters, limit is ${LIMITS.captionChars}.`);
  if(parsed.hashtags.length>LIMITS.hashtags)errors.push(`Caption has ${parsed.hashtags.length} hashtags, limit is ${LIMITS.hashtags}.`);
  if(parsed.mentions.length>LIMITS.mentions)errors.push(`Caption has ${parsed.mentions.length} @mentions, limit is ${LIMITS.mentions}.`);
  if(parsed.hashtags.length>12)warnings.push('More than 12 hashtags in the caption — move the tail into the first comment.');
  if(!parsed.length)warnings.push('Empty caption.');
  return{ok:!errors.length,errors,warnings,...parsed};
}

export function assertPublicUrl(url,label='media'){
  let parsed;
  try{parsed=new URL(String(url))}catch{throw new InstagramError(`${label} URL is not a valid URL: ${url}`,{phase:'validation'})}
  if(parsed.protocol!=='https:')throw new InstagramError(`${label} URL must be https so Instagram can fetch it: ${url}`,{phase:'validation'});
  if(/^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(parsed.hostname))throw new InstagramError(`${label} URL must be publicly reachable, got ${parsed.hostname}.`,{phase:'validation'});
  return parsed.toString();
}

export function validateImage({width,height,bytes,format}={}){
  const errors=[],warnings=[];
  if(format&&!IMAGE_FORMATS.includes(String(format).toLowerCase().replace(/^image\//,'')))errors.push(`Unsupported image format "${format}". Instagram accepts ${IMAGE_FORMATS.join(', ')}.`);
  if(bytes&&bytes>LIMITS.imageBytes)errors.push(`Image is ${(bytes/1048576).toFixed(1)}MB, limit is 8MB.`);
  if(width&&height){
    const ratio=width/height;
    if(ratio<LIMITS.feedAspectMin||ratio>LIMITS.feedAspectMax)errors.push(`Aspect ratio ${ratio.toFixed(2)}:1 is outside the 4:5 to 1.91:1 feed range — Instagram will reject or crop it.`);
    if(width<640)warnings.push(`Width ${width}px is below the 640px recommended minimum.`);
  }
  return{ok:!errors.length,errors,warnings};
}

export function validateReel({seconds,width,height,bytes}={}){
  const errors=[],warnings=[];
  if(seconds&&seconds>LIMITS.reelSeconds)errors.push(`Reel is ${seconds}s, the publishing cap is ${LIMITS.reelSeconds}s.`);
  if(seconds&&seconds<LIMITS.reelMinSeconds)errors.push(`Reel is ${seconds}s, the minimum is ${LIMITS.reelMinSeconds}s.`);
  if(bytes&&bytes>LIMITS.reelBytes)errors.push(`Video is ${(bytes/1073741824).toFixed(2)}GB, limit is 1GB.`);
  if(width&&height){
    const ratio=width/height;
    if(Math.abs(ratio-LIMITS.reelAspect)>0.02)warnings.push(`Aspect ratio ${ratio.toFixed(2)}:1 is not 9:16 — Instagram will letterbox or crop the Reel.`);
    if(width<540)warnings.push(`Width ${width}px is below the 540px recommended minimum.`);
  }
  return{ok:!errors.length,errors,warnings};
}

export function validateCarousel(items=[]){
  const errors=[];
  if(items.length<LIMITS.carouselMin)errors.push(`A carousel needs at least ${LIMITS.carouselMin} slides, got ${items.length}.`);
  if(items.length>LIMITS.carouselMax)errors.push(`A carousel holds at most ${LIMITS.carouselMax} slides, got ${items.length}.`);
  items.forEach((item,i)=>{if(!item?.imageUrl&&!item?.videoUrl)errors.push(`Slide ${i+1} has neither imageUrl nor videoUrl.`)});
  return{ok:!errors.length,errors,warnings:[]};
}

export async function probeMedia(url,{fetchImpl=globalThis.fetch,timeoutMs=10000}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetchImpl(url,{method:'HEAD',redirect:'follow',signal:controller.signal});
    clearTimeout(timer);
    return{
      ok:res.ok,
      status:res.status,
      contentType:res.headers.get('content-type')||'',
      bytes:Number(res.headers.get('content-length')||0)
    };
  }catch(e){
    clearTimeout(timer);
    return{ok:false,status:0,error:e.message,contentType:'',bytes:0};
  }
}

// ---------- publishing ----------

export async function createContainer(client,fields){
  const json=await request(client,`${client.userId}/media`,{method:'POST',body:fields});
  if(!json.id)throw new InstagramError('Instagram did not return a container id.',{phase:'container',body:JSON.stringify(json).slice(0,300)});
  return json.id;
}

export async function containerStatus(client,containerId){
  return request(client,containerId,{params:{fields:'status_code,status,id'}});
}

export async function waitForContainer(client,containerId,{timeoutMs=300000,intervalMs=5000,onTick=null}={}){
  const started=Date.now();
  let ticks=0;
  for(;;){
    const status=await containerStatus(client,containerId);
    const code=String(status.status_code||'').toUpperCase();
    if(onTick)onTick({containerId,code,status:status.status,elapsedMs:Date.now()-started,tick:++ticks});
    if(code==='FINISHED'||code==='PUBLISHED')return status;
    if(code==='ERROR')throw new InstagramError(`Container ${containerId} failed to process: ${status.status||'no detail'}`,{phase:'container',containerId,status:status.status});
    if(code==='EXPIRED')throw new InstagramError(`Container ${containerId} expired before publishing (containers live 24h).`,{phase:'container',containerId});
    if(Date.now()-started>timeoutMs)throw new InstagramError(`Container ${containerId} still ${code||'IN_PROGRESS'} after ${Math.round(timeoutMs/1000)}s.`,{phase:'container',containerId,code});
    await sleep(intervalMs);
  }
}

export async function publishContainer(client,creationId){
  const json=await request(client,`${client.userId}/media_publish`,{method:'POST',body:{creation_id:creationId}});
  if(!json.id)throw new InstagramError('Publish call returned no media id.',{phase:'publish',creationId});
  return json.id;
}

function commonFields({caption,locationId,userTags,collaborators,altText}={}){
  return{
    caption,
    location_id:locationId,
    user_tags:userTags?.length?userTags:undefined,
    collaborators:collaborators?.length?collaborators:undefined,
    alt_text:altText
  };
}

export async function publishImage(client,{imageUrl,caption='',...rest}={}){
  assertPublicUrl(imageUrl,'image');
  const check=validateCaption(caption);
  if(!check.ok)throw new InstagramError(check.errors.join(' '),{phase:'validation',errors:check.errors});
  const containerId=await createContainer(client,{image_url:imageUrl,...commonFields({caption,...rest})});
  await waitForContainer(client,containerId,rest.poll||{});
  const mediaId=await publishContainer(client,containerId);
  return{mediaId,containerId,type:'IMAGE'};
}

export async function publishCarousel(client,{items=[],caption='',...rest}={}){
  const shape=validateCarousel(items);
  if(!shape.ok)throw new InstagramError(shape.errors.join(' '),{phase:'validation',errors:shape.errors});
  const check=validateCaption(caption);
  if(!check.ok)throw new InstagramError(check.errors.join(' '),{phase:'validation',errors:check.errors});
  const children=[];
  for(const item of items){
    const url=item.imageUrl||item.videoUrl;
    assertPublicUrl(url,'carousel slide');
    const fields=item.videoUrl
      ?{video_url:item.videoUrl,media_type:'VIDEO',is_carousel_item:true}
      :{image_url:item.imageUrl,is_carousel_item:true};
    if(item.altText)fields.alt_text=item.altText;
    if(item.userTags?.length)fields.user_tags=item.userTags;
    const childId=await createContainer(client,fields);
    if(item.videoUrl)await waitForContainer(client,childId,rest.poll||{});
    children.push(childId);
  }
  const containerId=await createContainer(client,{media_type:'CAROUSEL',children:children.join(','),...commonFields({caption,...rest})});
  await waitForContainer(client,containerId,rest.poll||{});
  const mediaId=await publishContainer(client,containerId);
  return{mediaId,containerId,children,type:'CAROUSEL'};
}

export async function publishReel(client,{videoUrl,coverUrl='',caption='',shareToFeed=true,audioName='',thumbOffset=null,...rest}={}){
  assertPublicUrl(videoUrl,'video');
  if(coverUrl)assertPublicUrl(coverUrl,'cover image');
  const check=validateCaption(caption);
  if(!check.ok)throw new InstagramError(check.errors.join(' '),{phase:'validation',errors:check.errors});
  const containerId=await createContainer(client,{
    media_type:'REELS',
    video_url:videoUrl,
    cover_url:coverUrl||undefined,
    thumb_offset:thumbOffset??undefined,
    share_to_feed:shareToFeed?'true':'false',
    audio_name:audioName||undefined,
    ...commonFields({caption,...rest})
  });
  await waitForContainer(client,containerId,{intervalMs:8000,timeoutMs:600000,...(rest.poll||{})});
  const mediaId=await publishContainer(client,containerId);
  return{mediaId,containerId,type:'REELS'};
}

export async function comment(client,mediaId,message){
  const json=await request(client,`${mediaId}/comments`,{method:'POST',body:{message}});
  return json.id;
}

// ---------- analytics & engagement ----------

export async function publishingLimit(client){
  const json=await request(client,`${client.userId}/content_publishing_limit`,{params:{fields:'config,quota_usage'}});
  const row=json.data?.[0]||{};
  const total=Number(row.config?.quota_total||LIMITS.dailyPosts);
  const used=Number(row.quota_usage||0);
  return{used,total,remaining:Math.max(0,total-used),windowHours:Number(row.config?.quota_duration||86400)/3600};
}

export async function account(client,fields='id,username,name,followers_count,follows_count,media_count,profile_picture_url'){
  return request(client,client.userId,{params:{fields}});
}

export async function recentMedia(client,{limit=12,fields='id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count'}={}){
  const json=await request(client,`${client.userId}/media`,{params:{fields,limit}});
  return json.data||[];
}

export async function mediaInsights(client,mediaId,metrics='reach,likes,comments,saved,shares,total_interactions'){
  const json=await request(client,`${mediaId}/insights`,{params:{metric:metrics}});
  return Object.fromEntries((json.data||[]).map(m=>[m.name,m.values?.[0]?.value??m.total_value?.value??0]));
}

export async function accountInsights(client,{metrics='reach,follower_count,profile_views,accounts_engaged',period='day',since=null,until=null,timeframe=null,breakdown=null}={}){
  const json=await request(client,`${client.userId}/insights`,{params:{
    metric:metrics,period,metric_type:breakdown?'total_value':undefined,timeframe,breakdown,
    since:since?Math.floor(new Date(since).getTime()/1000):undefined,
    until:until?Math.floor(new Date(until).getTime()/1000):undefined
  }});
  return json.data||[];
}

export async function mediaComments(client,mediaId,{limit=25,fields='id,text,username,timestamp,like_count,hidden,replies{id,text,username,timestamp}'}={}){
  const json=await request(client,`${mediaId}/comments`,{params:{fields,limit}});
  return json.data||[];
}

export async function replyToComment(client,commentId,message){
  const json=await request(client,`${commentId}/replies`,{method:'POST',body:{message}});
  return json.id;
}

export async function hideComment(client,commentId,hide=true){
  await request(client,commentId,{method:'POST',body:{hide:hide?'true':'false'}});
  return true;
}

export async function conversations(client,{limit=20}={}){
  const json=await request(client,`${client.userId}/conversations`,{params:{fields:'id,updated_time,participants',limit,platform:'instagram'}});
  return json.data||[];
}
