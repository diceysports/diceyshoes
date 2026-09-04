function text(s=''){return s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#8217;|&rsquo;/g,'’').replace(/&#8220;|&#8221;|&quot;/g,'"').replace(/\s+/g,' ').trim()}
function tag(item,name){const m=item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,'i'));return m?text(m[1]):''}
function image(item){let m=item.match(/<media:content[^>]+url=["']([^"']+)/i)||item.match(/<media:thumbnail[^>]+url=["']([^"']+)/i)||item.match(/<enclosure[^>]+url=["']([^"']+)/i)||item.match(/<img[^>]+src=["']([^"']+)/i);return m?m[1]:''}
function parse(xml,source){return (xml.match(/<item[\s\S]*?<\/item>/gi)||[]).slice(0,12).map(i=>({source,title:tag(i,'title'),url:tag(i,'link'),date:tag(i,'pubDate'),summary:tag(i,'description').slice(0,220),image:image(i)})).filter(x=>x.title&&x.url)}
const TRUSTED_ARTICLE_HOSTS=['sneakernews.com','www.sneakernews.com','nicekicks.com','www.nicekicks.com'];
function trustedArticle(url=''){try{return TRUSTED_ARTICLE_HOSTS.includes(new URL(url).hostname.toLowerCase())}catch{return false}}
function metaImage(html=''){
  const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i
  ];
  for(const re of patterns){const m=html.match(re);if(m?.[1])return m[1].replace(/&amp;/g,'&')}
  return '';
}
async function articleImage(url){
  if(!trustedArticle(url))return '';
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),4500);
    const r=await fetch(url,{next:{revalidate:7200},redirect:'follow',signal:controller.signal,headers:{'User-Agent':'Mozilla/5.0 DiceyShoes/1.0','Accept':'text/html,application/xhtml+xml'}});
    clearTimeout(timer);
    if(!r.ok)return '';
    const html=await r.text();
    const found=metaImage(html);
    if(!found)return '';
    return new URL(found,url).toString();
  }catch{return ''}
}
async function hydrateImages(rows){
  const missing=rows.map((row,index)=>({row,index})).filter(x=>!x.row.image&&trustedArticle(x.row.url)).slice(0,10);
  if(!missing.length)return rows;
  const found=await Promise.all(missing.map(x=>articleImage(x.row.url)));
  const copy=rows.map(x=>({...x}));
  missing.forEach((x,i)=>{if(found[i])copy[x.index].image=found[i]});
  return copy;
}
const fallback=[
{source:'Sneaker News',title:'Travis Scott x Nike Air Force 1 “Ice Blue” Dropping Soon',url:'https://sneakernews.com/2026/08/31/travis-scott-x-nike-air-force-1-low-releasing-today-at-47-chrystie/',date:'Fri, 04 Sep 2026 17:00:00 GMT',summary:'Sneaker News updated the Travis Scott x Nike Cactus Court rollout: the Ice Blue Air Force 1 and Zoom Vapor 12 headline the collection, with the wider Cactus Court launch set for September 4.',image:''},
{source:'Sneaker News',title:'Ahead Of US Open, Coco Gauff Debuts The New Balance 983',url:'https://sneakernews.com/2026/09/01/new-balance-983-u9835du-release-date/',date:'Tue, 01 Sep 2026 22:00:00 GMT',summary:'New Balance introduces the 983, a new 2000s-running-inspired lifestyle model debuted by Coco Gauff. The global launch is October 1 for $160.',image:'https://sneakernews.com/wp-content/uploads/2026/09/new-balance-983-u9835du-release-date-2.jpg'},
{source:'Sneaker News',title:'Pharrell’s adidas Water Moc Might Be The Perfect Vacation Shoe',url:'https://sneakernews.com/2026/09/01/pharrell-adidas-water-moc/',date:'Tue, 01 Sep 2026 21:00:00 GMT',summary:'Pharrell expands the adidas VIRGINIA line with the technical, water-ready Watermoc in three debut colorways, launching globally September 5 for $140.',image:'https://sneakernews.com/wp-content/uploads/2026/09/pharrell-adidas-water-moc-2026-release-date.jpg'},
{source:'Sneaker News',title:'Jordan Brand’s Newest Lifestyle Skate Shoe Remixes The Air Jordan 1',url:'https://sneakernews.com/2026/09/01/jordan-strada-baroque-brown-sail-gum-medium-brown-rust-pink-ir2571-200/',date:'Tue, 01 Sep 2026 20:00:00 GMT',summary:'Jordan Brand reveals the Strada, a new lifestyle skate model with Air Jordan 1 influence. The Baroque Brown and Rust Pink colorway is expected Fall/Winter 2026 for $130.',image:'https://sneakernews.com/wp-content/uploads/2026/09/jordan-strada-baroque-brown-sail-gum-medium-brown-rust-pink-ir2571-200-6.jpg'},
{source:'Nice Kicks',title:'NFL × Nike Air Max 90 Rivalries “Titans”',url:'https://www.nicekicks.com/nfl-nike-air-max-90-rivalries-titans-iw1141-400/',date:'Tue, 01 Sep 2026 16:00:00 GMT',summary:'Nike’s NFL Rivalries pack gives the Air Max 90 a Tennessee Titans treatment in Coast, White and College Navy, releasing September 1 for $140.',image:''},
{source:'Nice Kicks',title:'Nike Kobe 3 Low Protro “Pure Platinum”',url:'https://www.nicekicks.com/nike-kobe-3-low-protro-pure-platinum-iv7127-001/',date:'Tue, 01 Sep 2026 15:00:00 GMT',summary:'The Nike Kobe 3 Low Protro arrives in Pure Platinum on September 1 through SNKRS and select retailers for $190.',image:''},
{source:'Nice Kicks',title:'Reebok DMX 3000 Series “Vector Blue”',url:'https://www.nicekicks.com/reebok-dmx-3000-series-vector-blue-100263684/',date:'Thu, 27 Aug 2026 12:00:00 GMT',summary:'Reebok brings back the DMX 3000 Series in a Chalk, Vector Blue and Black colorway, releasing September 9 for $130.',image:'https://www.nicekicks.com/files/2026/08/imgi_2_1x1_dmx2-e1787856405153.jpeg'},
{source:'Nice Kicks',title:'Air Jordan 3 TD Football Cleats “Metallic Silver”',url:'https://www.nicekicks.com/air-jordan-3-td-football-cleats-metallic-silver-fz8626-002/',date:'Thu, 27 Aug 2026 11:00:00 GMT',summary:'Jordan Brand translates the Air Jordan 3 into a Metallic Silver football cleat, releasing September 10 for $205.',image:'https://www.nicekicks.com/files/2026/08/imgi_12_JORDAN3MIDTD-e1787851398440.jpeg'}
];
export async function GET(){try{const feeds=[['Sneaker News','https://sneakernews.com/feed/'],['Nice Kicks','https://www.nicekicks.com/feed/']];const rows=[...fallback];for(const[source,url]of feeds){try{const r=await fetch(url,{next:{revalidate:7200},headers:{'User-Agent':'Mozilla/5.0 DiceyShoes/1.0'}});if(r.ok)rows.push(...parse(await r.text(),source))}catch{}}const seen=new Set();let news=rows.filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true}).sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0)).slice(0,18);news=await hydrateImages(news);return Response.json({news,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, s-maxage=7200, stale-while-revalidate=7200'}})}catch{const news=await hydrateImages(fallback);return Response.json({news,updatedAt:new Date().toISOString()},{status:200,headers:{'Cache-Control':'public, s-maxage=7200, stale-while-revalidate=7200'}})}}
