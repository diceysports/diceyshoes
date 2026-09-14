#!/usr/bin/env node
// Reply to Instagram comments in the Dicey Shoes voice.
//
//   node scripts/instagram-reply.mjs --comment 17912345 --message "Sizes are live on site."
//   node scripts/instagram-reply.mjs --comment 17912345 --draft "how much?" --username kicksfan
//   node scripts/instagram-reply.mjs --media 17987654 --message "Restock lands Friday."
//   node scripts/instagram-reply.mjs --comment 17912345 --hide
//
// Add --dry-run to see the exact text without sending it.

import {createClient,replyToComment,comment as postComment,hideComment,InstagramError} from '../lib/instagram.js';
import {draftReply,voiceCheck} from '../lib/instagram-copy.js';

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

async function main(){
  const args=parseArgs(process.argv.slice(2));
  if(!args.comment&&!args.media){
    console.error('✗ Pass --comment <comment-id> or --media <media-id>.');
    process.exitCode=1;return;
  }

  if(args.hide!==undefined&&args.comment){
    const hide=args.hide!==false&&args.hide!=='false';
    if(args.dryRun){console.log(`Dry run — would ${hide?'hide':'unhide'} comment ${args.comment}.`);return}
    await hideComment(createClient(),args.comment,hide);
    console.log(`✓ Comment ${args.comment} ${hide?'hidden':'unhidden'}.`);
    return;
  }

  let message=args.message;
  let intent='manual';
  if(!message&&args.draft){
    const drafted=draftReply(args.draft,{username:args.username||''});
    message=drafted.reply;
    intent=drafted.intent;
  }
  if(!message){
    console.error('✗ Pass --message "..." or --draft "<the comment text>" to generate one.');
    process.exitCode=1;return;
  }
  if(message.length>2200){
    console.error(`✗ Reply is ${message.length} characters, limit is 2200.`);
    process.exitCode=1;return;
  }

  const voice=voiceCheck(message);
  console.log(`— reply (${intent}) to ${args.comment?`comment ${args.comment}`:`media ${args.media}`}`);
  console.log(`  │ ${message}`);
  for(const issue of voice.issues)console.log(`  ! ${issue.level}: ${issue.message}`);
  if(!voice.ok&&!args.force){
    console.error('✗ Reply fails the voice check. Edit it or rerun with --force.');
    process.exitCode=1;return;
  }
  if(args.dryRun){console.log('Dry run — nothing was sent.');return}

  const client=createClient();
  const id=args.comment?await replyToComment(client,args.comment,message):await postComment(client,args.media,message);
  console.log(`✓ Sent — id ${id}`);
}

main().catch(e=>{
  if(e instanceof InstagramError)console.error(`✗ ${e.message}${e.code?` (code ${e.code})`:''}`);
  else console.error(`✗ ${e.message}`);
  process.exitCode=1;
});
