'use client';
import {useEffect,useState} from 'react';
import {products as fallback} from '../lib/products';

const SAMPLE=/\b(?:sample|samples|prototype)\b/i;
function cleanCode(v=''){return String(v).toUpperCase().replace(/[^A-Z0-9]/g,'')}
function sanitize(items=[]){
  const seen=new Set(),out=[];
  for(const p of items){
    const sampleText=`${p?.name||''} ${p?.model||''} ${p?.sku||''} ${p?.source||''}`;
    if(SAMPLE.test(sampleText))continue;
    const code=cleanCode(p?.sku||'');
    if(code){if(seen.has(code))continue;seen.add(code)}
    out.push(p);
  }
  return out;
}

export default function useCatalog(){
  const[products,setProducts]=useState(()=>sanitize(fallback));
  useEffect(()=>{fetch('/api/catalog').then(r=>r.ok?r.json():null).then(d=>d?.products?.length&&setProducts(sanitize(d.products))).catch(()=>{})},[]);
  return products;
}
