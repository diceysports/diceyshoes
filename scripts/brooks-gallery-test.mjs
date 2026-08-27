import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const target={
  productId:7692,
  name:'Brooks Ghost Max 3 Black Navy Acid Lime',
  styleCode:'110464-1D-078',
  productUrl:'https://www.brooksrunning.com/en_gb/mens/road-running-shoes/ghost-max-3/110464.html?dwvar_110464_color=078'
};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({
  viewport:{width:1440,height:1000},
  userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
});
const result={target,product:{},errors:[]};
try{
  const responseLog=[];
  page.on('response',r=>{const u=r.url();if(/110464|078|ghost-max/i.test(u))responseLog.push({status:r.status(),url:u,contentType:r.headers()['content-type']||''})});
  const pres=await page.goto(target.productUrl,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(8000);
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight/2)).catch(()=>{});
  await page.waitForTimeout(2500);
  const allImages=await page.locator('img').evaluateAll((els)=>{
    const out=[];
    for(const img of els){
      for(const v of [img.currentSrc,img.src,img.getAttribute('data-src'),img.getAttribute('data-lazy'),img.getAttribute('data-original')]) if(v&&/^https?:/i.test(v)) out.push(v);
      const ss=img.getAttribute('srcset')||img.getAttribute('data-srcset')||'';
      for(const part of ss.split(',')){const v=part.trim().split(/\s+/)[0];if(/^https?:/i.test(v))out.push(v)}
    }
    return [...new Set(out)];
  });
  const productImages=allImages.filter(u=>/110464|ghost.?max|dwvar_110464|078/i.test(u));
  const scripts=await page.locator('script').evaluateAll((els)=>els.map(s=>s.textContent||'').filter(x=>/110464|dwvar_110464|078/i.test(x)).slice(0,80));
  const bodyText=(await page.locator('body').innerText().catch(()=>'' )).slice(0,10000);
  result.product={
    status:pres?.status()||null,
    url:page.url(),
    title:await page.title(),
    allImageCount:allImages.length,
    productImages:productImages.slice(0,120),
    allImages:allImages.slice(0,180),
    responses:responseLog.slice(0,150),
    scripts:scripts.map(x=>x.slice(0,30000)),
    text:bodyText
  };
}catch(e){result.errors.push(String(e?.stack||e));}
await browser.close();
await fs.writeFile('brooks-gallery-test.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({productStatus:result.product.status,productUrl:result.product.url,allImageCount:result.product.allImageCount||0,productImageCount:result.product.productImages?.length||0,errors:result.errors},null,2));