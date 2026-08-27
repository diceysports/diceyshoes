'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const RELIABLE_IMAGE=/(static\.nike\.com|image\.goat\.com|images\.stockx\.com|(?:www\.)?stadiumgoods\.com|cdn\.shopify\.com)/i;
const PNG_LIKE=/\.png(?:\?|$)|static\.nike\.com|stadiumgoods\.com\/cdn\/shop\/files/i;
const proxied=url=>'/api/shoe-image?url='+encodeURIComponent(url);

export default function SpotlightCarousel({products=[],excludeSlug=''}){
  const pool=useMemo(()=>{
    const eligible=products.filter(p=>p?.image&&!BAD_IMAGE.test(p.image)&&p.slug!==excludeSlug&&p.imageMode!=='dark'&&!DARK_SHOE.test(p.name||''));
    const reliable=eligible.filter(p=>RELIABLE_IMAGE.test(p.image));
    const source=reliable.length?reliable:eligible;
    const transparentFirst=source.filter(p=>PNG_LIKE.test(p.image));
    const rest=source.filter(p=>!PNG_LIKE.test(p.image));
    return [...transparentFirst,...rest].slice(0,24);
  },[products,excludeSlug]);

  const[failed,setFailed]=useState(()=>new Set());
  const[ready,setReady]=useState(()=>new Set());
  const[index,setIndex]=useState(0);
  const[nextIndex,setNextIndex]=useState(null);
  const[animating,setAnimating]=useState(false);

  const candidates=useMemo(()=>pool.filter(p=>!failed.has(p.slug)),[pool,failed]);
  const usable=useMemo(()=>{
    const loaded=candidates.filter(p=>ready.has(p.slug));
    return loaded.length?loaded:candidates.slice(0,1);
  },[candidates,ready]);

  const markReady=(slug)=>setReady(prev=>{
    if(prev.has(slug))return prev;
    const next=new Set(prev);next.add(slug);return next;
  });

  const failProduct=(slug)=>{
    setFailed(prev=>{if(prev.has(slug))return prev;const next=new Set(prev);next.add(slug);return next});
    setReady(prev=>{if(!prev.has(slug))return prev;const next=new Set(prev);next.delete(slug);return next});
    setAnimating(false);
    setNextIndex(null);
    setIndex(0);
  };

  const moveTo=(target)=>{
    if(usable.length<2||animating)return;
    const safe=((target%usable.length)+usable.length)%usable.length;
    if(safe===index%usable.length)return;
    setNextIndex(safe);
    setAnimating(true);
    window.setTimeout(()=>{setIndex(safe);setNextIndex(null);setAnimating(false)},820);
  };

  useEffect(()=>{
    if(usable.length<2)return;
    const id=window.setInterval(()=>moveTo((index+1)%usable.length),15000);
    return()=>window.clearInterval(id);
  },[usable.length,index,animating]);

  useEffect(()=>{
    let active=true;
    pool.forEach(p=>{
      const img=new Image();
      img.onload=()=>active&&markReady(p.slug);
      img.onerror=()=>active&&failProduct(p.slug);
      img.src=proxied(p.image);
    });
    return()=>{active=false};
  },[pool]);

  if(!usable.length)return null;
  const current=usable[index%usable.length];
  const incoming=nextIndex==null?null:usable[nextIndex%usable.length];
  const photo=(p,cls='')=><div className={'spotlight-photo '+cls} key={p.slug}><img key={p.slug} className="spotlight-asset" src={proxied(p.image)} alt={p.name} loading="eager" fetchPriority="high" draggable="false" onLoad={()=>markReady(p.slug)} onError={()=>failProduct(p.slug)}/></div>;

  return <section className="spot spot-carousel"><div className="w sg">
    <div className="reveal spotlight-copy"><div className="ey">Dicey spotlight</div><h2>MOVE<br/>DIFFERENT.</h2><p>Your rotation should match your ambition. Find the pair that changes how you step into the room.</p><Link className="btn v" href="/shop">SEE THE HEAT</Link></div>
    <div className="sv spotlight-stage">
      <div className="spotlight-swipe" aria-live="polite">
        <Link href={'/product/'+current.slug} className="spotlight-link" aria-label={'View '+current.name}>{photo(current,animating?'swoosh-out':'')}</Link>
        {incoming&&<Link href={'/product/'+incoming.slug} className="spotlight-link incoming" aria-label={'View '+incoming.name}>{photo(incoming,'swoosh-in')}</Link>}
      </div>
      <div className="spotlight-meta"><div><span>{current.brand}</span><b>{current.name}</b></div><small>SWAPS EVERY 15 SEC</small></div>
      <div className="spotlight-dots">{usable.slice(0,8).map((_,i)=><button type="button" key={i} className={i===index%usable.length?'active':''} onClick={()=>moveTo(i)} aria-label={'Show shoe '+(i+1)}></button>)}</div>
    </div>
  </div></section>;
}
