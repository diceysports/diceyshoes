'use client';
import {useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {products} from '../lib/products';
import ProductCard from './ProductCard';

export default function Catalog({title='SHOP ALL',eyebrow='DICEY SHOES',filter}){
  const params=useSearchParams();
  const initial=params.get('q')||'';
  const brand=params.get('brand')||'';
  const[q,setQ]=useState(initial),[sort,setSort]=useState('featured');
  const list=useMemo(()=>{
    let x=products
      .filter(p=>!filter||filter(p))
      .filter(p=>!brand||p.brand.toLowerCase()===brand.toLowerCase())
      .filter(p=>(p.brand+' '+p.name).toLowerCase().includes(q.toLowerCase()));
    if(sort==='low')x=[...x].sort((a,b)=>a.price-b.price);
    if(sort==='high')x=[...x].sort((a,b)=>b.price-a.price);
    return x;
  },[q,sort,filter,brand]);
  return <main><section className="pagehead"><div className="w"><div className="k">{eyebrow}</div><h1>{brand||title}</h1><p>Curated sneakers and luxury footwear. Prices shown in USD.</p></div></section><section className="catalog"><div className="w"><div className="tools"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search shoes, models or brands" autoFocus={title==='SEARCH'}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div><div className="grid">{list.map(p=><ProductCard p={p} key={p.slug}/>)}</div>{!list.length&&<div className="empty">No shoes match your search.</div>}</div></section></main>;
}
