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

        // Keep the exact preserved storefront, but remove only the two
        // scroll-driven shoe transforms from the original preview.
        html = html.replace(
          /let q=0;function move\(\)\{let y=scrollY;heroShoe\.style\.transform=`rotate\(\$\{y\*\.035\}deg\) translateY\(\$\{Math\.min\(30,y\*\.04\)\}px\)`;let r=document\.querySelector\('\.spot'\)\.getBoundingClientRect\(\),p=Math\.max\(-1,Math\.min\(1,\(innerHeight\/2-r\.top\)\/innerHeight\)\);spotShoe\.style\.transform=`rotate\(\$\{p\*24\}deg\) translateX\(\$\{p\*14\}px\)`;q=0\}addEventListener\('scroll',\(\)=>\{if\(!q\)\{requestAnimationFrame\(move\);q=1\}\},\{passive:true\}\);move\(\);/,
          ''
        );

        // Shuffle the homepage product cards on every page load.
        html = html.replace(
          "const m=(n,c)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:n%1?2:0}).format(n);products.innerHTML=P.map",
          "const m=(n,c)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:n%1?2:0}).format(n);for(let i=P.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[P[i],P[j]]=[P[j],P[i]]}products.innerHTML=P.map"
        );

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
