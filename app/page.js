'use client';
// Reference homepage: spotlight carousel is the first visual and owns the hero treatment.
import {useEffect,useState} from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import SpotlightCarousel from '../components/SpotlightCarousel';
import LiveNews from '../components/LiveNews';
import useLiveReleases from '../components/useLiveReleases';
import {products as fallback,money} from '../lib/products';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const valid=p=>p?.image&&!BAD_IMAGE.test(p.image);

export default function Home(){
  const[products,setProducts]=useState(fallback.filter(valid));
  const[shuffled,setShuffled]=useState(fallback.filter(valid));
  const releases=useLiveReleases();

  useEffect(()=>{
    fetch('/api/catalog')
      .then(r=>r.ok?r.json():null)
      .then(d=>d?.products?.length&&setProducts(d.products.filter(valid)))
      .catch(()=>{});
  },[]);

  useEffect(()=>{setShuffled([...products].sort(()=>Math.random()-.5))},[products]);

  useEffect(()=>{
    const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(e=>io.observe(e));
    return()=>io.disconnect();
  },[products]);

  return <main className="reference-home">
    <SpotlightCarousel products={shuffled}/>

    <section className="reference-categories">
      <div className="w">
        <div className="reference-section-head reveal">
          <div className="k">SHOP YOUR LANE</div>
          <h2>EXPLORE EVERY CATEGORY</h2>
        </div>
        <div className="cats reveal blended-tiles reference-category-grid">
          <Link className="cat tile-lime" href="/shop?category=Lifestyle">Lifestyle →</Link>
          <Link className="cat tile-orange" href="/shop?category=Running">Running →</Link>
          <Link className="cat tile-pink" href="/shop?category=Basketball">Basketball →</Link>
          <Link className="cat tile-dark" href="/shop?category=Skate">Skate →</Link>
          <Link className="cat tile-blue" href="/shop?category=Luxury">Luxury →</Link>
        </div>
      </div>
    </section>

    <section className="reference-rotation">
      <div className="w">
        <div className="st reveal">
          <div><div className="k">IN ROTATION</div><h2>SHOP THE HEAT</h2></div>
          <Link href="/shop">Shop all →</Link>
        </div>
        <div className="grid reveal">{shuffled.slice(0,16).map(p=><ProductCard p={p} key={p.slug}/>)}</div>
      </div>
    </section>

    <section className="blended-section alt reference-brands">
      <div className="w">
        <div className="st reveal">
          <div><div className="k">EXPANDED ROTATION</div><h2>BRANDS TO KNOW</h2></div>
          <Link href="/brands">All brands →</Link>
        </div>
        <div className="cats reveal blended-tiles">
          <Link className="cat tile-lime" href="/shop?brand=HOKA">HOKA →</Link>
          <Link className="cat tile-orange" href="/shop?brand=On">On →</Link>
          <Link className="cat tile-pink" href="/shop?brand=Salomon">Salomon →</Link>
          <Link className="cat tile-dark" href="/shop?brand=ASICS">ASICS →</Link>
          <Link className="cat tile-blue" href="/shop?brand=Maison%20Margiela">Maison Margiela →</Link>
          <Link className="cat tile-purple" href="/shop?brand=Dior">Dior →</Link>
        </div>
      </div>
    </section>

    {releases.length>0&&<section className="relsec"><div className="w"><div className="st reveal"><div><div className="k">Drop watch</div><h2>RELEASE RADAR</h2></div><Link href="/releases">All releases →</Link></div><a className="rad reveal" href={releases[0].url} target="_blank" rel="noreferrer"><div className="rv releasehero" style={{backgroundImage:`url(${releases[0].image})`}}></div><div className="rc"><div className="ey">{releases[0].brand} · {releases[0].date}</div><h3>{releases[0].name}</h3><p>Release information from {releases[0].source}.</p><b>{money(releases[0].price)}</b><div className="readmore">View release details ↗</div></div></a><div className="rl reveal">{releases.slice(1,5).map(r=><a className="r" key={r.date+r.name} href={r.url} target="_blank" rel="noreferrer"><img className="rthumb" src={r.image} alt={r.name} onError={e=>{e.currentTarget.style.visibility='hidden'}}/><div className="d">{r.date.toUpperCase()}</div><b>{r.name}</b><small>{money(r.price)} · {r.brand}</small></a>)}</div></div></section>}

    <section className="reference-news"><div className="w"><div className="st reveal"><div><div className="k">Culture feed</div><h2>FROM THE SNEAKER WORLD</h2></div><Link href="/news">All news →</Link></div><div className="reveal"><LiveNews limit={3}/></div></div></section>
  </main>;
}
