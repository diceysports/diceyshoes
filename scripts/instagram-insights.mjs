#!/usr/bin/env node
// Read Instagram performance and engagement for Dicey Shoes.
//
//   node scripts/instagram-insights.mjs                     # account + top posts + quota
//   node scripts/instagram-insights.mjs --what comments     # unanswered comments with reply drafts
//   node scripts/instagram-insights.mjs --days 28 --markdown # report for a GitHub step summary
//
// Read-only: this script never publishes, replies or hides anything.

import {
  createClient,account,accountInsights,recentMedia,mediaInsights,mediaComments,
  publishingLimit,InstagramError
} from '../lib/instagram.js';
import {draftReply} from '../lib/instagram-copy.js';

function parseArgs(argv){
  const args={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--'))continue;
    const [flag,inline]=argv[i].slice(2).split('=');
    const key=flag.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
    const next=inline!==undefined?inline:(argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true);
    args[key]=next;
  }
  return args;
}

const num=v=>Number(v||0).toLocaleString('en-US');
const pct=v=>`${(Number(v||0)*100).toFixed(1)}%`;
const firstLine=(text='')=>String(text).split('\n')[0].slice(0,60)||'(no caption)';

function table(rows,headers,markdown){
  if(!rows.length)return '  (none)';
  if(markdown){
    return[`| ${headers.join(' | ')} |`,`| ${headers.map(()=>'---').join(' | ')} |`,
      ...rows.map(r=>`| ${r.join(' | ')} |`)].join('\n');
  }
  const widths=headers.map((h,i)=>Math.max(h.length,...rows.map(r=>String(r[i]).length)));
  const line=cells=>'  '+cells.map((c,i)=>String(c).padEnd(widths[i])).join('  ');
  return[line(headers),line(widths.map(w=>'-'.repeat(w))),...rows.map(line)].join('\n');
}

async function accountSection(client,args,out){
  const profile=await account(client);
  out.account={username:profile.username,followers:profile.followers_count,media:profile.media_count};
  out.lines.push(`@${profile.username} · ${num(profile.followers_count)} followers · ${num(profile.media_count)} posts`);
  const days=Number(args.days||7);
  const since=new Date(Date.now()-days*86400000);
  try{
    const data=await accountInsights(client,{metrics:'reach,profile_views,accounts_engaged',period:'day',since,until:new Date()});
    const totals=Object.fromEntries(data.map(m=>[m.name,(m.values||[]).reduce((sum,v)=>sum+Number(v.value||0),0)]));
    out.account.window={days,...totals};
    out.lines.push(`Last ${days} days — reach ${num(totals.reach)} · profile views ${num(totals.profile_views)} · accounts engaged ${num(totals.accounts_engaged)}`);
  }catch(e){
    out.lines.push(`Account insights unavailable: ${e.message}`);
  }
}

async function mediaSection(client,args,out){
  const limit=Number(args.limit||8);
  const posts=await recentMedia(client,{limit});
  const rows=[];
  for(const post of posts){
    let stats={};
    try{stats=await mediaInsights(client,post.id)}catch{stats={}}
    const engagement=Number(post.like_count||0)+Number(post.comments_count||0)+Number(stats.saved||0)+Number(stats.shares||0);
    const rate=stats.reach?engagement/Number(stats.reach):0;
    rows.push({
      id:post.id,type:post.media_product_type||post.media_type,caption:firstLine(post.caption),
      date:(post.timestamp||'').slice(0,10),reach:Number(stats.reach||0),likes:Number(post.like_count||0),
      comments:Number(post.comments_count||0),saved:Number(stats.saved||0),engagement,rate,permalink:post.permalink
    });
  }
  rows.sort((a,b)=>b.rate-a.rate||b.engagement-a.engagement);
  out.media=rows;
  out.lines.push('');
  out.lines.push(`Last ${rows.length} posts, best engagement rate first:`);
  out.lines.push(table(
    rows.map(r=>[r.date,r.type,r.caption,num(r.reach),num(r.likes),num(r.comments),num(r.saved),r.reach?pct(r.rate):'—']),
    ['Date','Type','Caption','Reach','Likes','Comments','Saves','Rate'],
    args.markdown
  ));
  const best=rows[0];
  if(best&&best.reach)out.lines.push(`Top performer: ${best.caption} (${pct(best.rate)} on ${num(best.reach)} reach) — ${best.permalink||best.id}`);
}

async function commentsSection(client,args,out){
  const posts=await recentMedia(client,{limit:Number(args.limit||6),fields:'id,caption,permalink,timestamp,comments_count'});
  const me=(out.account?.username||'').toLowerCase();
  const pending=[];
  for(const post of posts){
    if(!Number(post.comments_count||0))continue;
    let comments=[];
    try{comments=await mediaComments(client,post.id)}catch{continue}
    for(const c of comments){
      if(String(c.username||'').toLowerCase()===me)continue;
      const answered=(c.replies?.data||[]).some(r=>String(r.username||'').toLowerCase()===me);
      if(answered)continue;
      const draft=draftReply(c.text,{username:c.username});
      pending.push({mediaId:post.id,permalink:post.permalink,commentId:c.id,username:c.username,text:c.text,timestamp:c.timestamp,...draft});
    }
  }
  out.comments=pending;
  out.lines.push('');
  out.lines.push(`${pending.length} comment${pending.length===1?'':'s'} awaiting a reply:`);
  for(const c of pending.slice(0,Number(args.limit||10))){
    out.lines.push(`  @${c.username} [${c.intent}] ${firstLine(c.text)}`);
    out.lines.push(`    draft: ${c.reply}`);
    out.lines.push(`    reply with: node scripts/instagram-reply.mjs --comment ${c.commentId} --message "..."`);
  }
}

async function quotaSection(client,out){
  const quota=await publishingLimit(client);
  out.quota=quota;
  out.lines.push('');
  out.lines.push(`Publishing quota: ${quota.used}/${quota.total} used in the last ${quota.windowHours}h · ${quota.remaining} remaining`);
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  const what=String(args.what||'all').toLowerCase();
  const client=createClient();
  const out={lines:[],generatedAt:new Date().toISOString()};

  if(what==='all'||what==='account'||what==='comments')await accountSection(client,args,out);
  if(what==='all'||what==='media')await mediaSection(client,args,out);
  if(what==='all'||what==='comments')await commentsSection(client,args,out);
  if(what==='all'||what==='quota')await quotaSection(client,out);

  if(args.json){console.log(JSON.stringify({...out,lines:undefined},null,2));return}
  console.log(out.lines.join('\n'));
}

main().catch(e=>{
  if(e instanceof InstagramError)console.error(`✗ ${e.message}${e.code?` (code ${e.code})`:''}`);
  else console.error(`✗ ${e.message}`);
  process.exitCode=1;
});
