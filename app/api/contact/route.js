const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://mmazwydwswrkqgisotyt.supabase.co';
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req){
  try{
    const body=await req.json();
    if(body?.website)return Response.json({ok:true});
    const name=String(body?.name||'').trim();
    const email=String(body?.email||'').trim().toLowerCase();
    const orderNumber=String(body?.orderNumber||'').trim();
    const topic=String(body?.topic||'General').trim().slice(0,80);
    const message=String(body?.message||'').trim();
    if(!name||name.length>120)return Response.json({ok:false,error:'Enter your name.'},{status:400});
    if(!EMAIL.test(email))return Response.json({ok:false,error:'Enter a valid email address.'},{status:400});
    if(message.length<5||message.length>5000)return Response.json({ok:false,error:'Enter a message between 5 and 5,000 characters.'},{status:400});
    const r=await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`,{
      method:'POST',
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({name,email,order_number:orderNumber||null,topic,message})
    });
    if(!r.ok){
      const text=await r.text();
      console.error('contact insert failed',r.status,text);
      return Response.json({ok:false,error:'Could not send your message right now.'},{status:500});
    }
    return Response.json({ok:true,message:'Message received. We’ll reply to the email you provided.'});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:'Could not send your message right now.'},{status:500});
  }
}
