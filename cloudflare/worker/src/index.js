const BRANDS={1:'Nike',2:'Jordan',3:'Adidas',4:'Yeezy',5:'Balmain',6:'Christian Louboutin',7:'Louis Vuitton',8:'Gucci',9:'Versace',10:'Balenciaga',11:'New Balance',12:'ASICS',13:'Puma',14:'Reebok',15:'Converse',16:'Vans',17:'Saucony',18:'Salomon',19:'HOKA',20:'On',21:'Dior',22:'Maison Margiela',23:'Alexander McQueen',24:'BAPE',25:'Off-White',26:'Fear of God',27:'Brooks',28:'Mizuno',29:'Under Armour',30:'Onitsuka Tiger'};

function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=60, s-maxage=300','access-control-allow-origin':'*',...extra}})}
function sizes(row){try{return JSON.parse(row.available_sizes_json||'[]')}catch{return[]}}
function mapProduct(x){return{product_id:x.product_id,slug:`db-${x.product_id}`,dbId:x.product_id,sku:x.style_code||'',brand:BRANDS[x.brand_id]||'Dicey Shoes',name:x.name,model:x.model||'',colorway:x.colorway||'',price:Number(x.retail_price)||175,currency:x.currency||'USD',category:x.category||'Lifestyle',gender:x.gender||'Unisex',image:x.image_url||'',sizes:sizes(x),description:x.description||'',source:x.source_name||'Dicey Catalog',verificationStatus:x.verification_status||'',productUrl:x.product_url||'',status:'In Stock'}}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,OPTIONS','access-control-allow-headers':'content-type'}});
    if(url.pathname==='/health'){
      const p=await env.DB.prepare("SELECT COUNT(*) c FROM shoe_products WHERE status='PUBLISHED'").first();
      const m=await env.DB.prepare("SELECT value FROM migration_meta WHERE key='last_completed_at'").first();
      return json({ok:true,published:Number(p?.c||0),lastMigration:m?.value||null});
    }
    if(url.pathname==='/catalog'){
      const limit=Math.min(Math.max(Number(url.searchParams.get('limit')||1000),1),5000);
      const offset=Math.max(Number(url.searchParams.get('offset')||0),0);
      const brand=url.searchParams.get('brand');
      const category=url.searchParams.get('category');
      const q=url.searchParams.get('q');
      let where=["status='PUBLISHED'"]; const params=[];
      if(category){where.push('category=?');params.push(category)}
      if(brand){const id=Number(brand);if(Number.isFinite(id)){where.push('brand_id=?');params.push(id)}}
      if(q){where.push('(name LIKE ? OR model LIKE ? OR style_code LIKE ? OR colorway LIKE ?)');const needle=`%${q}%`;params.push(needle,needle,needle,needle)}
      const sql=`SELECT * FROM shoe_products WHERE ${where.join(' AND ')} ORDER BY product_id ASC LIMIT ? OFFSET ?`;
      params.push(limit,offset);
      const result=await env.DB.prepare(sql).bind(...params).all();
      const products=(result.results||[]).map(mapProduct);
      const countRow=await env.DB.prepare(`SELECT COUNT(*) c FROM shoe_products WHERE ${where.join(' AND ')}`).bind(...params.slice(0,-2)).first();
      return json({products,count:Number(countRow?.c||0),limit,offset});
    }
    const m=url.pathname.match(/^\/product\/(\d+)$/);
    if(m){
      const row=await env.DB.prepare("SELECT * FROM shoe_products WHERE product_id=? AND status='PUBLISHED'").bind(Number(m[1])).first();
      if(!row)return json({error:'not found'},404);
      const media=await env.DB.prepare("SELECT media_url,media_type,source_id FROM shoe_product_media WHERE master_product_id=? AND storefront_approved=1 AND verification_status='VERIFIED' ORDER BY media_id ASC").bind(Number(m[1])).all();
      return json({product:mapProduct(row),media:media.results||[]});
    }
    return json({name:'diceyshoes-cloudflare-api',routes:['/health','/catalog','/product/:id']},404);
  }
};
