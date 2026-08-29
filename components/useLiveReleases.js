'use client';
import {useEffect,useState} from 'react';
import {releases as fallback} from '../lib/releases';
export default function useLiveReleases(){
  const[items,setItems]=useState(fallback);
  useEffect(()=>{fetch('/api/releases').then(r=>r.ok?r.json():null).then(d=>d?.releases?.length&&setItems(d.releases)).catch(()=>{})},[]);
  return items;
}
