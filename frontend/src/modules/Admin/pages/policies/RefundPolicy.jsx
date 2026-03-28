import AdminPageEditor from '../../components/AdminPageEditor';

const RefundPolicy = () => (
  <AdminPageEditor
    slug="returns"
    pageTitle="Returns & Exchanges"
    description="Manage your store's return and exchange policy shown to users."
    placeholder={`Returns & Exchanges Policy\n\nLast updated: ...\n\n1. Eligibility\n...\n\n2. How to Return\n...`}
  />
);

export default RefundPolicy;
