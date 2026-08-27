'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useStore} from '../../components/StoreProvider';

export default function SuccessPage(){
  const{clear}=useStore();
  const[state,setState]=useState({loading:true,ok:false,email:''});
  useEffect(()=>{
    const id=typeof window!=='undefined'?new URLSearchParams(window.location.search).get('session_id'):'';
    if(!id){setState({loading:false,ok:false,email:''});return}
    fetch('/api/checkout/session?session_id='+encodeURIComponent(id))
      .then(r=>r.json().then(data=>({ok:r.ok,data})))
      .then(({ok,data})=>{
        const paid=ok&&(data.paymentStatus==='paid'||data.paymentStatus==='no_payment_required')&&data.status==='complete';
        if(paid)clear();
        setState({loading:false,ok:paid,email:data.customerEmail||''});
      })
      .catch(()=>setState({loading:false,ok:false,email:''}));
  },[clear]);

  if(state.loading)return <main><section className="pagehead dark"><div className="w"><div className="ey">Secure checkout</div><h1>VERIFYING ORDER…</h1><p>Confirming your Stripe payment.</p></div></section></main>;
  return <main><section className="pagehead dark"><div className="w"><div className="ey">{state.ok?'PAYMENT CONFIRMED':'CHECKOUT STATUS'}</div><h1>{state.ok?'ORDER RECEIVED.':'WE COULDN’T VERIFY PAYMENT.'}</h1><p>{state.ok?`Thanks for shopping Dicey Shoes.${state.email?' A receipt was sent to '+state.email+'.':''}`:'Your bag has not been cleared. If you completed payment, contact us and include the email used at checkout.'}</p><div className="successActions"><Link className="btn v" href="/shop">KEEP SHOPPING</Link><Link className="btn g" href={state.ok?'/contact':'/cart'}>{state.ok?'CONTACT SUPPORT':'BACK TO BAG'}</Link></div></div></section></main>;
}
