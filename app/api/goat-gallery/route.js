const GOAT_APP='2FWOTDVM2O';
// Public search-only credential shipped by GOAT's web search client; not a private account secret.
const GOAT_SEARCH_KEY='ac96de6fef0e02bb95d433d8d5c7038a';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const norm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const imageUrl=s=>/^https:\/\/image\.goat\.com\//i.test(String(s||''));

function collect(value,out,id=''){
  if(!value)return;
  if(typeof value==='string'){
    const v=value.replace(/\\u0026/gi,'&').replace(/\\\//g,'/');
    if(imageUrl(v)&&(!id||v.includes(`${id}_`)||!/product_template_(?:pictures|additional_pictures)/i.test(v))&&!out.includes(v))out.push(v);
    return;
  }
  if(Array.isArray(value)){value.forEach(x=>collect(x,out,id));return}
  if(typeof value==='object')Object.values(value).forEach(x=>collect(x,out,id));
}

async function valid(url){
  try{
    const r=await fetch(url,{headers:{accept:'image/avif,image/webp,image/*,*/*;q=.8','user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)','range':'bytes=0-1024'},redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(4000)});
    return (r.ok||r.status===206)&&String(r.headers.get('content-type')||'').toLowerCase().startsWith('image/');
  }catch{return false}
}

async function templateJson(slug,id){
  const paths=[slug,id].filter(Boolean).map(x=>`https://www.goat.com/api/v1/product_templates/${encodeURIComponent(x)}`);
  for(const url of paths){
    try{
      const r=await fetch(url,{headers:{accept:'application/json','user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36'},cache:'no-store',signal:AbortSignal.timeout(5500)});
      if(r.ok){const type=String(r.headers.get('content-type')||'');if(type.includes('json'))return await r.json()}
    }catch{}
  }
  return null;
}

export async function GET(request){
  const q=new URL(request.url).searchParams,sku=String(q.get('sku')||'').trim();
  if(!sku)return Response.json({error:'sku required'},{status:400});
  try{
    const params=new URLSearchParams({query:sku,hitsPerPage:'12',distinct:'true'}).toString();
    const search=await fetch(`https://${GOAT_APP.toLowerCase()}-dsn.algolia.net/1/indexes/product_variants_v2/query`,{
      method:'POST',headers:{'content-type':'application/json','x-algolia-application-id':GOAT_APP,'x-algolia-api-key':GOAT_SEARCH_KEY,'x-algolia-agent':'Algolia for JavaScript'},body:JSON.stringify({params}),cache:'no-store',signal:AbortSignal.timeout(5000)
    });
    if(!search.ok)return Response.json({sku,found:false,searchStatus:search.status,images:[]},{headers:{'Cache-Control':'public, s-maxage=3600'}});
    const data=await search.json(),hits=Array.isArray(data.hits)?data.hits:[],needle=norm(sku);
    const hit=hits.find(x=>norm(x.sku)===needle)||hits[0];
    if(!hit)return Response.json({sku,found:false,images:[]},{headers:{'Cache-Control':'public, s-maxage=3600'}});
    const id=String(hit.product_template_id||hit.productTemplateId||hit.id||''),slug=hit.slug||'';
    const images=[];collect(hit,images,id);
    const detail=await templateJson(slug,id);if(detail)collect(detail,images,id);
    const unique=[...new Set(images)].slice(0,24),checks=await Promise.all(unique.map(async url=>({url,ok:await valid(url)}))),good=checks.filter(x=>x.ok).map(x=>x.url).slice(0,12);
    return Response.json({sku,found:true,slug,productTemplateId:id,images:good,searchHitCount:hits.length,detailLoaded:!!detail},{headers:{'Cache-Control':'public, s-maxage=86400, stale-while-revalidate=604800'}});
  }catch(e){return Response.json({sku,found:false,images:[],error:'GOAT gallery lookup failed'},{status:502})}
}
