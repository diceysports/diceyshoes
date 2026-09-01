'use client';

import Image from 'next/image';
import {motion} from 'framer-motion';
import {useCallback,useEffect,useRef,useState} from 'react';

const images=[
  {
    id:1,
    src:'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/luxury-black-sneaker-with-red-sole-on-grey-backgro-hj40sZT8MUUSeLz18VN7EjhcnV0kSD.jpg',
    alt:'Black sneaker with a red sole',
  },
  {
    id:2,
    src:'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/white-minimalist-sneaker-on-light-background-xQxkXgGrSrAe6pvLPNC6yrh20Atqoa.jpg',
    alt:'White minimalist sneaker',
  },
  {
    id:3,
    src:'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/navy-blue-running-shoe-on-gradient-background-E1spqSK9gDvh3gTNwASkttEg76nZgm.jpg',
    alt:'Navy blue running shoe',
  },
  {
    id:4,
    src:'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/red-athletic-sneaker-on-dark-background-skamDX1NbCRW4jvHxijkfmCnHGr6NJ.jpg',
    alt:'Red athletic sneaker',
  },
  {
    id:5,
    src:'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/green-forest-hiking-boot-on-natural-background-T41PNLzI60G2u6rFIRxeCbKT6RWKOH.jpg',
    alt:'Green hiking boot',
  },
];

export default function VerticalImageStack(){
  const[currentIndex,setCurrentIndex]=useState(0);
  const lastNavigationTime=useRef(0);
  const rootRef=useRef(null);
  const navigationCooldown=400;

  const navigate=useCallback(direction=>{
    const now=Date.now();
    if(now-lastNavigationTime.current<navigationCooldown)return;
    lastNavigationTime.current=now;
    setCurrentIndex(previous=>direction>0
      ?(previous===images.length-1?0:previous+1)
      :(previous===0?images.length-1:previous-1));
  },[]);

  const handleDragEnd=(_,info)=>{
    const threshold=50;
    if(info.offset.y < -threshold)navigate(1);
    else if(info.offset.y > threshold)navigate(-1);
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
    const total=images.length;
    let difference=index-currentIndex;
    if(difference>total/2)difference-=total;
    if(difference < -total/2)difference+=total;

    if(difference===0)return{y:0,scale:1,opacity:1,zIndex:5,rotateX:0};
    if(difference===-1)return{y:-160,scale:.82,opacity:.6,zIndex:4,rotateX:8};
    if(difference===-2)return{y:-280,scale:.7,opacity:.3,zIndex:3,rotateX:15};
    if(difference===1)return{y:160,scale:.82,opacity:.6,zIndex:4,rotateX:-8};
    if(difference===2)return{y:280,scale:.7,opacity:.3,zIndex:3,rotateX:-15};
    return{y:difference>0?400:-400,scale:.6,opacity:0,zIndex:0,rotateX:difference>0?-20:20};
  };

  const isVisible=index=>{
    const total=images.length;
    let difference=index-currentIndex;
    if(difference>total/2)difference-=total;
    if(difference < -total/2)difference+=total;
    return Math.abs(difference)<=2;
  };

  return <div className="verticalImageStack" ref={rootRef} aria-roledescription="carousel" aria-label="Featured Dicey Shoes">
    <div className="verticalStackAmbient" aria-hidden="true"/>
    <div className="verticalStackCards">
      {images.map((image,index)=>{
        if(!isVisible(index))return null;
        const style=getCardStyle(index);
        const isCurrent=index===currentIndex;
        return <motion.div
          key={image.id}
          className={`verticalStackMotionCard${isCurrent?' current':''}`}
          animate={{y:style.y,scale:style.scale,opacity:style.opacity,rotateX:style.rotateX}}
          transition={{type:'spring',stiffness:300,damping:30,mass:1}}
          drag={isCurrent?'y':false}
          dragConstraints={{top:0,bottom:0}}
          dragElastic={.2}
          onDragEnd={handleDragEnd}
          onClick={()=>!isCurrent&&setCurrentIndex(index)}
          style={{transformStyle:'preserve-3d',zIndex:style.zIndex}}
          aria-hidden={!isCurrent}
        >
          <div className="verticalStackCard">
            <div className="verticalStackCardGlow" aria-hidden="true"/>
            <Image src={image.src} alt={image.alt} fill sizes="(max-width: 560px) 240px, 280px" className="verticalStackImage" draggable={false} priority={isCurrent}/>
            <div className="verticalStackCardShade" aria-hidden="true"/>
          </div>
        </motion.div>;
      })}
    </div>

    <div className="verticalStackDots" aria-label="Choose featured shoe">
      {images.map((image,index)=><button
        key={image.id}
        type="button"
        onClick={()=>setCurrentIndex(index)}
        className={index===currentIndex?'active':''}
        aria-label={`Show image ${index+1}: ${image.alt}`}
        aria-current={index===currentIndex?'true':undefined}
      />)}
    </div>

    <motion.div className="verticalStackHint" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1,duration:.6}}>
      <motion.svg animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:1.5,ease:'easeInOut'}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7-7 7 7"/></motion.svg>
      <span>Scroll or drag</span>
      <motion.svg animate={{y:[0,8,0]}} transition={{repeat:Infinity,duration:1.5,ease:'easeInOut'}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7"/></motion.svg>
    </motion.div>

    <div className="verticalStackCounter" aria-live="polite">
      <span>{String(currentIndex+1).padStart(2,'0')}</span>
      <i aria-hidden="true"/>
      <small>{String(images.length).padStart(2,'0')}</small>
    </div>
  </div>;
}
