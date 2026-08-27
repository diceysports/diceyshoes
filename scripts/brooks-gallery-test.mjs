import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const target={
  productId:7692,
  name:'Brooks Ghost Max 3 Black Navy Acid Lime',
  styleCode:'110464-1D-078',
  search:'https://www.brooksrunning.com/en_us/search?q=110464'
};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({
  viewport:{width:1440,height:1000},
  userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
});
const result={target,search:{},product:{},errors:[]};
try{
  const res=await page.goto(target.search,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(5000);
  result.search={status:res?.status()||null,url:page.url(),title:await page.title(),text:(await page.locator('body').innerText().catch(()=>'' )).slice(0,2500)};
  const links=await page.locator('a[href]').evaluateAll((els)=>els.map(a=>({href:a.href,text:(a.textContent||'').trim()})).filter(x=>x.href));
  result.search.links=links.filter(x=>/110464|ghost-max-3/i.test(x.href+' '+x.text)).slice(0,20);
  const candidate=result.search.links?.[0]?.href || 'https://www.brooksrunning.com/en_gb/mens/road-running-shoes/ghost-max-3/110464.html?dwvar_110464_color=078';
  const pres=await page.goto(candidate,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(6000);
  const images=await page.locator('img').evaluateAll((els)=>{
    const out=[];
    for(const img of els){
      for(const v of [img.currentSrc,img.src,img.getAttribute('data-src'),img.getAttribute('data-lazy'),img.getAttribute('data-original')]) if(v&&/^https?:/i.test(v)) out.push(v);
      const ss=img.getAttribute('srcset')||img.getAttribute('data-srcset')||'';
      for(const part of ss.split(',')){const v=part.trim().split(/\s+/)[0];if(/^https?:/i.test(v))out.push(v)}
    }
    return [...new Set(out)];
  });
  const scripts=await page.locator('script').evaluateAll((els)=>els.map(s=>s.textContent||'').filter(x=>/110464|078|product|image/i.test(x)).slice(0,40));
  result.product={status:pres?.status()||null,url:page.url(),title:await page.title(),images:images.slice(0,120),scripts:scripts.map(x=>x.slice(0,20000)),text:(await page.locator('body').innerText().catch(()=>'' )).slice(0,5000)};
}catch(e){result.errors.push(String(e?.stack||e));}
await browser.close();
await fs.writeFile('brooks-gallery-test.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({searchStatus:result.search.status,productStatus:result.product.status,productUrl:result.product.url,imageCount:result.product.images?.length||0,errors:result.errors},null,2));