'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {animate,motion,useMotionValue,useTransform} from 'framer-motion';
import {useEffect,useMemo,useRef,useState} from 'react';
import {money} from '../lib/products';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const RELIABLE_IMAGE=/(static\.nike\.com|image\.goat\.com|images\.stockx\.com|(?:www\.)?stadiumgoods\.com|cdn\.shopify\.com)/i;
const PNG_LIKE=/\.png(?:\?|$)|static\.nike\.com|stadiumgoods\.com\/cdn\/shop\/files/i;
const proxied=url=>'/api/shoe-image?url='+encodeURIComponent(url);
const imageKey=url=>(url||'').replace(/^https?:\/\//,'').replace(/[?&](?:width|w|height|h|q|quality|dpr)=[^&]*/gi,'').replace(/[?&]$/,'').toLowerCase();

const getConfig=width=>{
  if(width<640)return{distanceDivisor:120,velocityDivisor:500,sensitivity:180,xMultiplier:90,yMultiplier:20,rotationMultiplier:8,scaleReduction:.06};
  if(width<1024)return{distanceDivisor:160,velocityDivisor:650,sensitivity:220,xMultiplier:130,yMultiplier:30,rotationMultiplier:10,scaleReduction:.09};
  return{distanceDivisor:200,velocityDivisor:800,sensitivity:250,xMultiplier:170,yMultiplier:40,rotationMultiplier:12,scaleReduction:.12};
};

const wrappedIndex=(value,total)=>((Math.round(value)%total)+total)%total;

function StackedCard({product,index,total,progress,config,onFail}){
  const offset=useTransform(progress,value=>{
    let difference=(index-value)%total;
    if(difference>total/2)difference-=total;
    if(difference < -total/2)difference+=total;
    return difference;
  });
  const x=useTransform(offset,value=>value*config.xMultiplier);
  const rotate=useTransform(offset,value=>Math.abs(value)<.05?0:value*config.rotationMultiplier);
  const y=useTransform(offset,value=>Math.abs(value)<.05?0:Math.abs(value)*config.yMultiplier);
  const scale=useTransform(offset,value=>1-Math.abs(value)*config.scaleReduction);
  const opacity=useTransform(offset,[-total/2,-total/2+.5,0,total/2-.5,total/2],[0,1,1,1,0]);
  const zIndex=useTransform(offset,value=>Math.round(100-Math.abs(value)*10));
  const shade=useTransform(offset,[-2,-.5,0,.5,2],[.52,.2,0,.2,.52]);
  const copyOpacity=useTransform(offset,[-.5,0,.5],[0,1,0]);

  const handleImageError=event=>{
    const image=event.currentTarget;
    if(image.dataset.fallback!=='direct'){
      image.dataset.fallback='direct';
      image.src=product.image;
      return;
    }
    onFail(product.slug);
  };

  return <motion.article className="stackedCarouselCard" style={{x,rotate,y,scale,opacity,zIndex}} aria-hidden="true">
    <img src={proxied(product.image)} alt="" draggable="false" onError={handleImageError}/>
    <motion.div className="stackedCarouselShade" style={{opacity:shade}}/>
    <div className="stackedCarouselGradient"/>
    <span className="stackedCarouselBadge">{product.brand||'Dicey'}</span>
    <motion.div className="stackedCarouselCopy" style={{opacity:copyOpacity}}>
      <b>{product.name}</b>
      <small>{product.category||'Sneakers'} · {money(Number(product.price)>0?Number(product.price):175)}</small>
    </motion.div>
  </motion.article>;
}

export default function SpotlightCarousel({products=[],excludeSlug=''}){
  const router=useRouter();
  const pool=useMemo(()=>{
    const seenSlugs=new Set(),seenImages=new Set();
    const eligible=products.filter(product=>{
      if(!product?.slug||!product?.image||product.slug===excludeSlug||product.imageMode==='dark'||BAD_IMAGE.test(product.image)||DARK_SHOE.test(product.name||''))return false;
      const key=imageKey(product.image);
      if(seenSlugs.has(product.slug)||seenImages.has(key))return false;
      seenSlugs.add(product.slug);seenImages.add(key);return true;
    });
    const reliable=eligible.filter(product=>RELIABLE_IMAGE.test(product.image));
    const other=eligible.filter(product=>!RELIABLE_IMAGE.test(product.image));
    const ordered=[...reliable,...other];
    return [...ordered.filter(product=>PNG_LIKE.test(product.image)),...ordered.filter(product=>!PNG_LIKE.test(product.image))].slice(0,7);
  },[products,excludeSlug]);

  const[failed,setFailed]=useState(()=>new Set());
  const[windowWidth,setWindowWidth]=useState(1024);
  const[activeIndex,setActiveIndex]=useState(0);
  const progress=useMotionValue(0);
  const startProgress=useRef(0);
  const dragged=useRef(false);
  const usable=useMemo(()=>pool.filter(product=>!failed.has(product.slug)),[pool,failed]);
  const config=useMemo(()=>getConfig(windowWidth),[windowWidth]);

  useEffect(()=>{
    const resize=()=>setWindowWidth(window.innerWidth);
    resize();window.addEventListener('resize',resize);
    return()=>window.removeEventListener('resize',resize);
  },[]);

  useEffect(()=>progress.on('change',value=>setActiveIndex(wrappedIndex(value,Math.max(usable.length,1)))),[progress,usable.length]);
  useEffect(()=>{progress.set(0);setActiveIndex(0)},[progress,usable.length]);

  const failProduct=slug=>setFailed(previous=>{
    if(previous.has(slug))return previous;
    const next=new Set(previous);next.add(slug);return next;
  });

  const moveTo=target=>{
    if(usable.length<2)return;
    animate(progress,target,{type:'spring',stiffness:200,damping:30,mass:1});
  };

  const handleDragStart=()=>{startProgress.current=progress.get();dragged.current=false};
  const handleDrag=(_,info)=>{
    if(Math.abs(info.offset.x)>6)dragged.current=true;
    progress.set(progress.get()-info.delta.x/config.sensitivity);
  };
  const handleDragEnd=(_,info)=>{
    const distanceShift=-info.offset.x/config.distanceDivisor;
    const velocityShift=-info.velocity.x/config.velocityDivisor;
    const shift=Math.max(-3,Math.min(3,Math.round(distanceShift+velocityShift)));
    const target=Math.round(startProgress.current)+shift;
    moveTo(target);
    if(!dragged.current&&Math.abs(info.offset.x)<7){
      const selected=usable[wrappedIndex(startProgress.current,usable.length)];
      if(selected)router.push('/product/'+selected.slug);
    }
  };

  if(!usable.length)return null;
  const active=usable[activeIndex%usable.length];

  return <section className="spot spot-carousel"><div className="w sg">
    <div className="reveal spotlight-copy"><div className="ey">Dicey spotlight</div><h2>MOVE<br/>DIFFERENT.</h2><p>Your rotation should match your ambition. Find the pair that changes how you step into the room.</p><Link className="btn v" href="/shop">SEE THE HEAT</Link></div>
    <div className="sv spotlight-stage stackedCarouselStage">
      <div className="stackedCarousel" aria-roledescription="carousel" aria-label="Featured Dicey Shoes">
        <motion.div className="stackedCarouselDrag" drag="x" dragConstraints={{left:0,right:0}} dragElastic={0} dragMomentum={false} onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd} role="link" tabIndex={0} aria-label={`Drag to explore shoes. Open ${active?.name||'featured shoe'}`} onKeyDown={event=>{
          if(event.key==='ArrowRight'){event.preventDefault();moveTo(Math.round(progress.get())+1)}
          else if(event.key==='ArrowLeft'){event.preventDefault();moveTo(Math.round(progress.get())-1)}
          else if((event.key==='Enter'||event.key===' ')&&active){event.preventDefault();router.push('/product/'+active.slug)}
        }}/>
        {usable.map((product,index)=><StackedCard key={product.slug} product={product} index={index} total={usable.length} progress={progress} config={config} onFail={failProduct}/>) }
      </div>
      <div className="stackedCarouselFooter"><div><span>{active?.brand}</span><b>{active?.name}</b></div><small>DRAG TO EXPLORE · CLICK TO SHOP</small></div>
      <div className="stackedCarouselDots">{usable.map((product,index)=><button type="button" key={product.slug} className={index===activeIndex?'active':''} onClick={()=>moveTo(index)} aria-label={'Show '+product.name}/>)}</div>
    </div>
  </div></section>;
}
