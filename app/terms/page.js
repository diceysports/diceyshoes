import PolicyPage from '../../components/PolicyPage';

export const metadata={title:'Terms of Service | Dicey Shoes'};

export default function Terms(){
  return <PolicyPage title="TERMS OF SERVICE" intro="These terms govern your use of Dicey Shoes and purchases made through the storefront." sections={[
    {title:'Using the store',body:['By accessing or using Dicey Shoes, you agree to these Terms of Service and the policies linked from the storefront. You must use the site lawfully and may not interfere with its security, availability or operation.','We may update site features, catalog content and these terms from time to time. The version posted here applies from its stated update date.']},
    {title:'Products, pricing and availability',body:['Product descriptions, photos, sizes, release information and prices are provided to help you shop. We work to keep them accurate, but errors or supplier changes can occur. An item is not guaranteed until an order is accepted and payment is successfully completed.','Items marked PRICE TBD, Catalog, reference-only, unavailable or otherwise not purchasable cannot be completed through checkout. We may correct pricing or product errors and cancel or refund an affected order when necessary.']},
    {title:'Orders and payment',body:['Checkout payments are processed by Stripe. Dicey Shoes does not store your full card number. Your order is subject to payment authorization, product availability and our fraud-prevention checks.','We may decline or cancel an order when we reasonably believe there is a payment problem, pricing error, inventory problem, suspected fraud, resale abuse or other legitimate fulfillment issue. If a captured payment is cancelled, the applicable amount will be refunded.']},
    {title:'Shipping and delivery',body:'Shipping addresses, delivery handling and tracking are governed by our Shipping Policy. Delivery dates are estimates unless expressly stated otherwise, and carrier or customs delays can occur outside our control.'},
    {title:'Returns and refunds',body:'Eligible returns and refunds are governed by our Returns Policy. Products must meet the condition and timing requirements stated there unless consumer law gives you additional rights.'},
    {title:'Accounts and communications',body:['If you create an account, you are responsible for keeping your login credentials secure. You agree to provide accurate information when creating an account, placing an order or contacting support.','If you subscribe to drop updates, you may unsubscribe from marketing communications at any time. Transactional messages about orders or account security may still be sent when necessary.']},
    {title:'Intellectual property',body:'Dicey Shoes branding, site design, original text, graphics and software are protected by applicable intellectual-property laws. Third-party brand names and trademarks belong to their respective owners.'},
    {title:'Site availability and liability',body:'We aim to keep the storefront reliable, but do not guarantee uninterrupted access. To the maximum extent permitted by law, Dicey Shoes is not responsible for indirect or consequential losses caused by site interruptions, third-party services, carriers or events outside reasonable control.'},
    {title:'Consumer rights',body:'Nothing in these terms limits rights that cannot legally be excluded under applicable consumer-protection law.'},
    {title:'Questions',body:'If you have a question about these terms or an order, use the Contact page and include your order number when available.'}
  ]}/>;
}
