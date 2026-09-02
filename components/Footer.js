'use client';

import Link from 'next/link';
import {motion,useReducedMotion} from 'framer-motion';
import {ArrowUpRight,Facebook,Instagram,Music2,Youtube} from 'lucide-react';
import NewsletterForm from './NewsletterForm';

const footerLinks=[
  {label:'Shop',links:[{title:'Shop all',href:'/shop'},{title:'Men',href:'/men'},{title:'Women',href:'/women'},{title:'Luxury',href:'/luxury'}]},
  {label:'Discover',links:[{title:'New releases',href:'/releases'},{title:'Community',href:'/community'},{title:'Sneaker news',href:'/news'},{title:'All brands',href:'/brands'}]},
  {label:'Support',links:[{title:'Contact',href:'/contact'},{title:'Shipping',href:'/shipping'},{title:'Returns',href:'/returns'},{title:'Privacy',href:'/privacy'},{title:'Terms',href:'/terms'}]},
  {label:'Social',links:[
    {title:'Instagram',href:process.env.NEXT_PUBLIC_INSTAGRAM_URL||'https://www.instagram.com/',icon:Instagram},
    {title:'Facebook',href:process.env.NEXT_PUBLIC_FACEBOOK_URL||'https://www.facebook.com/',icon:Facebook},
    {title:'TikTok',href:process.env.NEXT_PUBLIC_TIKTOK_URL||'https://www.tiktok.com/',icon:Music2},
    {title:'YouTube',href:process.env.NEXT_PUBLIC_YOUTUBE_URL||'https://www.youtube.com/',icon:Youtube},
  ]},
];

function AnimatedContainer({children,delay=0,className=''}){
  const shouldReduceMotion=useReducedMotion();
  if(shouldReduceMotion)return <div className={className}>{children}</div>;
  return <motion.div initial={{opacity:0,y:22,filter:'blur(8px)'}} whileInView={{opacity:1,y:0,filter:'blur(0px)'}} viewport={{once:true,amount:.2}} transition={{duration:.75,delay,ease:[.22,1,.36,1]}} className={className}>{children}</motion.div>;
}

export default function Footer(){
  return <div className="diceyFooterFrame"><footer className="diceyFooter">
    <div className="diceyFooterGlow" aria-hidden="true"/><div className="diceyFooterLine" aria-hidden="true"/><div className="diceyFooterGrid" aria-hidden="true"/>
    <div className="diceyFooterContent">
      <div className="diceyFooterMain">
        <AnimatedContainer className="diceyFooterBrand">
          <div>
            <Link href="/" className="diceyFooterLogo" aria-label="Dicey Shoes home"><span className="mark">DS</span><span>DICEY SHOES</span></Link>
            <p>Curated sneakers, performance runners and luxury footwear—built for people who move differently.</p>
            <NewsletterForm/>
          </div>
          <Link href="/shop" className="diceyFooterCta">Shop the collection <ArrowUpRight aria-hidden="true"/></Link>
        </AnimatedContainer>
        <div className="diceyFooterLinks">
          {footerLinks.map((section,sectionIndex)=><AnimatedContainer key={section.label} delay={.08+sectionIndex*.08}>
            <h3>{section.label}</h3><ul>{section.links.map(link=>{
              const Icon=link.icon;const external=link.href.startsWith('http');const content=<>{Icon&&<Icon aria-hidden="true"/>}<span>{link.title}</span></>;
              return <li key={link.title}>{external?<a href={link.href} target="_blank" rel="noreferrer">{content}</a>:<Link href={link.href}>{content}</Link>}</li>;
            })}</ul>
          </AnimatedContainer>)}
        </div>
      </div>
      <AnimatedContainer delay={.35}><div className="diceyFooterBottom"><p>© {new Date().getFullYear()} Dicey Shoes. All rights reserved.</p><div><span className="statusDot"><i/><b/></span><span>Store online · Secure checkout</span></div></div></AnimatedContainer>
    </div>
  </footer></div>;
}
