import AdminPageEditor from '../../components/AdminPageEditor';
const FAQs = () => (
  <AdminPageEditor slug="faq" pageTitle="FAQs" description="Answer the most common questions from your customers." placeholder={`Frequently Asked Questions\n\nQ: How do I track my order?\nA: Visit the Orders section in your account.\n\nQ: Can I cancel my order?\nA: Yes, within 24 hours of placing the order.\n\nQ: What payment methods do you accept?\nA: We accept cards, UPI, and net banking.`} />
);
export default FAQs;
