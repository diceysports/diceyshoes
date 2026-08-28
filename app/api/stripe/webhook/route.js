import crypto from 'crypto';

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://mmazwydwswrkqgisotyt.supabase.co';

function safeEqualHex(a,b){
  try{
    const x=Buffer.from(String(a||''),'hex'),y=Buffer.from(String(b||''),'hex');
    return x.length===y.length&&crypto.timingSafeEqual(x,y);
  }catch{return false}
}

function verifyStripeSignature(payload,header,secret){
  if(!header||!secret)return false;
  const parts=String(header).split(',').map(x=>x.trim());
  const t=parts.find(x=>x.startsWith('t='))?.slice(2);
  const signatures=parts.filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));
  if(!t||!signatures.length)return false;
  const ts=Number(t);
  if(!Number.isFinite(ts)||Math.abs(Math.floor(Date.now()/1000)-ts)>300)return false;
  const expected=crypto.createHmac('sha256',secret).update(`${t}.${payload}`,'utf8').digest('hex');
  return signatures.some(sig=>safeEqualHex(sig,expected));
}

async function stripeGet(path,key){
  const r=await fetch(`https://api.stripe.com${path}`,{headers:{Authorization:`Bearer ${key}`},cache:'no-store'});
  const data=await r.json();
  if(!r.ok)throw new Error(data?.error?.message||`Stripe ${r.status}`);
  return data;
}

async function upsertOrder(session,eventType,stripeKey,serviceKey){
  const lineItems=await stripeGet(`/v1/checkout/sessions/${encodeURIComponent(session.id)}/line_items?limit=100&expand[]=data.price.product`,stripeKey);
  const items=(lineItems.data||[]).map(li=>({
    quantity:li.quantity||1,
    amount_total:li.amount_total||null,
    currency:li.currency||session.currency||null,
    product_id:li.price?.product?.metadata?.product_id||null,
    size:li.price?.product?.metadata?.size||null,
    sizing:li.price?.product?.metadata?.sizing||null,
    name:li.description||li.price?.product?.name||null
  }));
  const customer=session.customer_details||{};
  const shipping=session.shipping_details||session.collected_information?.shipping_details||{};
  const order={
    stripe_session_id:session.id,
    stripe_payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,
    store_key:'dicey_shoes',
    payment_status:session.payment_status||null,
    currency:session.currency||null,
    amount_total:session.amount_total??null,
    customer_email:customer.email||session.customer_email||null,
    customer_name:customer.name||null,
    customer_phone:customer.phone||null,
    shipping_name:shipping.name||null,
    shipping_address:shipping.address||null,
    items,
    stripe_event_type:eventType,
    updated_at:new Date().toISOString()
  };
  const r=await fetch(`${SUPABASE_URL}/rest/v1/store_orders?on_conflict=stripe_session_id`,{
    method:'POST',
    headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify(order),
    cache:'no-store'
  });
  if(!r.ok)throw new Error(`order persistence failed ${r.status}: ${await r.text()}`);
}

export async function POST(req){
  const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey=process.env.STRIPE_SECRET_KEY;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!webhookSecret||!stripeKey||!serviceKey)return new Response('Webhook not configured',{status:503});
  const payload=await req.text();
  const signature=req.headers.get('stripe-signature');
  if(!verifyStripeSignature(payload,signature,webhookSecret))return new Response('Invalid signature',{status:400});
  let event;
  try{event=JSON.parse(payload)}catch{return new Response('Invalid payload',{status:400})}
  const supported=new Set(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed']);
  if(!supported.has(event.type))return Response.json({received:true,ignored:true});
  try{
    const session=event.data?.object;
    if(!session?.id)return new Response('Missing Checkout Session',{status:400});
    if((session.metadata?.store||'').toLowerCase()!=='dicey shoes')return Response.json({received:true,ignored:true});
    await upsertOrder(session,event.type,stripeKey,serviceKey);
    return Response.json({received:true});
  }catch(e){
    console.error('Stripe webhook error',e);
    return new Response('Webhook processing failed',{status:500});
  }
}
