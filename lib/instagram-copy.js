// Dicey Shoes Instagram copy: voice-matched captions, hooks, hashtag tiers and reply drafts.
// Deterministic — the same input always produces the same copy, so dry runs match live runs.

import {products,money} from './products.js';
import {dailyReleaseUpdates} from './releases-daily.js';
import {LIMITS,parseCaption} from './instagram.js';

export const brandVoice={
  name:'Dicey Shoes',
  handle:process.env.IG_HANDLE||'@diceyshoes',
  support:process.env.IG_SUPPORT_WHATSAPP||'+1 548 538 2258',
  tone:['confident','plain-spoken','sneaker-literate','short lines','no hard sell'],
  rules:[
    'Lead with the shoe, not the brand of the store.',
    'One idea per line, max three lines before the CTA.',
    'Name the colorway and the price — specifics beat adjectives.',
    'Two emoji maximum, and never in place of a word.',
    'Hashtags live in the first comment, not the caption.'
  ],
  ctas:{
    shop:'Pairs are live on site — link in bio.',
    dm:`DM us or WhatsApp ${process.env.IG_SUPPORT_WHATSAPP||'+1 548 538 2258'} to lock a size.`,
    news:'Full story and release calendar on the site — link in bio.',
    save:'Save this one for release day.'
  }
};

// Phrases that read as generic marketing filler and break the voice.
export const bannedPhrases=[
  'game-changer','game changer','must-have','must have','unleash','level up','elevate your',
  'look no further','dive in','in today\'s world','revolutionary','the ultimate','crazy deal',
  'don\'t miss out','act now','limited time only','buy now','click the link'
];

const hashtagTiers={
  branded:['#diceyshoes','#diceyshoescollection'],
  broad:['#sneakers','#sneakerhead','#kicks','#sneakercommunity','#footwear'],
  brands:{
    nike:['#nike','#nikesportswear','#swoosh'],
    jordan:['#jordanbrand','#airjordan','#jumpman'],
    adidas:['#adidas','#threestripes'],
    yeezy:['#yeezy','#yeezyboost'],
    'new balance':['#newbalance','#nbgrey'],
    gucci:['#gucci','#luxurysneakers'],
    'louis vuitton':['#louisvuitton','#luxurysneakers'],
    reebok:['#reebok'],
    puma:['#puma'],
    asics:['#asics'],
    crocs:['#crocs']
  },
  models:[
    [/air force 1|af1/i,['#airforce1','#af1']],
    [/dunk/i,['#nikedunk','#dunklow']],
    [/jordan 1|aj1/i,['#airjordan1','#aj1']],
    [/jordan 4|aj4/i,['#airjordan4','#aj4']],
    [/jordan 11/i,['#airjordan11']],
    [/samba/i,['#samba','#sambaog']],
    [/air max/i,['#airmax','#airmaxday']],
    [/kobe/i,['#kobe','#mambamentality']],
    [/slide/i,['#slides']],
    [/travis scott|cactus jack/i,['#travisscott','#cactusjack']]
  ],
  intent:{
    drop:['#sneakerrelease','#releasedate','#newkicks'],
    restock:['#restock','#backinstock'],
    news:['#sneakernews','#kicksoftheday'],
    styling:['#outfitinspo','#fitcheck','#onfeet'],
    deal:['#sneakerdeals','#steal']
  }
};

const hooks={
  drop:[
    '{name} lands {date}.',
    'Mark it: {name}, {date}.',
    '{date}. {name}. That is the whole post.'
  ],
  feature:[
    '{name} is in stock right now.',
    'Still one of the cleanest pairs we carry: {name}.',
    '{name}. {price}. Sizes {sizes}.'
  ],
  restock:[
    '{name} is back on the shelf.',
    'Restocked: {name}, and it will not sit long.'
  ],
  news:[
    '{headline}',
    'Worth knowing: {headline}'
  ],
  styling:[
    'Three ways to wear {name}.',
    '{name} does the work — keep the rest quiet.'
  ],
  deal:[
    '{name} is sitting at {price}.',
    'Price drop: {name}, now {price}.'
  ]
};

