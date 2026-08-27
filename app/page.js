'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    fetch('https://dicey-shoes-8skt8fh06-diceysports-5427.vercel.app/', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('baseline');
        return r.text();
      })
      .then((html) => {
        html = html.replace(/<script async data-explicit-opt-in=[\s\S]*?<\/script>\s*$/, '');
        document.open();
        document.write(html);
        document.close();
      })
      .catch((err) => {
        console.error(err);
        const el = document.getElementById('loading');
        if (el) el.textContent = 'Dicey Shoes could not load';
      });
  }, []);

  return <div id="loading" style={{minHeight:'100svh',display:'grid',placeItems:'center',background:'#0a0b0d',color:'#fff',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',fontSize:11,fontWeight:900,letterSpacing:'.14em',textTransform:'uppercase'}}>Loading Dicey Shoes…</div>;
}
