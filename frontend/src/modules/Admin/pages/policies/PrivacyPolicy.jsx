import AdminPageEditor from '../../components/AdminPageEditor';

const PrivacyPolicy = () => (
  <AdminPageEditor
    slug="privacy"
    pageTitle="Privacy Policy"
    description="Manage your store's privacy policy shown to users."
    placeholder={`Privacy Policy\n\nLast updated: ...\n\n1. Information We Collect\n...\n\n2. How We Use Information\n...`}
  />
);

export default PrivacyPolicy;
