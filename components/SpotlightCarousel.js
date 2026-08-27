'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const PRIORITY=['Fear of God','Nike','Jordan','Salomon','ASICS','HOKA','On','New Balance'];

export default function SpotlightCarousel({products=[],excludeSlug=''}){
  const pool=useMemo(()=>{
    const items=products.filter(p=>p?.image&&!BAD_IMAGE.test(p.image)&&p.slug!==excludeSlug&&p.imageMode!=='dark'&&!DARK_SHOE.test(p.name||''));
    return [...items].sort((a,b)=>{
      const ai=PRIORITY.indexOf(a.brand),bi=PRIORITY.indexOf(b.brand);
      return (ai<0?99:ai)-(bi<0?99:bi);
    }).slice(0,12);
  },[products,excludeSlug]);

  const[index,setIndex]=useState(0);
  const[nextIndex,setNextIndex]=useState(null);
  const[animating,setAnimating]=useState(false);

  const moveTo=(target)=>{
    if(pool.length<2||animating||target===index)return;
    setNextIndex(target);
    setAnimating(true);
    window.setTimeout(()=>{
      setIndex(target);
      setNextIndex(null);
      setAnimating(false);
    },780);
  };

  useEffect(()=>{
    if(pool.length<2)return;
    const id=window.setInterval(()=>moveTo((index+1)%pool.length),15000);
    return()=>window.clearInterval(id);
  },[pool.length,index,animating]);

  if(!pool.length)return null;
  const current=pool[index%pool.length];
  const incoming=nextIndex==null?null:pool[nextIndex%pool.length];

  return <section className="spot spot-carousel reference-spotlight">
    <div className="spotlight-inner">
      <div className="spotlight-copy">
        <h1>DIFFERENT.</h1>
        <p>Your rotation should match your ambition. Find the pair that changes how you step into the room.</p>
        <Link className="spotlight-cta" href="/shop">SEE THE HEAT</Link>
      </div>

      <div className="spotlight-visual">
        <div className="spotlight-swipe" aria-live="polite">
          <Link href={'/product/'+current.slug} className="spotlight-link" aria-label={'View '+current.name}>
            <img className={'spotlight-shoe '+(animating?'swoosh-out':'')} src={current.image} alt={current.name}/>
          </Link>
          {incoming&&<Link href={'/product/'+incoming.slug} className="spotlight-link incoming" aria-label={'View '+incoming.name}><img className="spotlight-shoe swoosh-in" src={incoming.image} alt={incoming.name}/></Link>}
        </div>

        <div className="spotlight-meta">
          <span>{current.brand}</span>
          <b>{current.name}</b>
          <small>SWAPS EVERY 15 SEC</small>
        </div>

        <div className="spotlight-dots">{pool.slice(0,7).map((_,i)=><button type="button" key={i} className={i===index?'active':''} onClick={()=>moveTo(i)} aria-label={'Show shoe '+(i+1)}></button>)}</div>
      </div>
    </div>
  </section>;
}
