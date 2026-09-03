'use client';
import {useEffect,useState} from 'react';
import {newsFallback} from '../lib/news-fallback';
import {newsLatest} from '../lib/news-latest';
import {newsCurrent} from '../lib/news-current';
import {newsAuto} from '../lib/news-auto';
const fallback=[...newsAuto,...newsCurrent,...newsLatest,...newsFallback].filter((n,i,a)=>a.findIndex(x=>x.url===n.url)===i);
const proxySrc=url=>url&&/^https:\/\//i.test(url)?'/api/shoe-image?url='+encodeURIComponent(url):url||'';
const articleSrc=url=>url&&/^https:\/\//i.test(url)?'/api/shoe-image?article='+encodeURIComponent(url):'';
function NewsImage({item}){
  const[failed,setFailed]=useState(false);
  const initial=item.image||articleSrc(item.url);
  if(!initial||failed)return <div className="art newsphoto newsphotoFallback"><span>{item.source||'Dicey Shoes'}</span></div>;
  return <div className="art newsphoto"><img src={initial} data-original={item.image||''} data-article={item.url||''} alt={item.title} loading="lazy" referrerPolicy="no-referrer" onError={e=>{const img=e.currentTarget;const step=img.dataset.retry||'0';if(step==='0'&&img.dataset.original){img.dataset.retry='1';img.removeAttribute('referrerpolicy');img.src=proxySrc(img.dataset.original);return}if(step!=='2'&&img.dataset.article){img.dataset.retry='2';img.removeAttribute('referrerpolicy');img.src=articleSrc(img.dataset.article);return}setFailed(true)}}/></div>;
}
export default function LiveNews({limit=18}){const[items,setItems]=useState(fallback);useEffect(()=>{fetch('/api/news').then(r=>r.ok?r.json():null).then(d=>{if(d?.news?.length){const merged=[...newsAuto,...newsCurrent,...d.news,...fallback].filter((n,i,a)=>a.findIndex(x=>x.url===n.url)===i);setItems(merged)}}).catch(()=>{})},[]);return <><style jsx global>{`.newsphoto{position:relative;overflow:hidden;padding:0!important}.newsphoto img{width:100%;height:100%;display:block;object-fit:cover}.newsphotoFallback{display:flex;align-items:flex-end;padding:16px!important;background:linear-gradient(135deg,#3157ff,#111)!important;color:#fff}.newsphotoFallback span{font:900 22px Impact;letter-spacing:.03em;text-transform:uppercase}`}</style><div className="news">{items.slice(0,limit).map(n=><a className="story" href={n.url} target="_blank" rel="noreferrer" key={n.url}><NewsImage item={n}/><div className="sb"><div className="source">{n.source}{n.date?' · '+new Date(n.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}</div><h3>{n.title}</h3><p>{n.summary||'Open the original publisher for the full story.'}</p><b className="readmore">Read original article ↗</b></div></a>)}</div></>}
