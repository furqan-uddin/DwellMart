import AdminPageEditor from '../../components/AdminPageEditor';
const ShippingPolicy = () => (
  <AdminPageEditor slug="shipping" pageTitle="Shipping Policy" description="Explain delivery timelines, charges, and geographic coverage." placeholder={`Shipping Policy\n\nLast updated: ...\n\n1. Processing Time\nOrders are processed within 1-2 business days.\n\n2. Delivery Time\nStandard: 5-7 business days\nExpress: 2-3 business days\n\n3. Shipping Charges\n...`} />
);
export default ShippingPolicy;
