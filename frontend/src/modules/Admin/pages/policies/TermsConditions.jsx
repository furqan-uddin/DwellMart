import AdminPageEditor from '../../components/AdminPageEditor';

const TermsConditions = () => (
  <AdminPageEditor
    slug="terms"
    pageTitle="Terms & Conditions"
    description="Manage your store's terms and conditions shown to users."
    placeholder={`Terms & Conditions\n\nLast updated: ...\n\n1. Acceptance of Terms\n...\n\n2. Use License\n...`}
  />
);

export default TermsConditions;
