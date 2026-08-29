import fs from 'node:fs/promises';

const BRAND=process.env.BRAND||'';
const SHARD=Number(process.env.SHARD||0);
if(BRAND!=='Under Armour') process.exit(0);
const file=`official-gallery-under-armour-${SHARD}.json`;
const data=JSON.parse(await fs.readFile(file,'utf8'));
const clean=s=>String(s||'').trim();
const norm=s=>clean(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
function exactColor(r){
  const m=clean(r.styleCode).match(/^(\d{7})-([A-Z0-9]{2,4})$/i);
  if(!m)return false;
  const [,base,color]=m;
  let u;try{u=new URL(r.sourceUrl)}catch{return false}
  if(!(u.hostname==='www.underarmour.com'||u.hostname==='underarmour.com'||u.hostname.endsWith('.underarmour.com')))return false;
  if(!decodeURIComponent(u.pathname).includes(base))return false;
  let pageColor='';for(const [k,v] of u.searchParams)if(k.toLowerCase().includes('color'))pageColor=v;
  if(norm(pageColor)!==norm(color))return false;
  const imgs=(Array.isArray(r.images)?r.images:[]).filter(x=>{
    try{const iu=new URL(x.url);return iu.hostname.toLowerCase().endsWith('underarmour.scene7.com')&&norm(decodeURIComponent(iu.pathname)).includes(norm(`${base}-${color}`))}catch{return false}
  });
  if(imgs.length<2)return false;
  r.images=imgs;
  return true;
}
const before=(data.results||[]).length;
data.results=(data.results||[]).filter(exactColor);
data.matched=data.results.length;
data.missed=(data.misses||[]).length+(before-data.matched);
data.strictUaColorFilter={before,after:data.matched,rejected:before-data.matched,rule:'catalog style suffix must equal official UA page color and image asset color'};
await fs.writeFile(file,JSON.stringify(data,null,2));
console.log(JSON.stringify(data.strictUaColorFilter));
