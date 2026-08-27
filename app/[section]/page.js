'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import Catalog from '../../components/Catalog';
import ProductCard from '../../components/ProductCard';
import LiveNews from '../../components/LiveNews';
import useCatalog from '../../components/useCatalog';
import useLiveReleases from '../../components/useLiveReleases';
import {money} from '../../lib/products';
import {useStore} from '../../components/StoreProvider';

const INFO={about:['ABOUT DICEY SHOES','Dicey Shoes is a curated footwear store built around sneaker culture, designer footwear and upcoming releases.'],shipping:['SHIPPING','Orders are prepared for tracked delivery. Final delivery estimates and rates are shown before checkout.'],returns:['RETURNS','Unworn items may be eligible for return according to the return window shown with your order. Keep original packaging and tags.'],contact:['CONTACT','For order or product support, contact the Dicey Shoes team through the support channel shown with your order confirmation.'],privacy:['PRIVACY','We use information required to operate the store, process orders and improve the shopping experience. Payment information is handled by the payment provider.'],terms:['TERMS','By using Dicey Shoes you agree to the store terms, product availability rules, pricing and applicable return policies.']};

function Account(){
  const supabase=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?createClient(url,key):null},[]);
  const[user,setUser]=useState(null),[mode,setMode]=useState('signup'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setUser(data.session?.user||null));const{data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user||null));return()=>data.subscription.unsubscribe()},[supabase]);
  async function submit(e){e.preventDefault();if(!supabase){setMsg('Account service is not configured yet.');return}setBusy(true);setMsg('');const res=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/account'}}):await supabase.auth.signInWithPassword({email,password});setBusy(false);if(res.error)setMsg(res.error.message);else if(mode==='signup'&&!res.data.session)setMsg('Check your email to confirm your Dicey account.');else setMsg('You are signed in.')}
  async function logout(){if(supabase)await supabase.auth.signOut()}
  return <main><section className="pagehead dark"><div className="w"><div className="ey">Your rotation</div><h1>ACCOUNT</h1><p>Save pairs, keep your wishlist and stay close to upcoming drops.</p></div></section><section><div className="w accountWrap">{user?<div className="accountCard"><div className="k">Signed in</div><h2>WELCOME TO DICEY</h2><p>{user.email}</p><div className="accountLinks"><Link href="/wishlist">Open wishlist →</Link><Link href="/community">Open community →</Link><Link href="/releases">Track releases →</Link></div><button className="accountBtn secondary" onClick={logout}>SIGN OUT</button></div>:<div className="accountCard"><div className="accountTabs"><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>CREATE ACCOUNT</button><button className={mode==='signin'?'active':''} onClick={()=>setMode('signin')}>SIGN IN</button></div><form className="accountForm" onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"/></label><label>Password<input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="6+ characters"/></label><button className="accountBtn" disabled={busy}>{busy?'WORKING…':mode==='signup'?'CREATE MY ACCOUNT':'SIGN IN'}</button>{msg&&<p className="accountMsg">{msg}</p>}</form><small>By creating an account you agree to the Dicey Shoes terms and privacy policy.</small></div>}</div></section></main>}

function ReleaseCards({items,limit}){return <div className="releasegrid">{items.slice(0,limit||items.length).map(r=><a className="releasecard" href={r.url} target="_blank" rel="noreferrer" key={r.url+r.name}><div className="releasepic"><img src={r.image} alt={r.name} onError={e=>{e.currentTarget.style.visibility='hidden'}}/></div><div className="releasebody"><div className="d">{String(r.date||'Soon').toUpperCase()}</div><div className="brand">{r.brand}</div><h2>{r.name}</h2><strong>{money(r.price)}</strong><span>Release details ↗</span></div></a>)}</div>}

function Community(){
  const products=useCatalog(),releases=useLiveReleases();
  const[drops,setDrops]=useState([]);
  useEffect(()=>{setDrops([...products].sort(()=>Math.random()-.5).slice(0,8))},[products]);
  return <main><section className="communityHero"><div className="w"><div className="ey">DICEY COMMUNITY</div><h1>KNOW WHAT'S<br/><span>NEXT.</span></h1><p>Upcoming shoes, new drops, release dates and the stories moving sneaker culture.</p><div><Link className="btn v" href="/releases">Upcoming releases</Link><Link className="btn g" href="/shop">Shop new heat</Link></div></div></section><section><div className="w"><div className="st"><div><div className="k">Fresh rotation</div><h2>NEW DROPS</h2></div><Link href="/shop">Shop all →</Link></div><div className="grid">{drops.map(p=><ProductCard p={p} key={p.slug}/>)}</div></div></section><section className="relsec"><div className="w"><div className="st"><div><div className="k">Calendar</div><h2>COMING SOON</h2></div><Link href="/releases">Full release radar →</Link></div><ReleaseCards items={releases} limit={6}/></div></section><section><div className="w"><div className="st"><div><div className="k">Culture feed</div><h2>WHAT PEOPLE ARE WATCHING</h2></div><Link href="/news">All news →</Link></div><LiveNews limit={6}/></div></section></main>}

function Brands(){const products=useCatalog();const bs=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort();return <main><section className="pagehead"><div className="w"><div className="k">Directory</div><h1>BRANDS</h1><p>{bs.length} brands across the live Dicey Shoes inventory.</p></div></section><section><div className="w brandgrid">{bs.map(b=><Link href={'/shop?brand='+encodeURIComponent(b)} className="brandtile" key={b}>{b}<span>Explore →</span></Link>)}</div></section></main>}

export default function Section(){
  const{section}=useParams();const{cart,wish,remove}=useStore();const releases=useLiveReleases();
  if(section==='shop')return <Catalog/>;
  if(section==='men')return <Catalog title="MEN" eyebrow="Shop your lane" filter={p=>p.gender==='Men'||p.gender==='Unisex'}/>;
  if(section==='women')return <Catalog title="WOMEN" eyebrow="Shop your lane" filter={p=>p.gender==='Women'||p.gender==='Unisex'}/>;
  if(section==='luxury')return <Catalog title="LUXURY" eyebrow="Designer footwear" filter={p=>p.category==='Luxury'}/>;
  if(section==='search')return <Catalog title="SEARCH" eyebrow="Find your pair"/>;
  if(section==='account')return <Account/>;
  if(section==='community')return <Community/>;
  if(section==='wishlist')return <main><section className="pagehead"><div className="w"><div className="k">Saved</div><h1>WISHLIST</h1></div></section><section className="catalog"><div className="w"><div className="grid">{wish.map(p=><ProductCard p={p} key={p.slug}/>)}</div>{!wish.length&&<div className="empty">No saved shoes yet. <Link href="/shop">Explore the shop →</Link></div>}</div></section></main>;
  if(section==='cart'){const total=cart.reduce((s,x)=>s+(Number(x.price)||0),0);return <main><section className="pagehead"><div className="w"><div className="k">Your order</div><h1>BAG</h1></div></section><section className="catalog"><div className="w cartlayout"><div>{cart.map(x=><div className="cartitem" key={x.id}><img src={x.image} alt={x.name}/><div><b>{x.brand}</b><h3>{x.name}</h3><p>Size {x.size}</p><strong>{money(x.price)}</strong></div><button onClick={()=>remove(x.id)}>Remove</button></div>)}{!cart.length&&<div className="empty">Your bag is empty. <Link href="/shop">Shop shoes →</Link></div>}</div><aside className="summary"><div className="k">Order summary</div><h2>{money(total)}</h2><p>Taxes and delivery calculated at checkout.</p><button className="btn v wide" disabled={!cart.length}>Secure checkout</button></aside></div></section></main>}
  if(section==='releases')return <main><section className="pagehead dark"><div className="w"><div className="ey">Drop watch</div><h1>RELEASE RADAR</h1><p>Upcoming releases, photos and direct source links. Checked daily.</p></div></section><section><div className="w"><ReleaseCards items={releases}/></div></section></main>;
  if(section==='brands')return <Brands/>;
  if(section==='news')return <main><section className="pagehead"><div className="w"><div className="k">Culture feed</div><h1>NEWS</h1><p>Fresh sneaker stories link directly to the original publisher.</p></div></section><section><div className="w"><LiveNews limit={30}/></div></section></main>;
  if(INFO[section]){const[t,b]=INFO[section];return <main><section className="pagehead"><div className="w"><div className="k">Dicey Shoes</div><h1>{t}</h1></div></section><section><div className="w prose"><p>{b}</p></div></section></main>}
  return <main><section className="pagehead"><div className="w"><h1>PAGE NOT FOUND</h1><Link href="/">Back home →</Link></div></section></main>
}
