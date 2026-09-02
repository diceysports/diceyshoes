const SOURCE_LABELS=/^(?:flight\s*club|goat|stockx|stadium\s*goods|sneaker\s*market)$/i;
const SOURCE_SUFFIX=/\s*(?:\||[-–—])\s*(?:flight\s*club|goat|stockx|stadium\s*goods|sneaker\s*market)\s*$/i;
const KNOWN_BRANDS=['Nike','Jordan','Air Jordan','Adidas','Adidas Originals','Yeezy','New Balance','ASICS','Puma','Reebok','Converse','Vans','Saucony','Salomon','HOKA','On','Dior','Maison Margiela','Alexander McQueen','BAPE','Off-White','Fear of God','Brooks','Mizuno','Under Armour','Onitsuka Tiger','Balmain','Christian Louboutin','Louis Vuitton','Gucci','Versace','Balenciaga'];
const GENERIC_IDENTITY_WORDS=new Set(['shoe','shoes','sneaker','sneakers','flight','club','goat','stockx','stadium','goods']);

export function compactStyleCode(value=''){
  return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
}

function compact(value=''){
  return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
}

function smartCase(value=''){
  const letters=value.replace(/[^A-Za-z]/g,'');
  if(!letters||letters.replace(/[^A-Z]/g,'').length/letters.length<.82)return value;
  let result=value.toLowerCase().replace(/(^|[\s/('“’\-])([a-z])/g,(_,before,letter)=>before+letter.toUpperCase());
  const exact=[['Yeezy','Yeezy'],['Adidas','Adidas'],['Nike','Nike'],['Asics','ASICS'],['Hoka','HOKA'],['Bape','BAPE'],['Dior','Dior'],['Og','OG'],['Sb','SB'],['Se','SE'],['Sp','SP'],['V2','V2']];
  for(const[from,to]of exact)result=result.replace(new RegExp(`\\b${from}\\b`,'g'),to);
  return result;
}

function removeStyleCode(value,styleCode){
  const target=compactStyleCode(styleCode);
  if(target.length<5||!/\d/.test(target)||!/[A-Z]/.test(target))return value;
  const words=String(value).split(/\s+/);
  for(let start=0;start<words.length;start++){
    for(let end=start+1;end<=Math.min(words.length,start+5);end++){
      if(compactStyleCode(words.slice(start,end).join(''))!==target)continue;
      if(end<words.length&&/^\d{3,4}[),.]?$/.test(words[end]))end++;
      return [...words.slice(0,start),...words.slice(end)].join(' ').trim();
    }
  }
  return value;
}

function isBrandOnly(value,brand=''){
  const key=compact(value);
  if(!key)return false;
  const names=[brand,...KNOWN_BRANDS].filter(Boolean);
  return names.some(name=>compact(name)===key);
}

function isCodeSegment(value,styleCode=''){
  const segment=compactStyleCode(value),code=compactStyleCode(styleCode);
  if(code&&segment===code)return true;
  const words=String(value).trim().split(/\s+/);
  const codeWords=words.filter(word=>/^(?=[A-Z0-9-]{4,}$)(?=.*[A-Z])(?=.*\d)[A-Z0-9-]+$/i.test(word));
  return codeWords.length>0&&codeWords.length>=Math.ceil(words.length*.6);
}

function isColorDump(value=''){
  const text=String(value).trim().toLowerCase();
  if(!text.includes('/'))return false;
  const parts=text.split('/').map(part=>part.trim()).filter(Boolean);
  return parts.length>=2;
}

export function cleanProductName(raw='',options={}){
  const brand=options.brand||'';
  const styleCode=options.styleCode||options.sku||'';
  let name=String(raw||'').replace(/\u0000/g,'').replace(/\s+/g,' ').trim();
  if(!name)return'Dicey Shoe';

  name=name.replace(SOURCE_SUFFIX,'').replace(/\s*\|.*$/,'').trim();
  const parts=name.split(/\s+[-–—]\s+/).map(part=>part.trim()).filter(Boolean);
  while(parts.length>1){
    const tail=parts[parts.length-1];
    if(SOURCE_LABELS.test(tail)||isBrandOnly(tail,brand)||isCodeSegment(tail,styleCode)||isColorDump(tail))parts.pop();
    else break;
  }
  name=parts.join(' - ');
  name=removeStyleCode(name,styleCode)
    .replace(/\bFlight\s*Club\b/ig,'')
    .replace(/\s+(?:Flight\s*Club|GOAT|StockX|Stadium\s*Goods|Sneaker\s*Market)\s*$/i,'')
    .replace(/\s+Release\s+Date\b.*$/i,'')
    .replace(/\s+Size\s*[\d～~–—-].*$/i,'')
    .replace(/\s+(?:Men's|Women's|Kids')\s+Shoes?\s*$/i,'')
    .replace(/\s+[xX]\s+/g,' × ')
    .replace(/'([^']{2,60})'/g,'“$1”')
    .replace(/\s+/g,' ')
    .replace(/\s*[-–—|]\s*$/,'')
    .trim();
  return smartCase(name)||'Dicey Shoe';
}

function canonicalBrand(value=''){
  return String(value||'dicey shoes').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
}

export function productIdentityKey(product={}){
  const title=cleanProductName(product.name,{brand:product.brand,styleCode:product.sku||product.style_code});
  const brandWords=String(product.brand||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const ignored=new Set([...GENERIC_IDENTITY_WORDS,...brandWords]);
  const tokens=title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').split(/[^a-z0-9]+/).filter(token=>token&&!ignored.has(token));
  const fingerprint=[...new Set(tokens)].sort().join('-');
  return `${canonicalBrand(product.brand)}:${fingerprint||compactStyleCode(product.sku)||String(product.slug||'unknown')}`;
}

function productQuality(product={}){
  const verification=String(product.verificationStatus||product.verification_status||'').toUpperCase();
  let score=verification==='VERIFIED'?80:verification==='SOURCE_VERIFIED'?55:verification==='PARTIAL'?25:0;
  if(/^https:\/\//i.test(product.image||product.image_url||''))score+=30;
  if(compactStyleCode(product.sku||product.style_code).length>=5)score+=12;
  if(product.description&&String(product.description).length>80)score+=5;
  if(!SOURCE_SUFFIX.test(String(product.name||'')))score+=4;
  return score;
}

function preferredProduct(current,candidate){
  const currentScore=productQuality(current),candidateScore=productQuality(candidate);
  if(candidateScore!==currentScore)return candidateScore>currentScore?candidate:current;
  const currentPrice=Number(current.price??current.retail_price),candidatePrice=Number(candidate.price??candidate.retail_price);
  if(Number.isFinite(candidatePrice)&&candidatePrice>0&&(!Number.isFinite(currentPrice)||currentPrice<=0||candidatePrice<currentPrice))return candidate;
  return current;
}

export function dedupeCatalogProducts(items=[]){
  const groups=new Map();
  for(const item of items){
    if(!item)continue;
    const normalized={...item,name:cleanProductName(item.name,{brand:item.brand,styleCode:item.sku||item.style_code})};
    const key=productIdentityKey(normalized);
    groups.set(key,groups.has(key)?preferredProduct(groups.get(key),normalized):normalized);
  }
  const seenCodes=new Set(),result=[];
  for(const item of groups.values()){
    const code=compactStyleCode(item.sku||item.style_code);
    if(code&&seenCodes.has(code))continue;
    if(code)seenCodes.add(code);
    result.push(item);
  }
  return result;
}

export function randomCatalogProducts(items=[],count=5,predicate=()=>true){
  const seenImages=new Set();
  const pool=dedupeCatalogProducts(items).filter(item=>{
    if(!predicate(item))return false;
    const image=String(item.image||item.image_url||'').replace(/([?&])(w|h|width|height)=\d+/gi,'$1').replace(/[?&]+$/,'');
    if(!image||seenImages.has(image))return false;
    seenImages.add(image);
    return true;
  });
  for(let index=pool.length-1;index>0;index--){
    const randomIndex=Math.floor(Math.random()*(index+1));
    [pool[index],pool[randomIndex]]=[pool[randomIndex],pool[index]];
  }
  return pool.slice(0,count);
}