const slugHash=value=>{let h=0;for(const ch of String(value))h=(h*31+ch.codePointAt(0))>>>0;return h};
const pick=(list,seed)=>list[slugHash(seed)%list.length];
const titleCase=s=>String(s||'').replace(/\b[a-z]/g,c=>c.toUpperCase());

export function buildHashtags({brand='',name='',intent='drop',count=12}={}){
  const out=[];
  const push=tags=>{for(const tag of tags||[])if(tag&&!out.includes(tag))out.push(tag)};
  push(hashtagTiers.branded);
  push(hashtagTiers.brands[String(brand).toLowerCase()]);
  for(const[pattern,tags]of hashtagTiers.models)if(pattern.test(name))push(tags);
  push(hashtagTiers.intent[intent]);
  push(hashtagTiers.broad);
  return out.slice(0,Math.min(count,LIMITS.hashtags));
}

export function findProduct(slugOrName=''){
  const needle=String(slugOrName).toLowerCase().trim();
  if(!needle)return null;
  return products.find(p=>p.slug===needle)
    ||products.find(p=>p.slug.includes(needle))
    ||products.find(p=>p.name.toLowerCase().includes(needle))
    ||null;
}

export function findRelease(nameOrDate=''){
  const needle=String(nameOrDate).toLowerCase().trim();
  if(!needle)return null;
  return dailyReleaseUpdates.find(r=>r.name.toLowerCase().includes(needle))
    ||dailyReleaseUpdates.find(r=>r.date.toLowerCase()===needle)
    ||null;
}

function detailLines({product,release,intent}){
  const lines=[];
  if(product){
    const sizes=product.sizes?.length?`US ${product.sizes[0]}–${product.sizes[product.sizes.length-1]}`:'';
    lines.push([money?money(product.price):`$${product.price}`,sizes,product.status].filter(Boolean).join(' · '));
    if(product.category&&product.category!=='Sneakers')lines.push(`${product.category} · ${product.brand}`);
  }
  if(release){
    const price=release.price?`$${release.price}`:'';
    lines.push([release.brand,price,`Releases ${release.date}`].filter(Boolean).join(' · '));
    if(release.source)lines.push(`Confirmed via ${release.source}.`);
  }
  if(intent==='drop'&&!release&&product)lines.push('Sizes move fast on release week.');
  return lines.filter(Boolean);
}

export function buildCaption({
  intent='feature',
  product=null,
  release=null,
  headline='',
  angle='',
  cta='',
  hashtags=null,
  hashtagsInCaption=false,
  seed=''
}={}){
  const name=product?.name||release?.name||headline||'';
  const brand=product?.brand||release?.brand||'';
  const key=seed||product?.slug||release?.name||headline||intent;
  const template=pick(hooks[intent]||hooks.feature,`${intent}:${key}`);
  const hook=template
    .replace('{name}',name)
    .replace('{headline}',headline||name)
    .replace('{date}',release?.date||product?.status||'soon')
    .replace('{price}',product?money(product.price):release?.price?`$${release.price}`:'')
    .replace('{sizes}',product?.sizes?.length?`${product.sizes[0]}–${product.sizes[product.sizes.length-1]}`:'');
  const body=[hook,angle,...detailLines({product,release,intent})].filter(Boolean);
  const callToAction=cta||(intent==='drop'?brandVoice.ctas.save:intent==='news'?brandVoice.ctas.news:brandVoice.ctas.shop);
  const tags=hashtags||buildHashtags({brand,name,intent});
  const caption=[...body,'',callToAction,...(hashtagsInCaption?['',tags.join(' ')]:[])].join('\n').trim();
  const firstComment=hashtagsInCaption?'':tags.join(' ');
  return{
    caption,
    firstComment,
    hook,
    hashtags:tags,
    altText:name?`${titleCase(brand)} ${name} product photo on a plain background.`:'',
    meta:{intent,brand,name,length:parseCaption(caption).length}
  };
}

