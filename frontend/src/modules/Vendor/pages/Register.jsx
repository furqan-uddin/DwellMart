import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import SubscriptionOnboardingWizard from '../components/SubscriptionOnboardingWizard';

const VendorRegister = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff,_#f8fafc_48%,_#e2e8f0)] px-4 py-8">
    <div className="mx-auto max-w-6xl">
      <Link
        to="/vendor/login"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <FiArrowLeft />
        Back to vendor login
      </Link>

      <SubscriptionOnboardingWizard
        emailStorageKey="vendor-onboarding-email:/vendor/register"
        returnTo="/vendor/register"
        title="Register as a DwellMart vendor"
        subtitle="Choose a plan, create your vendor account, verify your email, and finish billing through the correct gateway for your region."
      />
    </div>
  </div>
);

export default VendorRegister;
