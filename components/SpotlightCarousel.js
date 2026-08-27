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
    return [...transparentFirst,...rest].slice(0,12);
  },[products,excludeSlug]);

  const[failed,setFailed]=useState(()=>new Set());
  const[index,setIndex]=useState(0);
  const usable=useMemo(()=>pool.filter(p=>!failed.has(p.slug)),[pool,failed]);

  const failProduct=(slug)=>{
    setFailed(prev=>{
      if(prev.has(slug))return prev;
      const next=new Set(prev);
      next.add(slug);
      return next;
    });
    setIndex(0);
  };

  const moveTo=(target)=>{
    if(usable.length<2)return;
    const safe=((target%usable.length)+usable.length)%usable.length;
    setIndex(safe);
  };

  useEffect(()=>{
    if(usable.length<2)return;
    const id=window.setInterval(()=>setIndex(i=>(i+1)%usable.length),15000);
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

  return <section className="spot spot-carousel"><div className="w sg">
    <div className="reveal spotlight-copy"><div className="ey">Dicey spotlight</div><h2>MOVE<br/>DIFFERENT.</h2><p>Your rotation should match your ambition. Find the pair that changes how you step into the room.</p><Link className="btn v" href="/shop">SEE THE HEAT</Link></div>
    <div className="sv spotlight-stage">
      <div className="spotlight-swipe" aria-live="polite">
        <Link
          href={'/product/'+current.slug}
          className="spotlight-link"
          aria-label={'View '+current.name}
          style={{backgroundImage:`url("${proxyUrl}")`,backgroundRepeat:'no-repeat',backgroundPosition:'center',backgroundSize:'contain'}}
        >
          <img
            key={current.slug}
            className="spotlight-asset"
            src={proxyUrl}
            alt={current.name}
            width="560"
            height="330"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            draggable="false"
            onError={handleImageError}
          />
        </Link>
      </div>
      <div className="spotlight-meta"><div><span>{current.brand}</span><b>{current.name}</b></div><small>SWAPS EVERY 15 SEC</small></div>
      <div className="spotlight-dots">{usable.slice(0,8).map((_,i)=><button type="button" key={i} className={i===index%usable.length?'active':''} onClick={()=>moveTo(i)} aria-label={'Show shoe '+(i+1)}></button>)}</div>
    </div>
  </div></section>;
}
