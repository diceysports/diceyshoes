'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import SpotlightCarousel from '../components/SpotlightCarousel';
import LiveNews from '../components/LiveNews';
import VerticalImageStack from '../components/VerticalImageStack';
import HomepageNav from '../components/HomepageNav';
import useLiveReleases from '../components/useLiveReleases';
import {products as fallback,money} from '../lib/products';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const valid=product=>product?.image&&!BAD_IMAGE.test(product.image);
const ticker=['Nike','Jordan','Adidas','New Balance','ASICS','HOKA','On','Salomon','Saucony','Dior','Maison Margiela','BAPE','Off-White','Fear of God','Gucci','Louis Vuitton','Balenciaga'];

const randomSpotlight=(items,count=12)=>{
  const seen=new Set();
  const eligible=items.filter(product=>{
    if(!valid(product)||product.referenceOnly||product.imageMode==='dark'||DARK_SHOE.test(product.name||''))return false;
    const key=(product.image||'').replace(/([?&])(w|h|width|height)=\d+/gi,'$1').replace(/[?&]+$/,'');
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
  for(let index=eligible.length-1;index>0;index--){
    const randomIndex=Math.floor(Math.random()*(index+1));
    [eligible[index],eligible[randomIndex]]=[eligible[randomIndex],eligible[index]];
  }
  return eligible.slice(0,count);
};

export default function Home(){
  const[products,setProducts]=useState(fallback.filter(valid));
  const[shuffled,setShuffled]=useState(fallback.filter(valid));
  const[spotlight,setSpotlight]=useState(()=>randomSpotlight(fallback));
  const releases=useLiveReleases();

  useEffect(()=>{fetch('/api/catalog').then(response=>response.ok?response.json():null).then(data=>data?.products?.length&&setProducts(data.products.filter(valid))).catch(()=>{})},[]);
  useEffect(()=>{setShuffled([...products].sort(()=>Math.random()-.5));setSpotlight(randomSpotlight(products))},[products]);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('in')),{threshold:.12});document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));return()=>observer.disconnect()},[products]);

  const heroShoes=products.filter(product=>valid(product)&&!product.referenceOnly).slice(0,5);

  return <main>
    <VerticalImageStack items={heroShoes}/>
    <HomepageNav/>
    <div className="ticker" aria-label="Featured brands"><div className="track">{[0,1].map(group=><div className="tickerGroup" key={group} aria-hidden={group===1}>{ticker.map((brand,index)=><b key={`${group}-${index}`}>{brand}</b>)}</div>)}</div></div>

    <section><div className="w">
      <div className="st reveal"><div><div className="k">Trending now</div><h2>HEAT IN ROTATION</h2></div><Link href="/shop">Shop all →</Link></div>
      <div className="grid reveal">{shuffled.slice(0,16).map(product=><ProductCard p={product} key={product.slug}/>)}</div>
    </div></section>

    <SpotlightCarousel products={spotlight} excludeSlug=""/>

    <section className="blended-section"><div className="w">
      <div className="st reveal"><div><div className="k">Shop your lane</div><h2>EXPLORE EVERY CATEGORY</h2></div></div>
      <div className="cats reveal blended-tiles"><Link className="cat tile-lime" href="/shop?category=Lifestyle">Lifestyle →</Link><Link className="cat tile-orange" href="/shop?category=Running">Running →</Link><Link className="cat tile-pink" href="/shop?category=Basketball">Basketball →</Link><Link className="cat tile-dark" href="/shop?category=Skate">Skate →</Link><Link className="cat tile-blue" href="/shop?category=Luxury">Luxury →</Link></div>
    </div></section>

    <section className="blended-section alt"><div className="w">
      <div className="st reveal"><div><div className="k">Expanded rotation</div><h2>NEW BRANDS, DEEP CATALOGS</h2></div><Link href="/brands">All 30 brands →</Link></div>
      <div className="cats reveal blended-tiles"><Link className="cat tile-lime" href="/shop?brand=HOKA">HOKA →</Link><Link className="cat tile-orange" href="/shop?brand=On">On →</Link><Link className="cat tile-pink" href="/shop?brand=Salomon">Salomon →</Link><Link className="cat tile-dark" href="/shop?brand=ASICS">ASICS →</Link><Link className="cat tile-blue" href="/shop?brand=Maison%20Margiela">Maison Margiela →</Link><Link className="cat tile-purple" href="/shop?brand=Dior">Dior →</Link></div>
    </div></section>

    {releases.length>0&&<section className="relsec"><div className="w">
      <div className="st reveal"><div><div className="k">Drop watch</div><h2>RELEASE RADAR</h2></div><Link href="/releases">All releases →</Link></div>
      <a className="rad reveal" href={releases[0].url} target="_blank" rel="noreferrer"><div className="rv releasehero" style={{backgroundImage:`url(${releases[0].image})`}}/><div className="rc"><div className="ey">{releases[0].brand} · {releases[0].date}</div><h3>{releases[0].name}</h3><p>Release information from {releases[0].source}.</p><b>{money(releases[0].price)}</b><div className="readmore">View release details ↗</div></div></a>
      <div className="rl reveal">{releases.slice(1,5).map(release=><a className="r" key={release.date+release.name} href={release.url} target="_blank" rel="noreferrer"><img className="rthumb" src={release.image} alt={release.name} onError={event=>{event.currentTarget.style.visibility='hidden'}}/><div className="d">{release.date.toUpperCase()}</div><b>{release.name}</b><small>{money(release.price)} · {release.brand}</small></a>)}</div>
    </div></section>}

    <section><div className="w"><div className="st reveal"><div><div className="k">Culture feed</div><h2>FROM THE SNEAKER WORLD</h2></div><Link href="/news">All news →</Link></div><div className="reveal"><LiveNews limit={3}/></div></div></section>
  </main>;
}
