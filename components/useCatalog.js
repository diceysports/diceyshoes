'use client';
import {useEffect,useState} from 'react';
import {products as fallback} from '../lib/products';
export default function useCatalog(){
  const[products,setProducts]=useState(fallback);
  useEffect(()=>{fetch('/api/catalog').then(r=>r.ok?r.json():null).then(d=>d?.products?.length&&setProducts(d.products)).catch(()=>{})},[]);
  return products;
}