export function captionForProduct(slugOrName,options={}){
  const product=findProduct(slugOrName);
  if(!product)throw new Error(`No catalog product matches "${slugOrName}".`);
  return{product,...buildCaption({intent:options.intent||'feature',product,...options})};
}

export function captionForRelease(nameOrDate,options={}){
  const release=findRelease(nameOrDate);
  if(!release)throw new Error(`No upcoming release matches "${nameOrDate}".`);
  return{release,...buildCaption({intent:options.intent||'drop',release,...options})};
}

export function voiceCheck(text=''){
  const parsed=parseCaption(text);
  const issues=[];
  const lower=parsed.text.toLowerCase();
  for(const phrase of bannedPhrases)if(lower.includes(phrase))issues.push({level:'error',message:`Marketing filler: "${phrase}".`});
  const emoji=parsed.text.match(/\p{Extended_Pictographic}/gu)||[];
  if(emoji.length>2)issues.push({level:'warn',message:`${emoji.length} emoji — the voice caps at two.`});
  const shouty=parsed.text.match(/\b[A-Z]{4,}\b/g)||[];
  if(shouty.length)issues.push({level:'warn',message:`All-caps shouting: ${[...new Set(shouty)].join(', ')}.`});
  if(parsed.length>LIMITS.captionChars)issues.push({level:'error',message:`Caption is ${parsed.length} characters, limit is ${LIMITS.captionChars}.`});
  if(parsed.hashtags.length>LIMITS.hashtags)issues.push({level:'error',message:`${parsed.hashtags.length} hashtags, limit is ${LIMITS.hashtags}.`});
  if(parsed.text.split('\n').filter(Boolean).length>6)issues.push({level:'warn',message:'More than six lines — tighten it.'});
  if(/!{2,}/.test(parsed.text))issues.push({level:'warn',message:'Stacked exclamation marks.'});
  return{ok:!issues.some(i=>i.level==='error'),issues,length:parsed.length,hashtags:parsed.hashtags.length};
}

const replyIntents=[
  {intent:'price',test:/\bprice|how much|cost|\$\d|magkano\b/i,reply:({name})=>`${name?`${name} is`:'It is'} listed on site with live pricing — link in bio. DM us if you want a size held.`},
  {intent:'sizing',test:/\bsize|us \d|uk \d|eu \d|fit\b/i,reply:()=>`Tell us your size and we will check stock — DM or WhatsApp ${brandVoice.support}.`},
  {intent:'availability',test:/\bavailable|in stock|sold out|restock|left\b/i,reply:({name})=>`Stock moves daily${name?` on the ${name}`:''} — current sizes are on the product page, link in bio.`},
  {intent:'shipping',test:/\bship|shipping|deliver|delivery|canada|worldwide\b/i,reply:()=>'Shipping details and timelines are on the shipping page, link in bio. DM us your city for an estimate.'},
  {intent:'authenticity',test:/\blegit|authentic|real|fake|rep\b/i,reply:()=>'Every pair is verified before it ships. Happy to walk you through the checks — DM us.'},
  {intent:'negative',test:/\bscam|trash|overpriced|L\b|waste\b/i,reply:()=>'Fair enough. If something went wrong with an order, DM us the order number and we will sort it.'},
  {intent:'hype',test:/🔥|\bfire|clean|need|grail|insane\b/i,reply:({username})=>`Appreciate you${username?`, ${username}`:''}. Sizes are live on site — link in bio.`}
];

export function draftReply(text='',{username='',name=''}={}){
  const match=replyIntents.find(r=>r.test.test(String(text)));
  const handle=username?`@${String(username).replace(/^@/,'')}`:'';
  if(!match)return{intent:'general',reply:`Thanks for the comment${handle?`, ${handle}`:''}. DM us if you want help with a size or a release.`};
  return{intent:match.intent,reply:match.reply({username:handle,name})};
}
