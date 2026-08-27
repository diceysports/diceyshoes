import ContactForm from '../../components/ContactForm';
import Link from 'next/link';

export const metadata={title:'Contact | Dicey Shoes'};

export default function Contact(){
  return <main>
    <section className="pagehead"><div className="w"><div className="k">SUPPORT</div><h1>CONTACT</h1><p>Questions about an order, shipping, returns, products or payments? Send us the details below.</p></div></section>
    <section><div className="w contactLayout">
      <div className="contactIntro"><div className="k">BEFORE YOU MESSAGE</div><h2>WE’LL GET YOU TO THE RIGHT PLACE.</h2><p>Include your order number whenever possible. For damaged or incorrect items, mention that in the message so we can ask for the right photos.</p><div className="contactQuick"><Link href="/shipping">Shipping policy →</Link><Link href="/returns">Returns policy →</Link><Link href="/terms">Terms of service →</Link></div></div>
      <ContactForm/>
    </div></section>
  </main>;
}
