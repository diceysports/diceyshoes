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
  'www.brooksrunning.com',
  'sneakernews.com',
  'www.sneakernews.com',
  'nicekicks.com',
  'www.nicekicks.com',
  'newbalance.com',
  'www.newbalance.com',
  'nb.scene7.com',
  'assets.adidas.com',
  'brand.assets.adidas.com',
  'images.puma.com',
  'reebok.com',
  'www.reebok.com'
];

const TRUSTED_ARTICLE_HOSTS=['sneakernews.com','www.sneakernews.com','nicekicks.com','www.nicekicks.com'];

export const runtime='nodejs';
export const dynamic='force-dynamic';

function allowed(hostname){
  const host=hostname.toLowerCase();
  return ALLOWED_HOSTS.some(x=>host===x||host.endsWith('.'+x));
}

function trustedArticle(hostname){
  return TRUSTED_ARTICLE_HOSTS.includes(hostname.toLowerCase());
}

function metaImage(html=''){
  const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i
  ];
  for(const re of patterns){
    const match=html.match(re);
    if(match?.[1])return match[1].replace(/&amp;/g,'&');
  }
  return '';
}

async function resolveArticleImage(article){
  const articleUrl=new URL(article);
  if(articleUrl.protocol!=='https:'||!trustedArticle(articleUrl.hostname))return null;
  const response=await fetch(articleUrl.toString(),{
    headers:{'user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)','accept':'text/html,application/xhtml+xml'},
    redirect:'follow',
    cache:'no-store'
  });
  if(!response.ok)return null;
  const found=metaImage(await response.text());
  if(!found)return null;
  const imageUrl=new URL(found,articleUrl).toString();
  const parsed=new URL(imageUrl);
  return parsed.protocol==='https:'&&allowed(parsed.hostname)?parsed:null;
}

export async function GET(request){
  try{
    const params=new URL(request.url).searchParams;
    const article=params.get('article');
    const source=params.get('url');
    let url=article?await resolveArticleImage(article):source?new URL(source):null;
    if(!url)return new Response('Missing or unresolved image URL',{status:404});
    if(typeof url==='string')url=new URL(url);
    if(url.protocol!=='https:'||!allowed(url.hostname))return new Response('Image host not allowed',{status:403});

    const upstream=await fetch(url.toString(),{
      headers:{
        'user-agent':'Mozilla/5.0 (compatible; DiceyShoes/1.0)',
        'accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'referer':url.origin+'/'
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
