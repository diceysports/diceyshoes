export async function GET(req){
  try{
    const stripeKey=process.env.STRIPE_SECRET_KEY;
    if(!stripeKey)return Response.json({ok:false,error:'Stripe checkout is not configured.'},{status:503});
    const id=new URL(req.url).searchParams.get('session_id')||'';
    if(!/^cs_/.test(id))return Response.json({ok:false,error:'Invalid checkout session.'},{status:400});
    const r=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${stripeKey}`},cache:'no-store'});
    const data=await r.json();
    if(!r.ok)return Response.json({ok:false,error:data?.error?.message||'Could not verify checkout.'},{status:502});
    return Response.json({ok:true,status:data.status,paymentStatus:data.payment_status,customerEmail:data.customer_details?.email||'',amountTotal:data.amount_total||0,currency:data.currency||'usd'});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:'Could not verify checkout.'},{status:500});
  }
}
