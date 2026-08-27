'use client';
import {useEffect,useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {products as fallback} from '../lib/products';
import ProductCard from './ProductCard';

const PAGE_SIZE=48;
const CATEGORY_ORDER=['All','Lifestyle','Running','Basketball','Skate','Luxury'];
export default function Catalog({title='SHOP ALL',eyebrow='DICEY SHOES',filter}){
  const params=useSearchParams();
  const initial=params.get('q')||'';
  const brand=params.get('brand')||'';
  const initialCategory=params.get('category')||'All';
  const[q,setQ]=useState(initial),[sort,setSort]=useState('featured'),[category,setCategory]=useState(initialCategory),[products,setProducts]=useState(fallback),[loading,setLoading]=useState(true),[visible,setVisible]=useState(PAGE_SIZE);
  useEffect(()=>{fetch('/api/catalog').then(r=>r.ok?r.json():null).then(d=>{if(d?.products?.length)setProducts(d.products)}).catch(()=>{}).finally(()=>setLoading(false))},[]);
  const categories=useMemo(()=>{const present=new Set(products.map(p=>p.category).filter(Boolean));return CATEGORY_ORDER.filter(x=>x==='All'||present.has(x))},[products]);
  const list=useMemo(()=>{
    let x=products
      .filter(p=>!filter||filter(p))
      .filter(p=>!brand||p.brand.toLowerCase()===brand.toLowerCase())
      .filter(p=>category==='All'||p.category===category)
      .filter(p=>(p.brand+' '+p.name+' '+(p.model||'')+' '+(p.category||'')).toLowerCase().includes(q.toLowerCase()));
    if(sort==='low')x=[...x].sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
    if(sort==='high')x=[...x].sort((a,b)=>(b.price??-Infinity)-(a.price??-Infinity));
    return x;
  },[q,sort,filter,brand,category,products]);
  useEffect(()=>setVisible(PAGE_SIZE),[q,sort,brand,filter,category]);
  const shown=list.slice(0,visible);
  return <main><section className="pagehead"><div className="w"><div className="k">{eyebrow}</div><h1>{brand||title}</h1><p>{loading?'Loading full inventory…':`${list.length} shoes in this view. Every listed pair has a usable image and verified/reference price.`}</p></div></section><section className="catalog"><div className="w"><div className="tools"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search shoes, models or brands" autoFocus={title==='SEARCH'}/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option value={c} key={c}>{c==='All'?'All categories':c}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div><div className="catalogCount">Showing {Math.min(shown.length,list.length)} of {list.length}{brand?` · ${brand}`:''}{category!=='All'?` · ${category}`:''}</div><div className="grid">{shown.map(p=><ProductCard p={p} key={p.slug}/>)}</div>{visible<list.length&&<div className="loadMoreWrap"><button className="btn v" onClick={()=>setVisible(v=>v+PAGE_SIZE)}>Load more shoes</button></div>}{!list.length&&!loading&&<div className="empty">No shoes match these filters.</div>}</div></section></main>;
}
