import {cleanProductName,dedupeCatalogProducts} from '../../../lib/catalog-normalize';

const URL='https://mmazwydwswrkqgisotyt.supabase.co/rest/v1/shoe_products';
const KEY='sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const BRANDS={1:'Nike',2:'Jordan',3:'Adidas',4:'Yeezy',5:'Balmain',6:'Christian Louboutin',7:'Louis Vuitton',8:'Gucci',9:'Versace',10:'Balenciaga',11:'New Balance',12:'ASICS',13:'Puma',14:'Reebok',15:'Converse',16:'Vans',17:'Saucony',18:'Salomon',19:'HOKA',20:'On',21:'Dior',22:'Maison Margiela',23:'Alexander McQueen',24:'BAPE',25:'Off-White',26:'Fear of God',27:'Brooks',28:'Mizuno',29:'Under Armour',30:'Onitsuka Tiger'};
const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const APPAREL=/\b(?:shirt|sweatshirt|sweater|hoodie|tee|pants|sweatpants|shorts|jacket|jersey|tracksuit|joggers?|pullover|crewneck|clothing|apparel)\b/i;
const SAMPLE=/\b(?:sample|samples|prototype)\b/i;
const MEN=['6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','12.5','13','14','15'];
const WOMEN=['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12'];
const UNISEX=['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','12.5','13','14','15'];
const MIN_UNVERIFIED_PRICE=40;
function goodImage(v=''){return /^https:\/\//i.test(String(v))&&!BAD_IMAGE.test(String(v))}
function gender(v=''){const s=String(v).toLowerCase();if(/women|wmns|female/.test(s))return'Women';if(/(^|[^a-z])men([^a-z]|$)|male/.test(s))return'Men';return'Unisex'}
function sizes(g){return g==='Women'?WOMEN:g==='Men'?MEN:UNISEX}
function isSample(x){return SAMPLE.test(`${x.name||''} ${x.model||''} ${x.style_code||''} ${x.source_name||''}`)}
function suspiciousPrice(x){const n=Number(x.retail_price);return Number.isFinite(n)&&n>0&&n<MIN_UNVERIFIED_PRICE&&x.verification_status!=='VERIFIED'}
function mapRow(x){const g=gender(x.gender);const brand=BRANDS[x.brand_id]||'Dicey Shoes';const raw=Number(x.retail_price);const price=Number.isFinite(raw)&&raw>0?raw:175;const name=cleanProductName(x.name,{brand,styleCode:x.style_code});return{slug:`db-${x.product_id}`,dbId:x.product_id,sku:x.style_code||'',brand,name,model:x.model||'',colorway:x.colorway||'',price,category:['Lifestyle','Running','Basketball','Skate','Luxury'].includes(x.category)?x.category:'Lifestyle',gender:g,image:x.image_url||'',status:'In Stock',imageMode:DARK_SHOE.test(name)?'dark':'normal',sizes:sizes(g),description:x.description||`Explore the ${name} from ${brand}.`,source:x.source_name||'Dicey Catalog',verificationStatus:x.verification_status||'',referenceOnly:false,productUrl:x.product_url||''}}
async function getAll(){const batch=1000,rows=[];for(let offset=0;;offset+=batch){const qs=new URLSearchParams({select:'product_id,brand_id,name,model,colorway,style_code,gender,category,description,retail_price,currency,product_url,image_url,image_usage,source_name,status,verification_status',status:'eq.PUBLISHED',order:'product_id.asc',limit:String(batch),offset:String(offset)});const r=await fetch(`${URL}?${qs}`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`},cache:'no-store'});if(!r.ok)throw new Error(`catalog ${r.status}`);const page=await r.json();rows.push(...page);if(page.length<batch)break}return rows}
export async function GET(){try{const raw=await getAll();const eligible=raw.filter(x=>goodImage(x.image_url)&&!APPAREL.test(`${x.name||''} ${x.model||''}`)&&!isSample(x)&&!suspiciousPrice(x)).map(mapRow);const products=dedupeCatalogProducts(eligible);const byBrand={},byCategory={};for(const p of products){byBrand[p.brand]=(byBrand[p.brand]||0)+1;byCategory[p.category]=(byCategory[p.category]||0)+1}return Response.json({products,count:products.length,duplicatesRemoved:eligible.length-products.length,priceTbd:0,byBrand,byCategory,categories:['Lifestyle','Running','Basketball','Skate','Luxury']},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return Response.json({products:[],count:0,error:'catalog unavailable'},{status:503})}}
