'use client';
import {useEffect,useState} from 'react';
import {products as fallback} from '../lib/products';
import {dedupeCatalogProducts} from '../lib/catalog-normalize';

const SAMPLE=/\b(?:sample|samples|prototype)\b/i;
function sanitize(items=[]){
  const out=[];
  for(const p of items){
    const sampleText=`${p?.name||''} ${p?.model||''} ${p?.sku||''} ${p?.source||''}`;
    if(SAMPLE.test(sampleText))continue;
    out.push(p);
  }
  return dedupeCatalogProducts(out);
}

export default function useCatalog(){
  const[products,setProducts]=useState(()=>sanitize(fallback));
  useEffect(()=>{fetch('/api/catalog').then(r=>r.ok?r.json():null).then(d=>d?.products?.length&&setProducts(sanitize(d.products))).catch(()=>{})},[]);
  return products;
}
