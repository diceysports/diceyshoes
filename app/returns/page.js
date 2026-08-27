import PolicyPage from '../../components/PolicyPage';

export const metadata={title:'Returns Policy | Dicey Shoes'};

export default function Returns(){
  return <PolicyPage title="RETURNS" intro="Return eligibility, condition requirements and refund handling for Dicey Shoes orders." sections={[
    {title:'Return window',body:'Unless an item or order confirmation states otherwise, return requests must be opened within 14 calendar days after delivery.'},
    {title:'Condition requirements',body:'Returned footwear must be unworn, unaltered and in resellable condition with the original box, packaging, accessories and tags. Trying shoes on indoors is fine; visible wear, outdoor use, odors, damage or missing packaging may make an item ineligible.'},
    {title:'Items that may be final sale',body:'Certain limited releases, special-order items, personalized products or items clearly marked final sale may not be eligible for change-of-mind returns. Your statutory rights for defective or misdescribed goods are not affected.'},
    {title:'Starting a return',body:'Use the Contact page, choose Return as the topic, and include your order number and the pair you want to return. Do not send a return until you receive return instructions.'},
    {title:'Return shipping',body:'Unless the item was incorrect, defective or damaged when delivered, return shipping costs are the customer’s responsibility and original delivery charges are generally non-refundable.'},
    {title:'Inspection and refunds',body:'Approved returns are inspected after arrival. Eligible refunds are sent back to the original payment method. Your bank or card provider may take additional business days to post the refund after Stripe processes it.'},
    {title:'Wrong or damaged item',body:'If you receive the wrong item or a product that arrives damaged, contact us as soon as possible and include clear photos of the product, packaging and shipping label so we can investigate.'},
    {title:'Exchanges',body:'Direct exchanges depend on availability. When an exchange cannot be offered, the normal process is to return the eligible item and place a new order for the preferred size or style.'}
  ]}/>;
}
