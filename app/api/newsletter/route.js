const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://mmazwydwswrkqgisotyt.supabase.co';
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'sb_publishable_qsygJlwjwTVKrumOCyJC5A_Zptqj4xZ';
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req){
  try{
    const body=await req.json();
    const email=String(body?.email||'').trim().toLowerCase();
    if(!EMAIL.test(email))return Response.json({ok:false,error:'Enter a valid email address.'},{status:400});
    const r=await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`,{
      method:'POST',
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({email,source:String(body?.source||'footer').slice(0,60)})
    });
    if(r.ok)return Response.json({ok:true,message:'You’re on the list.'});
    const text=await r.text();
    if(r.status===409||/duplicate|unique/i.test(text))return Response.json({ok:true,message:'You’re already on the list.'});
    console.error('newsletter insert failed',r.status,text);
    return Response.json({ok:false,error:'Could not subscribe right now.'},{status:500});
  }catch(e){
    console.error(e);
    return Response.json({ok:false,error:'Could not subscribe right now.'},{status:500});
  }
}
