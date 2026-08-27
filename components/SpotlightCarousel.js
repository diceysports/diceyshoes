'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const PNG_LIKE=/\.png(?:\?|$)|static\.nike\.com|stadiumgoods\.com\/cdn\/shop\/files/i;
const proxied=url=>'/api/shoe-image?url='+encodeURIComponent(url);

export default function SpotlightCarousel({products=[],excludeSlug=''}){
  const pool=useMemo(()=>{
    const eligible=products.filter(p=>p?.image&&!BAD_IMAGE.test(p.image)&&p.slug!==excludeSlug&&p.imageMode!=='dark'&&!DARK_SHOE.test(p.name||''));
    const transparentFirst=eligible.filter(p=>PNG_LIKE.test(p.image));
    const rest=eligible.filter(p=>!PNG_LIKE.test(p.image));
    return [...transparentFirst,...rest].slice(0,18);
  },[products,excludeSlug]);
  const[index,setIndex]=useState(0);
  const[nextIndex,setNextIndex]=useState(null);
  const[animating,setAnimating]=useState(false);

  const moveTo=(target)=>{
    if(pool.length<2||animating||target===index)return;
    setNextIndex(target);setAnimating(true);
    window.setTimeout(()=>{setIndex(target);setNextIndex(null);setAnimating(false)},820);
  };

  useEffect(()=>{
    if(pool.length<2)return;
    const id=window.setInterval(()=>moveTo((index+1)%pool.length),15000);
    return()=>window.clearInterval(id);
  },[pool.length,index,animating]);

  useEffect(()=>{pool.slice(0,8).forEach(p=>{const img=new Image();img.src=proxied(p.image)})},[pool]);

  if(!pool.length)return null;
  const current=pool[index%pool.length];
  const incoming=nextIndex==null?null:pool[nextIndex%pool.length];
  const photo=(p,cls='')=><div className={'spotlight-photo '+cls} role="img" aria-label={p.name} style={{backgroundImage:`url("${proxied(p.image)}")`}}/>;

  return <section className="spot spot-carousel"><div className="w sg">
    <div className="reveal spotlight-copy"><div className="ey">Dicey spotlight</div><h2>MOVE<br/>DIFFERENT.</h2><p>Your rotation should match your ambition. Find the pair that changes how you step into the room.</p><Link className="btn v" href="/shop">SEE THE HEAT</Link></div>
    <div className="sv spotlight-stage">
      <div className="spotlight-swipe" aria-live="polite">
        <Link href={'/product/'+current.slug} className="spotlight-link" aria-label={'View '+current.name}>{photo(current,animating?'swoosh-out':'')}</Link>
        {incoming&&<Link href={'/product/'+incoming.slug} className="spotlight-link incoming" aria-label={'View '+incoming.name}>{photo(incoming,'swoosh-in')}</Link>}
      </div>
      <div className="spotlight-meta"><div><span>{current.brand}</span><b>{current.name}</b></div><small>SWAPS EVERY 15 SEC</small></div>
      <div className="spotlight-dots">{pool.slice(0,8).map((_,i)=><button type="button" key={i} className={i===index?'active':''} onClick={()=>moveTo(i)} aria-label={'Show shoe '+(i+1)}></button>)}</div>
    </div>
  </div></section>;
}
