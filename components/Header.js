'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useStore} from './StoreProvider';

const primary=[['/shop','Shop all'],['/search','Find a shoe'],['/community','Community'],['/releases','New releases'],['/brands','All brands']];
const categories=[['Lifestyle','Lifestyle'],['Running','Running'],['Basketball','Basketball'],['Skate','Skate'],['Luxury','Luxury']];
const featuredBrands=['HOKA','On','Salomon','ASICS','New Balance','Nike','Jordan','Adidas','Dior','Maison Margiela'];
const shop=[['/men','Men'],['/women','Women'],['/wishlist','Wishlist'],['/cart','Bag']];

export default function Header(){
  const{cart,wish}=useStore();
  const[open,setOpen]=useState(false);
  useEffect(()=>{document.body.style.overflow=open?'hidden':'';const key=e=>e.key==='Escape'&&setOpen(false);window.addEventListener('keydown',key);return()=>{document.body.style.overflow='';window.removeEventListener('keydown',key)}},[open]);
  const close=()=>setOpen(false);
  return <>
    <div className="promo">DICEY SHOES · 9,000 PAIRS · 30 BRANDS · PRICES IN USD</div>
    <nav className="nav"><div className="w ni">
      <Link href="/" className="logo"><span className="mark">DS</span><span className="brandname">DICEY SHOES</span></Link>
      <div className="links"><Link href="/shop">Shop</Link><Link href="/men">Men</Link><Link href="/women">Women</Link><Link href="/shop?category=Running">Running</Link><Link href="/shop?category=Basketball">Basketball</Link><Link href="/luxury">Luxury</Link><Link href="/brands">Brands</Link><Link href="/news">News</Link></div>
      <div className="actions"><Link href="/search" aria-label="Search">⌕</Link><Link href="/wishlist" aria-label="Wishlist">♡ {wish.length||''}</Link><Link href="/cart">Bag {cart.length||''}</Link><button className="menubtn" onClick={()=>setOpen(true)} aria-label="Open menu" aria-expanded={open}>☰</button></div>
    </div></nav>
    <div className={'drawerOverlay '+(open?'show':'')} onClick={close}/>
    <aside className={'drawer '+(open?'open':'')} aria-hidden={!open}>
      <div className="drawerTop"><Link href="/" className="logo" onClick={close}><span className="mark">DS</span><span>DICEY SHOES</span></Link><button onClick={close} className="drawerClose" aria-label="Close menu">×</button></div>
      <div className="drawerAccount"><div><span>YOUR DICEY ACCOUNT</span><b>Save pairs. Track drops. Build your rotation.</b></div><Link href="/account" onClick={close}>SIGN IN / JOIN →</Link></div>
      <div className="drawerSection"><span>DISCOVER</span>{primary.map(([href,label])=><Link href={href} onClick={close} key={href}>{label}<i>→</i></Link>)}</div>
      <div className="drawerSection"><span>SHOP BY CATEGORY</span>{categories.map(([value,label])=><Link href={'/shop?category='+encodeURIComponent(value)} onClick={close} key={value}>{label}<i>→</i></Link>)}</div>
      <div className="drawerSection"><span>FEATURED BRANDS</span>{featuredBrands.map(brand=><Link href={'/shop?brand='+encodeURIComponent(brand)} onClick={close} key={brand}>{brand}<i>→</i></Link>)}</div>
      <div className="drawerSection"><span>YOUR STORE</span>{shop.map(([href,label])=><Link href={href} onClick={close} key={href}>{label}{href==='/wishlist'&&wish.length?` (${wish.length})`:href==='/cart'&&cart.length?` (${cart.length})`:''}<i>→</i></Link>)}</div>
      <div className="drawerDrop"><div className="ey">DROP WATCH</div><b>See what is coming next.</b><p>Upcoming sneakers, launch dates, new releases and the latest culture stories.</p><Link href="/community" onClick={close}>OPEN COMMUNITY</Link></div>
    </aside>
  </>;
}
