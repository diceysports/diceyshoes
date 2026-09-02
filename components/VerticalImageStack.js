'use client';

import Link from 'next/link';
import {motion} from 'framer-motion';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {money} from '../lib/products';

export default function VerticalImageStack({items=[]}){
  const images=useMemo(()=>items.filter(item=>item?.image&&item?.slug).slice(0,5),[items]);
  const[currentIndex,setCurrentIndex]=useState(0);
  const lastNavigationTime=useRef(0);
  const rootRef=useRef(null);
  const didDrag=useRef(false);
  const navigationCooldown=400;

  useEffect(()=>{if(currentIndex>=images.length)setCurrentIndex(0)},[currentIndex,images.length]);

  const navigate=useCallback(direction=>{
    if(!images.length)return;
    const now=Date.now();
    if(now-lastNavigationTime.current<navigationCooldown)return;
    lastNavigationTime.current=now;
    setCurrentIndex(previous=>direction>0?(previous===images.length-1?0:previous+1):(previous===0?images.length-1:previous-1));
  },[images.length]);

  const handleDragEnd=(_,info)=>{
    didDrag.current=Math.abs(info.offset.y)>8;
    if(info.offset.y < -50)navigate(1);
    else if(info.offset.y > 50)navigate(-1);
    window.setTimeout(()=>{didDrag.current=false},80);
  };

  useEffect(()=>{
    const handleWheel=event=>{
      const bounds=rootRef.current?.getBoundingClientRect();
      if(!bounds||bounds.bottom<=0||bounds.top>=window.innerHeight)return;
      if(Math.abs(event.deltaY)>30)navigate(event.deltaY>0?1:-1);
    };
    window.addEventListener('wheel',handleWheel,{passive:true});
    return()=>window.removeEventListener('wheel',handleWheel);
  },[navigate]);

  const getCardStyle=index=>{
    const total=images.length;let difference=index-currentIndex;
    if(difference>total/2)difference-=total;if(difference < -total/2)difference+=total;
    if(difference===0)return{y:0,scale:1,opacity:1,zIndex:5,rotateX:0};
    if(difference===-1)return{y:-160,scale:.82,opacity:.6,zIndex:4,rotateX:8};
    if(difference===-2)return{y:-280,scale:.7,opacity:.3,zIndex:3,rotateX:15};
    if(difference===1)return{y:160,scale:.82,opacity:.6,zIndex:4,rotateX:-8};
    if(difference===2)return{y:280,scale:.7,opacity:.3,zIndex:3,rotateX:-15};
    return{y:difference>0?400:-400,scale:.6,opacity:0,zIndex:0,rotateX:difference>0?-20:20};
  };

  const isVisible=index=>{
    const total=images.length;let difference=index-currentIndex;
    if(difference>total/2)difference-=total;if(difference < -total/2)difference+=total;
    return Math.abs(difference)<=2;
  };

  const current=images[currentIndex];
  if(!current)return null;

  return <div className="verticalImageStack" ref={rootRef} aria-roledescription="carousel" aria-label="Featured shoes from the Dicey catalog">
    <div className="heroBrandStamp"><span className="mark">DS</span><span>DICEY SHOES</span></div>
    <Link href="/shop" className="heroShopAll">Shop all <span>↗</span></Link>
    <div className="verticalStackAmbient" aria-hidden="true"/>
    <div className="verticalStackCards">
      {images.map((image,index)=>{
        if(!isVisible(index))return null;
        const style=getCardStyle(index);const isCurrent=index===currentIndex;
        return <motion.div key={image.slug} className={`verticalStackMotionCard${isCurrent?' current':''}`} animate={{y:style.y,scale:style.scale,opacity:style.opacity,rotateX:style.rotateX}} transition={{type:'spring',stiffness:300,damping:30,mass:1}} drag={isCurrent?'y':false} dragConstraints={{top:0,bottom:0}} dragElastic={.2} onDragStart={()=>{didDrag.current=false}} onDragEnd={handleDragEnd} onClick={()=>!isCurrent&&setCurrentIndex(index)} style={{transformStyle:'preserve-3d',zIndex:style.zIndex}} aria-hidden={!isCurrent}>
          <div className="verticalStackCard"><div className="verticalStackCardGlow" aria-hidden="true"/>{isCurrent?<Link href={`/product/${image.slug}`} onClick={event=>didDrag.current&&event.preventDefault()} aria-label={`View ${image.name}`}><img src={image.image} alt={image.name} draggable={false}/></Link>:<img src={image.image} alt="" draggable={false}/>}<div className="verticalStackCardShade" aria-hidden="true"/></div>
        </motion.div>;
      })}
    </div>

    <div className="verticalStackDots" aria-label="Choose featured shoe">{images.map((image,index)=><button key={image.slug} type="button" onClick={()=>setCurrentIndex(index)} className={index===currentIndex?'active':''} aria-label={`Show ${image.name}`} aria-current={index===currentIndex?'true':undefined}/>)}</div>

    <motion.div className="verticalStackHint" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1,duration:.6}}>
      <motion.svg animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:1.5,ease:'easeInOut'}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7-7 7 7"/></motion.svg><span>Scroll or drag</span><motion.svg animate={{y:[0,8,0]}} transition={{repeat:Infinity,duration:1.5,ease:'easeInOut'}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7"/></motion.svg>
    </motion.div>

    <div className="verticalStackCounter" aria-live="polite"><span>{String(currentIndex+1).padStart(2,'0')}</span><i aria-hidden="true"/><small>{String(images.length).padStart(2,'0')}</small></div>
    <motion.div key={current.slug} className="verticalStackProduct" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.35}}><span>{current.brand} · {current.category||'Sneakers'}</span><h1>{current.name}</h1><div><b>{money(Number(current.price)>0?Number(current.price):175)}</b><Link href={`/product/${current.slug}`}>View pair <i>↗</i></Link></div></motion.div>
  </div>;
}
