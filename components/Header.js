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
    <style jsx global>{`
      .promo{padding:9px 12px;font-size:11px;letter-spacing:.16em}
      .nav{height:86px}
      .ni{gap:22px}
      .logo{gap:12px;font-size:13px;letter-spacing:.16em;white-space:nowrap}
      .mark{width:48px;height:48px;font-size:20px}
      .links{gap:23px;font-size:11px}
      .actions{display:flex;align-items:center;gap:10px;font-size:11px}
      .actions>a:not(.searchAction){min-height:44px;display:inline-flex;align-items:center;padding:0 8px;white-space:nowrap}
      .searchAction{width:44px;height:44px;display:inline-grid;place-items:center;border:1px solid #ffffff24;border-radius:50%;background:#ffffff08;transition:background .2s,border-color .2s,transform .2s}
      .searchAction:hover{background:#ffffff14;border-color:#ffffff55;transform:scale(1.04)}
      .searchAction svg{width:21px;height:21px;display:block;stroke:currentColor}
      .menubtn{min-width:44px;min-height:44px;display:grid;place-items:center;font-size:24px;line-height:1;padding:0}
      @media(max-width:1100px){
        .nav{height:80px}.links{gap:15px;font-size:10px}.logo{font-size:12px}.mark{width:45px;height:45px}.actions{gap:6px}
      }
      @media(max-width:900px){
        .nav{height:74px}.promo{font-size:9px;padding:8px 10px}.mark{width:43px;height:43px}.searchAction{width:42px;height:42px}.actions>a:not(.searchAction){min-height:42px;padding:0 5px}.menubtn{min-width:42px;min-height:42px}
      }
    `}</style>
    <div className="promo">DICEY SHOES · 9,000 PAIRS · 30 BRANDS · PRICES IN USD</div>
    <nav className="nav"><div className="w ni">
      <Link href="/" className="logo"><span className="mark">DS</span><span className="brandname">DICEY SHOES</span></Link>
      <div className="links"><Link href="/shop">Shop</Link><Link href="/men">Men</Link><Link href="/women">Women</Link><Link href="/shop?category=Running">Running</Link><Link href="/shop?category=Basketball">Basketball</Link><Link href="/luxury">Luxury</Link><Link href="/brands">Brands</Link><Link href="/news">News</Link></div>
      <div className="actions"><Link className="searchAction" href="/search" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" strokeWidth="2"/><path d="M16 16l4 4" strokeWidth="2" strokeLinecap="round"/></svg></Link><Link href="/wishlist" aria-label="Wishlist">♡ {wish.length||''}</Link><Link href="/cart">Bag {cart.length||''}</Link><button className="menubtn" onClick={()=>setOpen(true)} aria-label="Open menu" aria-expanded={open}>☰</button></div>
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
