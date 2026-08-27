'use client';
import {useState} from 'react';

export default function NewsletterForm(){
  const[email,setEmail]=useState('');
  const[msg,setMsg]=useState('');
  const[busy,setBusy]=useState(false);
  async function submit(e){
    e.preventDefault();
    setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,source:'footer'})});
      const data=await r.json();
      if(!r.ok)throw new Error(data?.error||'Could not subscribe.');
      setMsg(data?.message||'You’re on the list.');
      setEmail('');
    }catch(err){setMsg(err.message||'Could not subscribe.')}finally{setBusy(false)}
  }
  return <form className="newsletterForm" onSubmit={submit}>
    <label htmlFor="newsletter-email">DROP UPDATES</label>
    <p>New releases, restocks and sneaker stories—sent when there is something worth opening.</p>
    <div><input id="newsletter-email" type="email" required autoComplete="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/><button type="submit" disabled={busy}>{busy?'JOINING…':'SIGN UP'}</button></div>
    {msg&&<small role="status">{msg}</small>}
  </form>;
}
