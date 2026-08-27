import PolicyPage from '../../components/PolicyPage';

export const metadata={title:'Privacy Policy | Dicey Shoes'};

export default function Privacy(){
  return <PolicyPage title="PRIVACY" intro="How Dicey Shoes uses information when you browse, create an account, subscribe, contact us or place an order." sections={[
    {title:'Information we collect',body:['We may collect information you provide directly, such as your name, email address, shipping details, account information, newsletter subscription, support messages and order details.','We may also receive basic device, browser and usage information needed to operate, secure and improve the storefront.']},
    {title:'Payments',body:'Payment details are processed by Stripe. Dicey Shoes does not store your complete card number or card security code.'},
    {title:'How we use information',body:'We use information to operate the storefront, process and support orders, provide account features, respond to messages, prevent fraud, improve site performance, comply with legal obligations and send updates you requested.'},
    {title:'Service providers',body:'We use service providers such as hosting, database, authentication, payment and delivery partners where necessary to run the store. Those providers process information according to their own agreements and privacy obligations.'},
    {title:'Marketing updates',body:'If you sign up for Dicey Shoes updates, we use your email address to send release, restock or culture updates. You can unsubscribe from marketing communications at any time.'},
    {title:'Data retention',body:'We keep information only for as long as reasonably needed for the purposes described here, including order records, support, fraud prevention, accounting and legal obligations.'},
    {title:'Your choices',body:'Depending on where you live, you may have rights to request access, correction or deletion of personal information, or to object to certain processing. Use the Contact page to make a privacy request.'},
    {title:'Security',body:'We use reasonable technical and organizational measures to protect store information. No online service can guarantee absolute security.'},
    {title:'Children',body:'Dicey Shoes is not intended to knowingly collect personal information from children below the age at which they can independently consent under applicable law.'},
    {title:'Policy changes',body:'We may update this policy as the store, laws or service providers change. The latest version will be posted on this page with an updated date.'}
  ]}/>;
}
