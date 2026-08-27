const ALLOWED_HOSTS=[
  'static.nike.com',
  'image.goat.com',
  'images.stockx.com',
  'www.stadiumgoods.com',
  'stadiumgoods.com',
  'cdn.shopify.com',
  'media.gucci.com',
  'ca.louisvuitton.com',
  'media.balenciaga.cn',
  'cdn-images.farfetch-contents.com',
  'img.mytheresa.com',
  'www.brooksrunning.com'
];

export const runtime='nodejs';
export const dynamic='force-dynamic';

function allowed(hostname){
  const host=hostname.toLowerCase();
  return ALLOWED_HOSTS.some(x=>host===x||host.endsWith('.'+x));
}

export async function GET(request){
  try{
    const source=new URL(request.url).searchParams.get('url');
    if(!source)return new Response('Missing image URL',{status:400});
    const url=new URL(source);
    if(url.protocol!=='https:'||!allowed(url.hostname))return new Response('Image host not allowed',{status:403});

    const upstream=await fetch(url.toString(),{
      headers:{
        'user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)',
        'accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      redirect:'follow',
      cache:'no-store'
    });
    if(!upstream.ok)return new Response('Image unavailable',{status:upstream.status===404?404:502});
    const type=upstream.headers.get('content-type')||'image/png';
    if(!type.toLowerCase().startsWith('image/'))return new Response('Invalid image response',{status:415});
    const body=await upstream.arrayBuffer();
    return new Response(body,{status:200,headers:{
      'content-type':type,
      'cache-control':'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
      'access-control-allow-origin':'*'
    }});
  }catch{
    return new Response('Image unavailable',{status:502});
  }
}
