import fs from 'node:fs/promises';

const required = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_TOKEN','D1_DATABASE_ID'];
for (const k of required) if (!process.env[k]) throw new Error(`Missing ${k}`);

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/$/,'');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DB = process.env.D1_DATABASE_ID;
const BATCH = Number(process.env.MIGRATION_BATCH || 500);

const TABLES = (process.env.MIGRATION_TABLES || [
  'shoe_products',
  'shoe_product_media',
  'shoe_enrichment_sources',
  'shoe_enrichment_queue',
  'shoe_product_external_records'
].join(',')).split(',').map(s=>s.trim()).filter(Boolean);

const cfHeaders = {Authorization:`Bearer ${TOKEN}`,'content-type':'application/json'};
const sbHeaders = {apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`};

async function d1(sql, params=[]) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB}/query`, {
    method:'POST', headers:cfHeaders, body:JSON.stringify({sql,params})
  });
  const body = await r.json().catch(()=>({}));
  if (!r.ok || body.success === false) throw new Error(`D1 ${r.status}: ${JSON.stringify(body).slice(0,1200)}`);
  return body;
}

async function applySchema(){
  const text = await fs.readFile(new URL('../cloudflare/d1/schema.sql', import.meta.url),'utf8');
  const statements = text.split(/;\s*(?:\n|$)/).map(s=>s.trim()).filter(Boolean);
  for (const sql of statements) await d1(sql);
}

async function getPage(table, offset){
  const u = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  u.searchParams.set('select','*');
  u.searchParams.set('limit',String(BATCH));
  u.searchParams.set('offset',String(offset));
  const r = await fetch(u,{headers:sbHeaders});
  if (!r.ok) throw new Error(`Supabase ${table} ${r.status}: ${await r.text()}`);
  return r.json();
}

const json = v => v == null ? null : JSON.stringify(v);
const bool = v => v == null ? null : (v ? 1 : 0);

function rawKey(table,row,i){
  const candidates = ['product_id','media_id','queue_id','source_id','external_record_id','id'];
  for (const k of candidates) if (row[k] != null) return String(row[k]);
  return `${table}:${i}:${Buffer.from(JSON.stringify(row)).toString('base64url').slice(0,32)}`;
}

async function upsertRaw(table,row,key){
  await d1(`INSERT INTO supabase_raw_rows(table_name,row_key,row_json,imported_at) VALUES(?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(table_name,row_key) DO UPDATE SET row_json=excluded.row_json, imported_at=CURRENT_TIMESTAMP`,
    [table,key,JSON.stringify(row)]);
}

