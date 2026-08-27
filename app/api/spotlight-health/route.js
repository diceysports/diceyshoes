import {products} from '../../../lib/products';

const SPOTLIGHT_SLUGS=[
  'yuto-horigome-sb-dunk',
  'cactus-jack-air-force-1',
  'travis-air-force-1-sail',
  'off-white-air-force-1-brooklyn',
  'travis-air-max-1-baroque-brown',
  'kobe-af1-mamba-mentality',
  'tiffany-air-force-1-1837',
  'nike-sb-air-force-light-chocolate',
  'caitlin-clark-kobe-5-spruce'
];

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request){
  const origin=new URL(request.url).origin;
  const checks=await Promise.all(SPOTLIGHT_SLUGS.map(async slug=>{
    const product=products.find(p=>p.slug===slug);
    if(!product)return {slug,ok:false,status:0,contentType:'',reason:'missing-product'};
    try{
      const checkUrl=new URL('/api/shoe-image',origin);
      checkUrl.searchParams.set('url',product.image);
      const response=await fetch(checkUrl,{cache:'no-store'});
      const contentType=(response.headers.get('content-type')||'').toLowerCase();
      const ok=response.ok&&contentType.startsWith('image/');
      return {slug,name:product.name,ok,status:response.status,contentType};
    }catch(error){
      return {slug,name:product.name,ok:false,status:0,contentType:'',reason:error?.message||'fetch-failed'};
    }
  }));
  const working=checks.filter(x=>x.ok).length;
  return Response.json({ok:working===checks.length,working,total:checks.length,checks},{headers:{'cache-control':'no-store'}});
}
