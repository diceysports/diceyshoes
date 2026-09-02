'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {useStore} from './StoreProvider';

const primary=[['/shop','Shop all'],['/search','Find a shoe'],['/community','Community'],['/releases','New releases'],['/brands','All brands']];
const categories=[['Lifestyle','Lifestyle'],['Running','Running'],['Basketball','Basketball'],['Skate','Skate'],['Luxury','Luxury']];
const featuredBrands=['HOKA','On','Salomon','ASICS','New Balance','Nike','Jordan','Adidas','Dior','Maison Margiela'];
const shop=[['/men','Men'],['/women','Women'],['/wishlist','Wishlist'],['/cart','Bag']];

export default function Header(){
  const pathname=usePathname();
  const{cart,wish}=useStore();
  const[open,setOpen]=useState(false);
  useEffect(()=>{document.body.style.overflow=open?'hidden':'';const key=e=>e.key==='Escape'&&setOpen(false);window.addEventListener('keydown',key);return()=>{document.body.style.overflow='';window.removeEventListener('keydown',key)}},[open]);
  const close=()=>setOpen(false);
  if(pathname==='/')return null;
  return <>
    <style jsx global>{`
      .promo{padding:9px 12px;font-size:11px;letter-spacing:.16em}
      .nav{height:90px}
      .ni{gap:22px}
      .logo{gap:12px;font-size:13px;letter-spacing:.16em;white-space:nowrap}
      .mark{width:50px;height:50px;font-size:20px}
      .links{gap:23px;font-size:11px}
      .actions{display:flex;align-items:center;gap:12px;font-size:12px}
      .headerIconAction{width:56px;height:56px;position:relative;display:inline-grid;place-items:center;border:1px solid #ffffff30;border-radius:50%;background:#ffffff0b;color:#fff;transition:background .2s,border-color .2s,transform .2s;flex:0 0 56px}
      .headerIconAction:hover{background:#ffffff18;border-color:#ffffff66;transform:scale(1.05)}
      .headerIconAction svg{width:28px;height:28px;display:block;stroke:currentColor}
      .headerIconAction.favoriteAction svg{width:29px;height:29px}
      .actionBadge{position:absolute;right:-3px;top:-3px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--v);color:#0a0b0d;display:grid;place-items:center;font-size:10px;font-weight:900;line-height:1;border:2px solid #0a0b0d}
      .bagAction{min-height:50px;display:inline-flex;align-items:center;padding:0 10px;white-space:nowrap;font-size:12px;font-weight:900}
      .menubtn{min-width:50px;min-height:50px;display:grid;place-items:center;font-size:26px;line-height:1;padding:0}
      @media(max-width:1100px){
        .nav{height:84px}.links{gap:15px;font-size:10px}.logo{font-size:12px}.mark{width:46px;height:46px}.actions{gap:8px}.headerIconAction{width:52px;height:52px;flex-basis:52px}.headerIconAction svg{width:26px;height:26px}
      }
      @media(max-width:900px){
        .nav{height:76px}.promo{font-size:9px;padding:8px 10px}.mark{width:43px;height:43px}.headerIconAction{width:48px;height:48px;flex-basis:48px}.headerIconAction svg{width:24px;height:24px}.bagAction{min-height:46px;padding:0 6px}.menubtn{min-width:46px;min-height:46px}
      }
    `}</style>
    <div className="promo">DICEY SHOES · 9,000 PAIRS · 30 BRANDS · PRICES IN USD</div>
    <nav className="nav"><div className="w ni">
      <Link href="/" className="logo"><span className="mark">DS</span><span className="brandname">DICEY SHOES</span></Link>
      <div className="links"><Link href="/shop">Shop</Link><Link href="/men">Men</Link><Link href="/women">Women</Link><Link href="/shop?category=Running">Running</Link><Link href="/shop?category=Basketball">Basketball</Link><Link href="/luxury">Luxury</Link><Link href="/brands">Brands</Link><Link href="/news">News</Link></div>
      <div className="actions"><Link className="headerIconAction searchAction" href="/search" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" strokeWidth="2.2"/><path d="M15.8 15.8 20 20" strokeWidth="2.2" strokeLinecap="round"/></svg></Link><Link className="headerIconAction favoriteAction" href="/wishlist" aria-label="Wishlist"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 4.9c-2.2-2.2-5.8-2.2-8 0L12 5.7l-.8-.8c-2.2-2.2-5.8-2.2-8 0s-2.2 5.8 0 8L12 21l8.8-8.1c2.2-2.2 2.2-5.8 0-8Z" strokeWidth="2" strokeLinejoin="round"/></svg>{wish.length>0&&<span className="actionBadge">{wish.length}</span>}</Link><Link className="bagAction" href="/cart">Bag {cart.length||''}</Link><button className="menubtn" onClick={()=>setOpen(true)} aria-label="Open menu" aria-expanded={open}>☰</button></div>
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