async function upsertStructured(table,row){
  if (table === 'shoe_products') {
    const cols = ['product_id','brand_id','name','model','colorway','style_code','gender','category','description','retail_price','currency','available_sizes_json','product_url','image_url','image_source','image_usage','source_name','source_id','rank_score','rank_within_brand','popularity_tier','market_signals_json','source_data_json','status','created_at','updated_at','price_type','price_reference_at','verification_status','verification_notes_json','size_profile_key'];
    const vals = [row.product_id,row.brand_id,row.name,row.model,row.colorway,row.style_code,row.gender,row.category,row.description,row.retail_price,row.currency,json(row.available_sizes),row.product_url,row.image_url,row.image_source,row.image_usage,row.source_name,row.source_id,row.rank_score,row.rank_within_brand,row.popularity_tier,json(row.market_signals),json(row.source_data),row.status,row.created_at,row.updated_at,row.price_type,row.price_reference_at,row.verification_status,json(row.verification_notes),row.size_profile_key];
    const update = cols.slice(1).map(c=>`${c}=excluded.${c}`).join(',');
    await d1(`INSERT INTO shoe_products(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')}) ON CONFLICT(product_id) DO UPDATE SET ${update}`,vals);
  } else if (table === 'shoe_product_media') {
    const id = row.media_id ?? row.id;
    if (id == null || row.master_product_id == null || !row.media_url) return;
    await d1(`INSERT INTO shoe_product_media(media_id,master_product_id,source_id,media_url,media_type,verification_status,storefront_approved,content_verified,created_at,updated_at,raw_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(media_id) DO UPDATE SET master_product_id=excluded.master_product_id,source_id=excluded.source_id,media_url=excluded.media_url,media_type=excluded.media_type,verification_status=excluded.verification_status,storefront_approved=excluded.storefront_approved,content_verified=excluded.content_verified,created_at=excluded.created_at,updated_at=excluded.updated_at,raw_json=excluded.raw_json`,
      [id,row.master_product_id,row.source_id,row.media_url,row.media_type,row.verification_status,bool(row.storefront_approved),bool(row.content_verified),row.created_at,row.updated_at,JSON.stringify(row)]);
  } else if (table === 'shoe_enrichment_sources') {
    if (row.source_id == null) return;
    await d1(`INSERT INTO shoe_enrichment_sources(source_id,code,name,raw_json) VALUES(?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET code=excluded.code,name=excluded.name,raw_json=excluded.raw_json`,[row.source_id,row.code,row.name,JSON.stringify(row)]);
  } else if (table === 'shoe_enrichment_queue') {
    const id = row.queue_id ?? row.id;
    if (id == null) return;
    await d1(`INSERT INTO shoe_enrichment_queue(queue_id,product_id,status,locked_at,next_attempt_at,raw_json) VALUES(?,?,?,?,?,?) ON CONFLICT(queue_id) DO UPDATE SET product_id=excluded.product_id,status=excluded.status,locked_at=excluded.locked_at,next_attempt_at=excluded.next_attempt_at,raw_json=excluded.raw_json`,[id,row.product_id,row.status,row.locked_at,row.next_attempt_at,JSON.stringify(row)]);
  } else if (table === 'shoe_product_external_records') {
    if (row.external_record_id == null) return;
    await d1(`INSERT INTO shoe_product_external_records(external_record_id,colorway_id,source_id,external_product_id,external_sku,source_url,match_method,match_confidence,source_updated_at,last_seen_at,raw_data_json,created_at,updated_at,raw_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(external_record_id) DO UPDATE SET colorway_id=excluded.colorway_id,source_id=excluded.source_id,external_product_id=excluded.external_product_id,external_sku=excluded.external_sku,source_url=excluded.source_url,match_method=excluded.match_method,match_confidence=excluded.match_confidence,source_updated_at=excluded.source_updated_at,last_seen_at=excluded.last_seen_at,raw_data_json=excluded.raw_data_json,created_at=excluded.created_at,updated_at=excluded.updated_at,raw_json=excluded.raw_json`,
      [row.external_record_id,row.colorway_id,row.source_id,row.external_product_id,row.external_sku,row.source_url,row.match_method,row.match_confidence,row.source_updated_at,row.last_seen_at,json(row.raw_data),row.created_at,row.updated_at,JSON.stringify(row)]);
  }
}

async function migrateTable(table){
  let offset=0,total=0;
  while(true){
    const rows=await getPage(table,offset);
    for(let i=0;i<rows.length;i++){
      const row=rows[i];
      await upsertRaw(table,row,rawKey(table,row,offset+i));
      await upsertStructured(table,row);
    }
    total += rows.length;
    console.log(`${table}: ${total}`);
    if(rows.length < BATCH) break;
    offset += BATCH;
  }
  await d1(`INSERT INTO migration_meta(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`,[`count:${table}`,String(total)]);
  return total;
}

await applySchema();
const counts={};
for (const table of TABLES) counts[table]=await migrateTable(table);
await d1(`INSERT INTO migration_meta(key,value,updated_at) VALUES('last_completed_at',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`,[new Date().toISOString()]);
console.log(JSON.stringify({ok:true,counts},null,2));
