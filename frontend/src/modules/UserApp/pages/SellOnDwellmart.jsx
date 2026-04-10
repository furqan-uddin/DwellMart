import DesktopHeader from '../components/Layout/DesktopHeader';
import MobileHeader from '../components/Layout/MobileHeader';
import Footer from '../components/Layout/Footer';
import SubscriptionOnboardingWizard from '../../Vendor/components/SubscriptionOnboardingWizard';

const SellOnDwellmart = () => (
  <div className="min-h-screen bg-slate-50">
    <DesktopHeader hideSellButton />
    <MobileHeader hideSellButton />

    <section className="bg-[linear-gradient(135deg,_#0f172a,_#134e4a_55%,_#ccfbf1)] px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
          Sell on DwellMart with recurring billing built in
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/80">
          Start your vendor onboarding here and the platform will route billing through Razorpay for India or Stripe everywhere else.
        </p>
      </div>
    </section>

    <section className="px-4 py-10">
      <SubscriptionOnboardingWizard
        emailStorageKey="vendor-onboarding-email:/sell-on-dwellmart"
        returnTo="/sell-on-dwellmart"
        title="Start your vendor onboarding"
        subtitle="The same secure onboarding flow powers the public seller page and the dedicated vendor registration page."
      />
    </section>

    <Footer />
  </div>
);

export default SellOnDwellmart;
