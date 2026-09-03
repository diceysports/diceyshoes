import {products as fallbackProducts} from '../../../lib/products';
import {cleanProductName} from '../../../lib/catalog-normalize';

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://mmazwydwswrkqgisotyt.supabase.co';
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const BRANDS={1:'Nike',2:'Jordan',3:'Adidas',4:'Yeezy',5:'Balmain',6:'Christian Louboutin',7:'Louis Vuitton',8:'Gucci',9:'Versace',10:'Balenciaga',11:'New Balance',12:'ASICS',13:'Puma',14:'Reebok',15:'Converse',16:'Vans',17:'Saucony',18:'Salomon',19:'HOKA',20:'On',21:'Dior',22:'Maison Margiela',23:'Alexander McQueen',24:'BAPE',25:'Off-White',26:'Fear of God',27:'Brooks',28:'Mizuno',29:'Under Armour',30:'Onitsuka Tiger'};
const DEFAULT_PRICE=175;
const SHIPPING_PER_PAIR=25;

async function loadProducts(ids){
  if(!ids.length)return[];
  const query=new URLSearchParams({
    select:'product_id,brand_id,name,retail_price,currency,image_url,status',
    product_id:`in.(${ids.join(',')})`,
    status:'eq.PUBLISHED'
  });
  const r=await fetch(`${SUPABASE_URL}/rest/v1/shoe_products?${query}`,{
    headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},
    cache:'no-store'
  });
  if(!r.ok)throw new Error(`catalog verification failed ${r.status}`);
  return r.json();
}

function fallbackRow(item){
  const p=fallbackProducts.find(x=>x.slug===item.slug);
  if(p)return{product_id:item.slug,brand_name:p.brand||'Dicey Shoes',name:p.name||'Dicey Shoe',retail_price:Number(p.price)>0?Number(p.price):DEFAULT_PRICE,currency:'USD',image_url:p.image||''};
  return{product_id:item.slug||`cart-${Date.now()}`,brand_name:String(item.brand||'Dicey Shoes').slice(0,80),name:String(item.name||'Dicey Shoe').slice(0,200),retail_price:DEFAULT_PRICE,currency:'USD',image_url:String(item.image||'')};
}

export async function POST(req){
  try{
    const stripeKey=process.env.STRIPE_SECRET_KEY;
    if(!stripeKey)return Response.json({ok:false,error:'Stripe checkout is not configured on this deployment.'},{status:503});
    const body=await req.json();
    const items=Array.isArray(body?.items)?body.items:[];
    if(!items.length)return Response.json({ok:false,error:'Your bag is empty.'},{status:400});

    const normalized=items.map((item,i)=>{
      const slug=String(item?.slug||`cart-${i}`);
      const match=/^db-(\d+)$/.exec(slug);
      return{slug,productId:match?Number(match[1]):null,size:String(item?.size||'').trim(),sizing:String(item?.sizing||'').trim(),name:item?.name,brand:item?.brand,image:item?.image};
    });

    const ids=[...new Set(normalized.map(x=>x.productId).filter(Boolean))];
    const rows=await loadProducts(ids);
    const rowMap=new Map(rows.map(r=>[Number(r.product_id),r]));
    const grouped=new Map();

    for(const item of normalized){
      let row=item.productId?rowMap.get(item.productId):null;
      if(row){
        const n=Number(row.retail_price);
        const brandName=BRANDS[row.brand_id]||'Dicey Shoes';
        row={...row,brand_name:brandName,name:cleanProductName(row.name,{brand:brandName}),retail_price:Number.isFinite(n)&&n>0?n:DEFAULT_PRICE,currency:row.currency||'USD'};
      }else row=fallbackRow(item);
      const key=`${item.slug}|${item.sizing}|${item.size}`;
      if(grouped.has(key))grouped.get(key).quantity+=1;
      else grouped.set(key,{row,size:item.size,sizing:item.sizing,quantity:1});
    }

    const origin=new URL(req.url).origin;
    const form=new URLSearchParams();
    form.set('mode','payment');
    form.set('success_url',`${origin}/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set('cancel_url',`${origin}/cart?checkout=cancelled`);
    form.set('billing_address_collection','auto');
    form.set('phone_number_collection[enabled]','true');
    form.set('allow_promotion_codes','true');
    form.set('customer_creation','always');
    ['CA','US','GB','AU','NZ','FR','DE','IT','ES','NL','BE','IE'].forEach((c,i)=>form.set(`shipping_address_collection[allowed_countries][${i}]`,c));
    form.set('metadata[store]','Dicey Shoes');
    form.set('metadata[item_count]',String(normalized.length));
    form.set('metadata[shipping_per_pair]',String(SHIPPING_PER_PAIR));

    [...grouped.values()].forEach(({row,size,sizing,quantity},i)=>{
      const amount=Math.round((Number(row.retail_price)>0?Number(row.retail_price):DEFAULT_PRICE)*100);
      const brand=row.brand_name||BRANDS[row.brand_id]||'Dicey Shoes';
      const sizingLabel=sizing?`${sizing}'s US size ${size||'Selected'}`:`US size ${size||'Selected'}`;
      form.set(`line_items[${i}][price_data][currency]`,String(row.currency||'USD').toLowerCase());
      form.set(`line_items[${i}][price_data][unit_amount]`,String(amount));
      form.set(`line_items[${i}][price_data][product_data][name]`,`${brand} ${row.name||'Dicey Shoe'}`.slice(0,250));
      form.set(`line_items[${i}][price_data][product_data][description]`,sizingLabel);
      form.set(`line_items[${i}][price_data][product_data][metadata][product_id]`,String(row.product_id));
      if(size)form.set(`line_items[${i}][price_data][product_data][metadata][size]`,size);
      if(sizing)form.set(`line_items[${i}][price_data][product_data][metadata][sizing]`,sizing);
      if(/^https:\/\//i.test(row.image_url||''))form.set(`line_items[${i}][price_data][product_data][images][0]`,row.image_url);
      form.set(`line_items[${i}][quantity]`,String(quantity));
    });

    const shippingIndex=grouped.size;
    form.set(`line_items[${shippingIndex}][price_data][currency]`,'usd');
    form.set(`line_items[${shippingIndex}][price_data][unit_amount]`,String(SHIPPING_PER_PAIR*100));
    form.set(`line_items[${shippingIndex}][price_data][product_data][name]`,'Shipping');
    form.set(`line_items[${shippingIndex}][price_data][product_data][description]`,'Flat $25 USD shipping per pair');
    form.set(`line_items[${shippingIndex}][quantity]`,String(normalized.length));

    const stripe=await fetch('https://api.stripe.com/v1/checkout/sessions',{
      method:'POST',
      headers:{Authorization:`Bearer ${stripeKey}`,'Content-Type':'application/x-www-form-urlencoded'},
      body:form
    });
    const data=await stripe.json();
    if(!stripe.ok){
      console.error('Stripe Checkout error',data?.error?.message||data);
      return Response.json({ok:false,error:data?.error?.message||'Could not start secure checkout.'},{status:502});
    }
    return Response.json({ok:true,id:data.id,url:data.url});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:'Could not start secure checkout.'},{status:500});
  }
}
