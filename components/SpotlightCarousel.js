'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const RELIABLE_IMAGE=/(static\.nike\.com|image\.goat\.com|images\.stockx\.com|(?:www\.)?stadiumgoods\.com|cdn\.shopify\.com)/i;
const PNG_LIKE=/\.png(?:\?|$)|static\.nike\.com|stadiumgoods\.com\/cdn\/shop\/files/i;
const proxied=url=>'/api/shoe-image?url='+encodeURIComponent(url);
const imageKey=url=>(url||'').replace(/^https?:\/\//,'').replace(/[?&](?:width|w|height|h|q|quality|dpr)=[^&]*/gi,'').replace(/[?&]$/,'').toLowerCase();

export default function SpotlightCarousel({products=[],excludeSlug=''}){
  const pool=useMemo(()=>{
    const seenSlugs=new Set();
    const seenImages=new Set();
    const eligible=products.filter(p=>{
      if(!p?.slug||!p?.image||p.slug===excludeSlug||p.imageMode==='dark'||BAD_IMAGE.test(p.image)||DARK_SHOE.test(p.name||''))return false;
      const key=imageKey(p.image);
      if(seenSlugs.has(p.slug)||seenImages.has(key))return false;
      seenSlugs.add(p.slug);
      seenImages.add(key);
      return true;
    });
    const reliable=eligible.filter(p=>RELIABLE_IMAGE.test(p.image));
    const other=eligible.filter(p=>!RELIABLE_IMAGE.test(p.image));
    const ordered=[...reliable,...other];
    const transparentFirst=ordered.filter(p=>PNG_LIKE.test(p.image));
    const rest=ordered.filter(p=>!PNG_LIKE.test(p.image));
    return [...transparentFirst,...rest].slice(0,12);
  },[products,excludeSlug]);

  const[failed,setFailed]=useState(()=>new Set());
  const[index,setIndex]=useState(0);
  const touchStart=useRef(null);
  const usable=useMemo(()=>pool.filter(p=>!failed.has(p.slug)),[pool,failed]);

  useEffect(()=>{
    setIndex(i=>usable.length?i%usable.length:0);
  },[usable.length]);

  const failProduct=(slug)=>{
    setFailed(prev=>{
      if(prev.has(slug))return prev;
      const next=new Set(prev);
      next.add(slug);
      return next;
    });
  };

  const moveTo=(target)=>{
    if(usable.length<2)return;
    setIndex(((target%usable.length)+usable.length)%usable.length);
  };

  useEffect(()=>{
    if(usable.length<2)return;
    const id=window.setInterval(()=>setIndex(i=>(i+1)%usable.length),7000);
    return()=>window.clearInterval(id);
  },[usable.length]);

  if(!usable.length)return null;
  const current=usable[index%usable.length];
  const proxyUrl=proxied(current.image);

  const handleImageError=(e)=>{
    const img=e.currentTarget;
    if(img.dataset.fallback!=='direct'){
      img.dataset.fallback='direct';
      img.src=current.image;
      return;
    }
    failProduct(current.slug);
  };

  const onTouchStart=e=>{touchStart.current=e.touches?.[0]?.clientX??null};
  const onTouchEnd=e=>{
    if(touchStart.current==null)return;
    const end=e.changedTouches?.[0]?.clientX??touchStart.current;
    const delta=end-touchStart.current;
    touchStart.current=null;
    if(Math.abs(delta)>45)moveTo(index+(delta<0?1:-1));
  };

  return <section className="spot spot-carousel"><div className="w sg">
    <div className="reveal spotlight-copy"><div className="ey">Dicey spotlight</div><h2>MOVE<br/>DIFFERENT.</h2><p>Your rotation should match your ambition. Find the pair that changes how you step into the room.</p><Link className="btn v" href="/shop">SEE THE HEAT</Link></div>
    <div className="sv spotlight-stage">
      <div className="spotlight-swipe" aria-live="polite" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Link href={'/product/'+current.slug} className="spotlight-link" aria-label={'View '+current.name}>
          <img key={current.slug} className="spotlight-asset" src={proxyUrl} alt={current.name} width="560" height="330" loading="eager" fetchPriority="high" decoding="async" draggable="false" onError={handleImageError}/>
        </Link>
      </div>
      <div className="spotlight-meta"><div><span>{current.brand}</span><b>{current.name}</b></div><small>SWAPS EVERY 7 SEC</small></div>
      <div className="spotlight-dots">{usable.slice(0,8).map((p,i)=><button type="button" key={p.slug} className={i===index%usable.length?'active':''} onClick={()=>moveTo(i)} aria-label={'Show '+p.name}></button>)}</div>
    </div>
  </div></section>;
}
