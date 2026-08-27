import Link from 'next/link';

export default function PolicyPage({eyebrow='Dicey Shoes',title,intro,sections=[],updated='August 27, 2026'}){
  return <main className="policyPage">
    <section className="pagehead"><div className="w"><div className="k">{eyebrow}</div><h1>{title}</h1><p>{intro}</p><small>Last updated: {updated}</small></div></section>
    <section><div className="w policyBody">
      {sections.map((section,i)=><article key={i}><h2>{section.title}</h2>{Array.isArray(section.body)?section.body.map((p,j)=><p key={j}>{p}</p>):<p>{section.body}</p>}</article>)}
      <div className="policyHelp"><b>Need help with an order?</b><p>Send us the details and we’ll respond to the email you provide.</p><Link className="btn v" href="/contact">CONTACT DICEY SHOES</Link></div>
    </div></section>
  </main>;
}
