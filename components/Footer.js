import Link from 'next/link';
import NewsletterForm from './NewsletterForm';

const socials=[
  ['Instagram',process.env.NEXT_PUBLIC_INSTAGRAM_URL||'https://www.instagram.com/'],
  ['TikTok',process.env.NEXT_PUBLIC_TIKTOK_URL||'https://www.tiktok.com/'],
  ['X',process.env.NEXT_PUBLIC_X_URL||'https://x.com/']
];

export default function Footer(){return <footer className="foot">
  <div className="w footerTop"><div><div className="logo"><span className="mark">DS</span><span>DICEY SHOES</span></div><p>Curated sneakers, luxury footwear and release culture.</p></div><NewsletterForm/></div>
  <div className="w footgrid">
    <div><b>SHOP</b><Link href="/shop">All shoes</Link><Link href="/men">Men</Link><Link href="/women">Women</Link><Link href="/luxury">Luxury</Link><Link href="/releases">New releases</Link></div>
    <div><b>SUPPORT</b><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link><Link href="/search">Search</Link></div>
    <div><b>LEGAL</b><Link href="/privacy">Privacy</Link><Link href="/terms">Terms of service</Link></div>
    <div><b>FOLLOW</b>{socials.map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>
  </div>
  <div className="w copy"><span>© 2026 Dicey Shoes</span><span>Secure checkout powered by Stripe</span></div>
</footer>}
