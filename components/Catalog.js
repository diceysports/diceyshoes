'use client';
import {useEffect,useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {products as fallback} from '../lib/products';
import ProductCard from './ProductCard';

const PAGE_SIZE=48;
export default function Catalog({title='SHOP ALL',eyebrow='DICEY SHOES',filter}){
  const params=useSearchParams();
  const initial=params.get('q')||'';
  const brand=params.get('brand')||'';
  const[q,setQ]=useState(initial),[sort,setSort]=useState('featured'),[products,setProducts]=useState(fallback),[loading,setLoading]=useState(true),[visible,setVisible]=useState(PAGE_SIZE);
  useEffect(()=>{fetch('/api/catalog').then(r=>r.ok?r.json():null).then(d=>{if(d?.products?.length)setProducts(d.products)}).catch(()=>{}).finally(()=>setLoading(false))},[]);
  const list=useMemo(()=>{
    let x=products
      .filter(p=>!filter||filter(p))
      .filter(p=>!brand||p.brand.toLowerCase()===brand.toLowerCase())
      .filter(p=>(p.brand+' '+p.name+' '+(p.model||'')).toLowerCase().includes(q.toLowerCase()));
    if(sort==='low')x=[...x].sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
    if(sort==='high')x=[...x].sort((a,b)=>(b.price??-Infinity)-(a.price??-Infinity));
    return x;
  },[q,sort,filter,brand,products]);
  useEffect(()=>setVisible(PAGE_SIZE),[q,sort,brand,filter]);
  const shown=list.slice(0,visible);
  return <main><section className="pagehead"><div className="w"><div className="k">{eyebrow}</div><h1>{brand||title}</h1><p>{loading?'Loading full inventory…':`${list.length} shoes in this view. Prices shown in USD where verified.`}</p></div></section><section className="catalog"><div className="w"><div className="tools"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search shoes, models or brands" autoFocus={title==='SEARCH'}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div><div className="catalogCount">Showing {Math.min(shown.length,list.length)} of {list.length}</div><div className="grid">{shown.map(p=><ProductCard p={p} key={p.slug}/>)}</div>{visible<list.length&&<div className="loadMoreWrap"><button className="btn v" onClick={()=>setVisible(v=>v+PAGE_SIZE)}>Load more shoes</button></div>}{!list.length&&!loading&&<div className="empty">No shoes match your search.</div>}</div></section></main>;
}
