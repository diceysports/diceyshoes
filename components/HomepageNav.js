'use client';

import Link from 'next/link';
import {Heart,Menu,Search,ShoppingBag} from 'lucide-react';
import {useStore} from './StoreProvider';

const links=[['/shop','Shop'],['/men','Men'],['/women','Women'],['/shop?category=Running','Running'],['/shop?category=Basketball','Basketball'],['/luxury','Luxury'],['/brands','Brands'],['/news','News']];

export default function HomepageNav(){
  const{cart,wish}=useStore();
  return <div className="homeNavShell">
    <nav className="homeNav" aria-label="Main navigation">
      <Link href="/" className="homeNavLogo" aria-label="Dicey Shoes home"><span className="mark">DS</span><span>DICEY SHOES</span></Link>
      <div className="homeNavLinks">{links.map(([href,label])=><Link href={href} key={href}>{label}</Link>)}</div>
      <div className="homeNavActions">
        <Link href="/search" className="homeNavIcon" aria-label="Search"><Search aria-hidden="true"/></Link>
        <Link href="/wishlist" className="homeNavIcon" aria-label="Wishlist"><Heart aria-hidden="true"/>{wish.length>0&&<span>{wish.length}</span>}</Link>
        <Link href="/cart" className="homeNavBag"><ShoppingBag aria-hidden="true"/><b>Bag</b>{cart.length>0&&<span>{cart.length}</span>}</Link>
        <Link href="/community" className="homeNavIcon homeNavMenu" aria-label="Open community and releases"><Menu aria-hidden="true"/></Link>
      </div>
    </nav>
  </div>;
}
