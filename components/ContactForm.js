'use client';
import {useState} from 'react';

export default function ContactForm(){
  const[form,setForm]=useState({name:'',email:'',orderNumber:'',topic:'General',message:'',website:''});
  const[msg,setMsg]=useState('');
  const[busy,setBusy]=useState(false);
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));
  async function submit(e){
    e.preventDefault();setBusy(true);setMsg('');
    try{
      const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data=await r.json();
      if(!r.ok)throw new Error(data?.error||'Could not send your message.');
      setMsg(data?.message||'Message received.');
      setForm({name:'',email:'',orderNumber:'',topic:'General',message:'',website:''});
    }catch(err){setMsg(err.message||'Could not send your message.')}finally{setBusy(false)}
  }
  return <form className="contactForm" onSubmit={submit}>
    <div className="contactGrid">
      <label>Name<input required value={form.name} onChange={e=>set('name',e.target.value)} autoComplete="name"/></label>
      <label>Email<input required type="email" value={form.email} onChange={e=>set('email',e.target.value)} autoComplete="email"/></label>
      <label>Order number <span>(optional)</span><input value={form.orderNumber} onChange={e=>set('orderNumber',e.target.value)} placeholder="DS-…"/></label>
      <label>Topic<select value={form.topic} onChange={e=>set('topic',e.target.value)}><option>General</option><option>Order status</option><option>Shipping</option><option>Return</option><option>Product question</option><option>Payment</option></select></label>
    </div>
    <label className="contactMessage">Message<textarea required minLength="5" maxLength="5000" rows="7" value={form.message} onChange={e=>set('message',e.target.value)} placeholder="Tell us how we can help."/></label>
    <input className="contactTrap" tabIndex="-1" autoComplete="off" value={form.website} onChange={e=>set('website',e.target.value)} aria-hidden="true"/>
    <button className="btn v" type="submit" disabled={busy}>{busy?'SENDING…':'SEND MESSAGE'}</button>
    {msg&&<p className="formStatus" role="status">{msg}</p>}
  </form>;
}
