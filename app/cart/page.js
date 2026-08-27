'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useStore} from '../../components/StoreProvider';
import {money} from '../../lib/products';

export default function CartPage(){
  const{cart,remove}=useStore();
  const[cMsg,setCMsg]=useState('');
  const[busy,setBusy]=useState(false);
  useEffect(()=>{if(typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('checkout')==='cancelled')setCMsg('Checkout was cancelled. Your bag is still here.')},[]);
  const total=cart.reduce((s,x)=>s+(Number(x.price)||0),0);
  const blocked=cart.some(x=>x.price==null||x.referenceOnly);

  async function checkout(){
    if(!cart.length||blocked)return;
    setBusy(true);setCMsg('');
    try{
      const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart.map(x=>({slug:x.slug,size:x.size}))})});
      const data=await r.json();
      if(!r.ok||!data?.url)throw new Error(data?.error||'Could not start secure checkout.');
      window.location.href=data.url;
    }catch(err){setCMsg(err.message||'Could not start secure checkout.');setBusy(false)}
  }

  return <main>
    <section className="pagehead"><div className="w"><div className="k">YOUR ORDER</div><h1>BAG</h1><p>{cart.length?`${cart.length} ${cart.length===1?'pair':'pairs'} ready for review.`:'Your bag is empty.'}</p></div></section>
    <section className="catalog"><div className="w cartlayout">
      <div className="cartitems">
        {cart.map(x=><div className="cartitem" key={x.id}>
          <Link href={'/product/'+x.slug} className="cartpic"><img src={x.image} alt={x.name}/></Link>
          <div className="cartcopy"><b>{x.brand}</b><Link href={'/product/'+x.slug}><h3>{x.name}</h3></Link><p>US size {x.size}</p><strong>{x.price==null?'PRICE TBD':money(x.price)}</strong>{x.referenceOnly&&<small>Catalog-only item</small>}</div>
          <button onClick={()=>remove(x.id)} aria-label={`Remove ${x.name}`}>Remove</button>
        </div>)}
        {!cart.length&&<div className="empty">Your bag is empty. <Link href="/shop">Shop shoes →</Link></div>}
      </div>
      <aside className="summary">
        <div className="k">ORDER SUMMARY</div>
        <div className="summaryLine"><span>Subtotal</span><b>{money(total)}</b></div>
        <div className="summaryLine"><span>Shipping</span><span>Address collected at checkout</span></div>
        <p>Final payment is completed securely on Stripe. Taxes, if applicable, are handled according to your checkout and local requirements.</p>
        {blocked&&<div className="cartWarning">Remove any PRICE TBD or catalog-only item before checkout.</div>}
        {cMsg&&<div className="cartMessage" role="status">{cMsg}</div>}
        <button className="btn v wide" disabled={!cart.length||blocked||busy} onClick={checkout}>{busy?'OPENING STRIPE…':'SECURE CHECKOUT'}</button>
        <div className="checkoutTrust">Secure payment powered by Stripe · shipping address collected during checkout.</div>
        <Link className="continueShopping" href="/shop">← Continue shopping</Link>
      </aside>
    </div></section>
  </main>;
}
