const GOAT_APP='2FWOTDVM2O';
// Public search-only credential shipped by GOAT's web search client; not a private account secret.
const GOAT_SEARCH_KEY='ac96de6fef0e02bb95d433d8d5c7038a';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const imageUrl=s=>/^https:\/\/image\.goat\.com\//i.test(String(s||''));

function collect(value,out,{strictId=''}={}){
  if(!value)return;
  if(typeof value==='string'){
    const v=value.replace(/\\u0026/gi,'&').replace(/\\\//g,'/');
    if(!imageUrl(v))return;
    if(strictId&&/product_template_(?:pictures|additional_pictures)/i.test(v)&&!v.includes(`${strictId}_`))return;
    if(!out.includes(v))out.push(v);
    return;
  }
  if(Array.isArray(value)){value.forEach(x=>collect(x,out,{strictId}));return}
  if(typeof value==='object')Object.values(value).forEach(x=>collect(x,out,{strictId}));
}

function angleKey(url){
  const s=String(url);
  const numbered=s.match(/\/([^/?]+?)_(\d{2})\.(?:png|jpe?g|webp)/i);
  if(numbered)return `${numbered[1]}_${numbered[2]}`;
  const path=s.split('?')[0].replace(/\/(?:glow-[^/]+\/)?(?:375|750|1000|medium|grid)\//i,'/SIZE/');
  return path;
}
function quality(url){
  const s=String(url);if(/\/original\//i.test(s)&&!/\/glow-/i.test(s))return 7;if(/\/1000\//i.test(s))return 6;if(/\/750\//i.test(s)&&!/\/glow-/i.test(s))return 5;if(/\/medium\//i.test(s))return 4;if(/\/375\//i.test(s)&&!/\/glow-/i.test(s))return 3;if(/\/grid\//i.test(s))return 2;return 1;
}
function bestPerAngle(urls){
  const map=new Map();for(const url of urls){const key=angleKey(url),old=map.get(key);if(!old||quality(url)>quality(old))map.set(key,url)}return [...map.values()].sort((a,b)=>{const am=String(a).match(/_(\d{2})\.(?:png|jpe?g|webp)/i),bm=String(b).match(/_(\d{2})\.(?:png|jpe?g|webp)/i);return Number(am?.[1]||99)-Number(bm?.[1]||99)});
}

async function valid(url){
  try{
    const r=await fetch(url,{headers:{accept:'image/avif,image/webp,image/*,*/*;q=.8','user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)','range':'bytes=0-1024'},redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(4500)});
    return (r.ok||r.status===206)&&String(r.headers.get('content-type')||'').toLowerCase().startsWith('image/');
  }catch{return false}
}

async function getJson(url){
  try{
    const r=await fetch(url,{headers:{accept:'application/json,text/plain,*/*','user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36','accept-language':'en-US,en;q=.9','referer':'https://www.goat.com/'},cache:'no-store',redirect:'follow',signal:AbortSignal.timeout(7000)});
    if(!r.ok)return null;const type=String(r.headers.get('content-type')||'').toLowerCase();if(!type.includes('json'))return null;return await r.json();
  }catch{return null}
}

async function templateData(slug,id){
  const attempts=[];
  if(slug)attempts.push(['web',`https://www.goat.com/web-api/v1/product_templates/${encodeURIComponent(slug)}`]);
  if(id)attempts.push(['web-id',`https://www.goat.com/web-api/v1/product_templates/${encodeURIComponent(id)}`]);
  if(slug)attempts.push(['api',`https://www.goat.com/api/v1/product_templates/${encodeURIComponent(slug)}`]);
  if(id)attempts.push(['api-id',`https://www.goat.com/api/v1/product_templates/${encodeURIComponent(id)}`]);
  for(const [source,url] of attempts){const data=await getJson(url);if(data)return {data,source}}
  return {data:null,source:null};
}

export async function GET(request){
  const q=new URL(request.url).searchParams,sku=String(q.get('sku')||'').trim();
  if(!sku)return Response.json({error:'sku required'},{status:400});
  try{
    const params=new URLSearchParams({query:sku,hitsPerPage:'12',distinct:'true'}).toString();
    const search=await fetch(`https://${GOAT_APP.toLowerCase()}-dsn.algolia.net/1/indexes/product_variants_v2/query`,{
      method:'POST',headers:{'content-type':'application/json','x-algolia-application-id':GOAT_APP,'x-algolia-api-key':GOAT_SEARCH_KEY,'x-algolia-agent':'Algolia for JavaScript'},body:JSON.stringify({params}),cache:'no-store',signal:AbortSignal.timeout(5000)
    });
    if(!search.ok)return Response.json({sku,found:false,searchStatus:search.status,images:[]},{headers:{'Cache-Control':'public, s-maxage=1800'}});
    const data=await search.json(),hits=Array.isArray(data.hits)?data.hits:[],needle=norm(sku);
    const hit=hits.find(x=>norm(x.sku)===needle);
    if(!hit)return Response.json({sku,found:false,images:[],searchHitCount:hits.length},{headers:{'Cache-Control':'public, s-maxage=1800'}});
    const id=String(hit.product_template_id||hit.productTemplateId||hit.id||''),slug=hit.slug||'';
    const images=[];
    // The Algolia hit is exact-SKU matched, so its own GOAT images are safe to collect without filename assumptions.
    collect(hit,images);
    const {data:detail,source:detailSource}=await templateData(slug,id);
    // The detail endpoint is already scoped to the exact matched template; collect all GOAT product pictures from it.
    if(detail)collect(detail,images);
    const unique=bestPerAngle(images).slice(0,24),checks=await Promise.all(unique.map(async url=>({url,ok:await valid(url)}))),good=checks.filter(x=>x.ok).map(x=>x.url).slice(0,12);
    return Response.json({sku,found:true,slug,productTemplateId:id,images:good,angles:good.length,searchHitCount:hits.length,detailLoaded:!!detail,detailSource},{headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}});
  }catch(e){return Response.json({sku,found:false,images:[],error:'GOAT gallery lookup failed'},{status:502})}
}
