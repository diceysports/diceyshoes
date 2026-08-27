'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {products as fallback,money} from '../../../lib/products';
import ProductCard from '../../../components/ProductCard';
import {useStore} from '../../../components/StoreProvider';

const BAD_IMAGE=/(ebayimg\.com|flightclub\.com|flightclub|\/TEMPLATE\/|placeholder|logo[-_.])/i;
const DARK_SHOE=/\b(black|onyx|triple black|black cat|anthracite|dark|noir|shadow)\b/i;
const MEN_SIZES=['6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','12.5','13','14','15'];
const WOMEN_SIZES=['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12'];
const UNISEX_SIZES=['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','12.5','13','14','15'];
const proxied=url=>'/api/shoe-image?url='+encodeURIComponent(url);

function sizesFor(p){
  if(Array.isArray(p?.sizes)&&p.sizes.length)return p.sizes;
  return p?.gender==='Women'?WOMEN_SIZES:p?.gender==='Men'?MEN_SIZES:UNISEX_SIZES;
}

export default function ProductPage(){
  const{slug}=useParams();
  const liveSlug=slug?.startsWith('db-')||slug?.startsWith('kicks-')||slug?.startsWith('curated-');
  const[products,setProducts]=useState(fallback.filter(x=>x.image&&!BAD_IMAGE.test(x.image)));
  const[loading,setLoading]=useState(liveSlug);
  const[detail,setDetail]=useState(null);
  const[detailLoading,setDetailLoading]=useState(false);
  const[activeImage,setActiveImage]=useState('');
  const[badGallery,setBadGallery]=useState(()=>new Set());
  const[size,setSize]=useState('');
  const{add,toggle,wish}=useStore();

  useEffect(()=>{
    if(!liveSlug)return;
    fetch('/api/catalog').then(r=>r.ok?r.json():null).then(d=>d?.products?.length&&setProducts(d.products)).catch(()=>{}).finally(()=>setLoading(false));
  },[slug,liveSlug]);

  const p=products.find(x=>x.slug===slug);

  useEffect(()=>{
    if(!p?.image)return;
    setDetail(null);setBadGallery(new Set());setActiveImage(p.image);setDetailLoading(true);
    const q=p.dbId?`id=${encodeURIComponent(p.dbId)}`:`image=${encodeURIComponent(p.image)}`;
    fetch('/api/product-details?'+q)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d){setDetail(d);if(Array.isArray(d.images)&&d.images.length)setActiveImage(d.images[0])}})
      .catch(()=>{})
      .finally(()=>setDetailLoading(false));
  },[p?.slug,p?.dbId,p?.image]);

  const related=useMemo(()=>p?products.filter(x=>x.slug!==p.slug&&(x.brand===p.brand||x.category===p.category)).slice(0,4):[],[p,products]);
  const gallery=useMemo(()=>{
    const list=[...(detail?.images||[]),p?.image].filter(Boolean);
    return [...new Set(list)].filter(x=>!badGallery.has(x));
  },[detail?.images,p?.image,badGallery]);

  if(loading)return <main><section className="pagehead"><div className="w"><div className="k">Dicey Shoes</div><h1>LOADING SHOE…</h1></div></section></main>;
  if(!p||!p.image||BAD_IMAGE.test(p.image))return <main><section className="pagehead"><div className="w"><div className="k">Dicey Shoes</div><h1>THIS PAIR ISN'T READY YET</h1><p>We removed this product because its image source did not meet the storefront standard.</p><Link href="/shop">Back to shop →</Link></div></section></main>;

  const saved=wish.some(x=>x.slug===p.slug);
  const dark=p.imageMode==='dark'||DARK_SHOE.test(p.name||'');
  const reference=p.referenceOnly===true;
  const sizes=sizesFor(p);
  const description=detail?.description||p.description||`Explore the ${p.name} from ${p.brand}.`;
  const shownImage=activeImage&&gallery.includes(activeImage)?activeImage:(gallery[0]||p.image);

  const imageFailed=url=>{
    setBadGallery(prev=>{const next=new Set(prev);next.add(url);return next});
    if(url===shownImage){const next=gallery.find(x=>x!==url);if(next)setActiveImage(next)}
  };

  return <main>
    <section className="product"><div className="w productgrid">
      <div className="productGallery">
        <div className={'productmedia '+(dark?'product-dark':'')}>
          {shownImage?<img className="product-clean" src={proxied(shownImage)} alt={p.name} onError={e=>{if(e.currentTarget.dataset.fallback)return imageFailed(shownImage);e.currentTarget.dataset.fallback='1';e.currentTarget.src=shownImage}}/>:<div className="image-unavailable">Product image unavailable</div>}
        </div>
        <div className="productThumbs" aria-label="Product photos">
          {gallery.slice(0,8).map((img,i)=><button type="button" className={shownImage===img?'active':''} onClick={()=>setActiveImage(img)} key={img} aria-label={`View photo ${i+1}`}><img src={proxied(img)} alt="" loading={i<3?'eager':'lazy'} onError={e=>{if(e.currentTarget.dataset.fallback)return imageFailed(img);e.currentTarget.dataset.fallback='1';e.currentTarget.src=img}}/></button>)}
          {detailLoading&&<div className="thumbLoading">Loading more photos…</div>}
        </div>
      </div>

      <div className="productinfo">
        <div className="brand">{p.brand}</div><h1>{p.name}</h1>
        <div className="productprice">{p.price==null?'PRICE TBD':money(p.price)}</div>
        <div className="status">● {p.status||'Catalog'}</div>
        <div className="shoeDescription"><div className="k">About this pair</div><p>{description}</p></div>
        {(detail?.model||p.model||detail?.styleCode||p.sku)&&<div className="productFacts">
          {(detail?.model||p.model)&&<div><span>Model</span><b>{detail?.model||p.model}</b></div>}
          {(detail?.styleCode||p.sku)&&<div><span>Style code</span><b>{detail?.styleCode||p.sku}</b></div>}
          {gallery.length>1&&<div><span>Photos</span><b>{gallery.length} product views</b></div>}
        </div>}
        <div className="sizehead"><b>Select size</b><span>US sizing</span></div>
        <div className="sizes">{sizes.map(s=><button className={size===s?'active':''} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div>
        {reference?<><button className="save" onClick={()=>toggle(p)}>{saved?'♥ SAVED':'♡ SAVE TO WISHLIST'}</button><div className="details"><div><b>Catalog item</b><span>{p.price==null?'Price is being confirmed.':'Price shown is reference market/catalog data.'}</span></div>{p.sku&&<div><b>SKU</b><span>{p.sku}</span></div>}<div><b>Size run</b><span>Full US size range shown.</span></div></div></>:<><button className="add" disabled={!size} onClick={()=>add(p,size)}>{size?'ADD TO BAG':'SELECT A SIZE'}</button><button className="save" onClick={()=>toggle(p)}>{saved?'♥ SAVED':'♡ SAVE TO WISHLIST'}</button><div className="details"><div><b>Shipping</b><span>Tracked delivery options at checkout.</span></div><div><b>Returns</b><span>Unworn returns subject to store policy.</span></div><div><b>Currency</b><span>{p.price==null?'Price TBD':'USD'}</span></div></div></>}
      </div>
    </div></section>
    <section><div className="w"><div className="st"><div><div className="k">You may also like</div><h2>MORE HEAT</h2></div></div><div className="grid">{related.map(x=><ProductCard p={x} key={x.slug}/>)}</div></div></section>
  </main>;
}
