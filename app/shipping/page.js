import PolicyPage from '../../components/PolicyPage';

export const metadata={title:'Shipping Policy | Dicey Shoes'};

export default function Shipping(){
  return <PolicyPage title="SHIPPING" intro="How Dicey Shoes handles addresses, tracking, delivery estimates and international shipments." sections={[
    {title:'Order processing',body:'Orders are reviewed for payment authorization and product availability before fulfillment. Processing time can vary by item and supplier. Any estimated timing shown at checkout or in your order confirmation is an estimate, not a guaranteed delivery date.'},
    {title:'Shipping address',body:'Please enter a complete and accurate shipping address at checkout. If you notice an error, contact us immediately. Once a package has entered carrier processing, an address change may no longer be possible.'},
    {title:'Tracking',body:'When tracking is available, it will be provided after the shipment is handed to the carrier. Tracking can take time to begin showing movement after a label is created.'},
    {title:'Split shipments',body:'Orders containing multiple pairs may ship separately. If that happens, you may receive more than one tracking number and packages may arrive on different days.'},
    {title:'International orders',body:'International shipments may be subject to customs processing, import duties, taxes or brokerage fees imposed by the destination country. Unless checkout explicitly states otherwise, those charges are the customer’s responsibility.'},
    {title:'Carrier delays',body:'Weather, holidays, customs, carrier disruptions and other events outside our control can delay delivery. We will help you investigate a shipment when tracking indicates a problem.'},
    {title:'Lost or damaged packages',body:'If tracking shows a delivery problem, or your order arrives damaged, contact us with your order number and photos when relevant. We may need to open a carrier or supplier investigation before a replacement or refund can be approved.'}
  ]}/>;
}
