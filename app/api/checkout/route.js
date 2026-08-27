const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://mmazwydwswrkqgisotyt.supabase.co';
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const BRANDS={1:'Nike',2:'Jordan',3:'Adidas',4:'Yeezy',5:'Balmain',6:'Christian Louboutin',7:'Louis Vuitton',8:'Gucci',9:'Versace',10:'Balenciaga',11:'New Balance',12:'ASICS',13:'Puma',14:'Reebok',15:'Converse',16:'Vans',17:'Saucony',18:'Salomon',19:'HOKA',20:'On',21:'Dior',22:'Maison Margiela',23:'Alexander McQueen',24:'BAPE',25:'Off-White',26:'Fear of God',27:'Brooks',28:'Mizuno',29:'Under Armour',30:'Onitsuka Tiger'};
const SIZE=/^(?:[1-9]|1[0-9])(?:\.5)?$/;
const SIZING=new Set(['Men','Women']);

async function loadProducts(ids){
  const query=new URLSearchParams({
    select:'product_id,brand_id,name,retail_price,currency,image_url,image_usage,source_name,status',
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

export async function POST(req){
  try{
    const stripeKey=process.env.STRIPE_SECRET_KEY;
    if(!stripeKey)return Response.json({ok:false,error:'Stripe checkout is not configured on this deployment.'},{status:503});
    const body=await req.json();
    const items=Array.isArray(body?.items)?body.items:[];
    if(!items.length||items.length>50)return Response.json({ok:false,error:'Your bag is empty or too large to checkout.'},{status:400});

    const normalized=[];
    for(const item of items){
      const slug=String(item?.slug||'');
      const match=/^db-(\d+)$/.exec(slug);
      const size=String(item?.size||'').trim();
      const sizing=String(item?.sizing||'').trim();
      if(!match||!SIZE.test(size)||(sizing&&!SIZING.has(sizing)))return Response.json({ok:false,error:'One or more bag items are not available for checkout.'},{status:400});
      normalized.push({productId:Number(match[1]),size,sizing});
    }

    const ids=[...new Set(normalized.map(x=>x.productId))];
    const rows=await loadProducts(ids);
    const rowMap=new Map(rows.map(r=>[Number(r.product_id),r]));
    const grouped=new Map();
    for(const item of normalized){
      const row=rowMap.get(item.productId);
      const reference=row&&(row.image_usage==='REFERENCE_ONLY'||/KicksDB|SneakerMarket/i.test(row.source_name||''));
      const price=Number(row?.retail_price);
      if(!row||reference||!Number.isFinite(price)||price<=0)return Response.json({ok:false,error:'One or more items are catalog-only or do not have a confirmed checkout price.'},{status:400});
      const key=`${item.productId}|${item.sizing}|${item.size}`;
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

    [...grouped.values()].forEach(({row,size,sizing,quantity},i)=>{
      const amount=Math.round(Number(row.retail_price)*100);
      const brand=BRANDS[row.brand_id]||'Dicey Shoes';
      const sizingLabel=sizing?`${sizing}'s US size ${size}`:`US size ${size}`;
      form.set(`line_items[${i}][price_data][currency]`,String(row.currency||'usd').toLowerCase());
      form.set(`line_items[${i}][price_data][unit_amount]`,String(amount));
      form.set(`line_items[${i}][price_data][product_data][name]`,`${brand} ${row.name}`.slice(0,250));
      form.set(`line_items[${i}][price_data][product_data][description]`,sizingLabel);
      form.set(`line_items[${i}][price_data][product_data][metadata][product_id]`,String(row.product_id));
      form.set(`line_items[${i}][price_data][product_data][metadata][size]`,size);
      if(sizing)form.set(`line_items[${i}][price_data][product_data][metadata][sizing]`,sizing);
      if(/^https:\/\//i.test(row.image_url||''))form.set(`line_items[${i}][price_data][product_data][images][0]`,row.image_url);
      form.set(`line_items[${i}][quantity]`,String(quantity));
    });

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
