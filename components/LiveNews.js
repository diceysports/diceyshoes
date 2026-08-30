'use client';
import {useEffect,useState} from 'react';
import {newsFallback} from '../lib/news-fallback';
import {newsLatest} from '../lib/news-latest';
const fallback=[...newsLatest,...newsFallback].filter((n,i,a)=>a.findIndex(x=>x.url===n.url)===i);
export default function LiveNews({limit=18}){const[items,setItems]=useState(fallback);useEffect(()=>{fetch('/api/news').then(r=>r.ok?r.json():null).then(d=>{if(d?.news?.length){const merged=[...d.news,...fallback].filter((n,i,a)=>a.findIndex(x=>x.url===n.url)===i);setItems(merged)}}).catch(()=>{})},[]);return <div className="news">{items.slice(0,limit).map(n=><a className="story" href={n.url} target="_blank" rel="noreferrer" key={n.url}><div className="art newsphoto" style={{backgroundImage:`url(${n.image||''})`}}></div><div className="sb"><div className="source">{n.source}{n.date?' · '+new Date(n.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}</div><h3>{n.title}</h3><p>{n.summary||'Open the original publisher for the full story.'}</p><b className="readmore">Read original article ↗</b></div></a>)}</div>}
