import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiCheck,
  FiCreditCard,
  FiFileText,
  FiLoader,
  FiLock,
  FiMail,
  FiPhone,
  FiShoppingBag,
  FiStar,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import {
  getPublicSubscriptionPlans,
  getVendorOnboardingStatus,
  initiateVendorOnboardingSubscription,
  selectVendorSubscriptionPlan,
} from '../services/vendorService';
import StripeSubscriptionForm from './StripeSubscriptionForm';

const STEPS = ['Plans', 'Registration', 'Payment', 'Done'];
const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout.'));
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
};

const formatPrice = (plan) => {
  const inr = Number(plan?.pricing?.inr ?? plan?.price_inr ?? 0);
  const usd = Number(plan?.pricing?.usd ?? plan?.price_usd ?? 0);
  if (inr === 0 && usd === 0) return 'Free';
  return `Rs. ${inr.toFixed(0)} / ${usd.toFixed(2)}`;
};

const getHighlights = (plan) => {
  if (Array.isArray(plan?.featureHighlights)) return plan.featureHighlights;
  if (Array.isArray(plan?.features?.highlights)) return plan.features.highlights;
  return [];
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const SubscriptionOnboardingWizard = ({
  emailStorageKey,
  returnTo,
  title,
  subtitle,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectionStorageKey = `${emailStorageKey}:selection-token`;

  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectionToken, setSelectionToken] = useState('');
  const [onboardingEmail, setOnboardingEmail] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentState, setPaymentState] = useState('idle');
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStripe, setShowStripe] = useState(false);
  const [stripeConfig, setStripeConfig] = useState({ clientSecret: '', publishableKey: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('tradeLicense');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeDescription: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  const paymentEmail = onboardingEmail || sessionStorage.getItem(emailStorageKey) || formData.email.trim().toLowerCase();

  const persistEmail = (email) => {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return;
    sessionStorage.setItem(emailStorageKey, normalized);
    setOnboardingEmail(normalized);
  };

  const clearStorage = () => {
    sessionStorage.removeItem(emailStorageKey);
    sessionStorage.removeItem(selectionStorageKey);
    setOnboardingEmail('');
    setSelectionToken('');
  };

  const syncFromStatus = async (email, availablePlans = plans) => {
    const response = await getVendorOnboardingStatus(email);
    const data = response?.data || {};
    const matchedPlan = data.selectedPlan || availablePlans.find((plan) => plan._id === data.selectedPlanId) || null;
    if (matchedPlan) setSelectedPlan(matchedPlan);

    if (data.nextStep === 'verify_email') {
      navigate('/vendor/verification', { replace: true, state: { email, returnTo } });
      return false;
    }
    if (data.nextStep === 'choose_plan') {
      persistEmail(email);
      setStep(0);
      return false;
    }
    if (data.nextStep === 'complete_payment') {
      persistEmail(email);
      setStep(2);
      return false;
    }
    if (data.nextStep === 'awaiting_admin_approval') {
      setStep(3);
      setPaymentState('confirmed');
      clearStorage();
      return true;
    }
    if (data.nextStep === 'approved') {
      toast.success('Your vendor account is already active. Please login.');
      navigate('/vendor/login', { replace: true });
      return true;
    }
    if (data.nextStep === 'rejected' || data.nextStep === 'suspended') {
      toast.error('This onboarding cannot continue. Please contact support.');
      navigate('/vendor/login', { replace: true });
      return true;
    }
    return false;
  };

  const pollStatus = async (email, attempt = 0) => {
    if (!email) return false;
    const done = await syncFromStatus(email);
    if (done) return true;
    if (attempt >= 8) {
      setPaymentState('pending');
      return false;
    }
    await wait(3000);
    return pollStatus(email, attempt + 1);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedEmail = sessionStorage.getItem(emailStorageKey) || '';
        const savedToken = sessionStorage.getItem(selectionStorageKey) || '';
        const resumeEmail = location.state?.resumeEmail || savedEmail;
        const [plansRes, termsRes] = await Promise.all([
          getPublicSubscriptionPlans(),
          api.get('/vendor-terms'),
        ]);
        const fetchedPlans = plansRes?.data || [];
        setPlans(fetchedPlans);
        setTermsContent(termsRes?.data?.content || '');
        setSelectionToken(savedToken);

        const query = new URLSearchParams(window.location.search);
        if ((query.get('payment') === 'processing' || query.get('redirect_status')) && resumeEmail) {
          persistEmail(resumeEmail);
          setStep(2);
          setPaymentState('processing');
          await pollStatus(resumeEmail);
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        if (resumeEmail) {
          await syncFromStatus(resumeEmail, fetchedPlans);
        }
      } catch {
        toast.error('Unable to load vendor onboarding.');
      }
    };

    bootstrap();
  }, [emailStorageKey, location.state, navigate, returnTo]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectPlan = async (plan) => {
    setIsLoading(true);
    try {
      const response = await selectVendorSubscriptionPlan(plan._id, formData.address.country);
      const token = response?.data?.selectionToken || '';
      setSelectedPlan(plan);
      setSelectionToken(token);
      sessionStorage.setItem(selectionStorageKey, token);
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!selectedPlan?._id || !selectionToken) {
      toast.error('Please select a subscription plan first.');
      setStep(0);
      return;
    }
    if (!documentFile) {
      toast.error(`Please upload your ${documentType === 'gst' ? 'GST' : 'Trade Licence'} document.`);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      toast.error('You must agree to the Terms & Conditions.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('password', formData.password);
      payload.append('phone', formData.phone.trim());
      payload.append('storeName', formData.storeName.trim());
      payload.append('storeDescription', formData.storeDescription.trim());
      payload.append('selectionToken', selectionToken);
      payload.append('selectedPlanId', selectedPlan._id);
      payload.append('documentType', documentType);
      payload.append('address', JSON.stringify(formData.address));
      payload.append('agreedToTerms', true);
      payload.append('document', documentFile);

      const response = await api.post('/vendor/auth/register', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const responseData = response?.data || {};
      const email = String(responseData.email || formData.email || '').trim().toLowerCase();
      persistEmail(email);

      if (responseData.resume) {
        await syncFromStatus(email, plans);
        return;
      }

      navigate('/vendor/verification', {
        state: {
          email,
          returnTo,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openRazorpayCheckout = async (checkout) => {
    const Razorpay = await loadRazorpayScript();
    const instance = new Razorpay({
      key: checkout.keyId,
      subscription_id: checkout.subscriptionId,
      name: 'DwellMart Vendor Billing',
      description: selectedPlan ? `${selectedPlan.name} subscription` : 'Vendor subscription',
      prefill: {
        name: formData.name,
        email: paymentEmail,
        contact: formData.phone,
      },
      theme: { color: '#0f766e' },
      handler: async () => {
        setPaymentState('processing');
        toast.success('Authorization received. Waiting for billing confirmation.');
        await pollStatus(paymentEmail);
      },
      modal: {
        ondismiss: () => {
          if (paymentState !== 'processing') {
            toast.error('Payment window was closed.');
          }
        },
      },
    });
    instance.open();
  };

  const handlePayment = async () => {
    if (!paymentEmail) {
      toast.error('Please verify your email first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await initiateVendorOnboardingSubscription(paymentEmail, {
        selectionToken,
        selectedPlanId: selectedPlan?._id,
      });
      const data = response?.data || {};
      if (data.subscription?.plan) {
        setSelectedPlan(data.subscription.plan);
      }

      if (data.status === 'active' || data.alreadyActive) {
        setStep(3);
        setPaymentState('confirmed');
        clearStorage();
        return;
      }

      if (data.gateway === 'stripe') {
        if (data.checkout?.clientSecret) {
          setStripeConfig({
            clientSecret: data.checkout.clientSecret,
            publishableKey: data.checkout.publishableKey,
          });
          setShowStripe(true);
        } else {
          setPaymentState('processing');
          await pollStatus(paymentEmail);
        }
        return;
      }

      if (data.gateway === 'razorpay') {
        setPaymentState('processing');
        await openRazorpayCheckout(data.checkout);
      }
    } catch {
      setPaymentState('failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 md:text-base">{subtitle}</p>
        </div>

        <div className="mb-10 flex items-center justify-center">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${index < step ? 'bg-teal-600 text-white' : index === step ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {index < step ? <FiCheck /> : index + 1}
                </div>
                <span className={`mt-2 text-xs font-medium ${index <= step ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
              </div>
              {index < STEPS.length - 1 ? <div className={`mx-2 h-1 w-14 rounded-full md:w-24 ${index < step ? 'bg-teal-500' : 'bg-slate-200'}`} /> : null}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div key="plans" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div key={plan._id} className={`relative rounded-[28px] border p-6 ${selectedPlan?._id === plan._id ? 'border-teal-500 bg-teal-50/80 shadow-lg shadow-teal-100' : 'border-slate-200 bg-white'}`}>
                    {plan.isMostPopular ? (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase text-amber-700">
                        <FiStar size={12} />
                        Popular
                      </span>
                    ) : null}
                    <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                    <p className="mt-3 text-3xl font-black text-slate-900">{formatPrice(plan)}</p>
                    <p className="mt-1 text-sm text-slate-500">per {plan.interval}</p>
                    <ul className="mt-5 space-y-2">
                      {getHighlights(plan).map((feature) => (
                        <li key={`${plan._id}-${feature}`} className="flex items-start gap-2 text-sm text-slate-600">
                          <FiCheck className="mt-0.5 text-teal-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => handleSelectPlan(plan)} disabled={isLoading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                      {isLoading && selectedPlan?._id === plan._id ? <FiLoader className="animate-spin" /> : null}
                      {selectedPlan?._id === plan._id ? 'Selected' : 'Choose Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div key="register" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
                  <FiArrowLeft />
                  Back to plans
                </button>
                {selectedPlan ? <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">{selectedPlan.name}</span> : null}
              </div>
              <form onSubmit={handleRegister} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl md:p-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="name" value={formData.name} onChange={handleChange} required placeholder="Full name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500" />
                  </label>
                  <label className="relative">
                    <FiShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="storeName" value={formData.storeName} onChange={handleChange} required placeholder="Store name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500" />
                  </label>
                  <label className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500" />
                  </label>
                  <label className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="Phone" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500" />
                  </label>
                  <textarea name="storeDescription" value={formData.storeDescription} onChange={handleChange} rows={3} placeholder="Store description" className="md:col-span-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <input name="address.street" value={formData.address.street} onChange={handleChange} placeholder="Street" className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <input name="address.city" value={formData.address.city} onChange={handleChange} placeholder="City" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <input name="address.state" value={formData.address.state} onChange={handleChange} placeholder="State" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <input name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} placeholder="Zip code" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <input name="address.country" value={formData.address.country} onChange={handleChange} placeholder="Country" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500" />
                  <label className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm outline-none focus:border-teal-500" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">{showPassword ? 'Hide' : 'Show'}</button>
                  </label>
                  <label className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm outline-none focus:border-teal-500" />
                    <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">{showConfirmPassword ? 'Hide' : 'Show'}</button>
                  </label>
                  <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500">
                    <option value="tradeLicense">Trade Licence</option>
                    <option value="gst">GST</option>
                  </select>
                  <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-teal-100 file:px-4 file:py-2 file:font-semibold file:text-teal-700" />
                </div>
                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3 text-sm text-slate-600">
                    <input type="checkbox" checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600" />
                    <span>I agree to the <button type="button" onClick={() => setShowTerms(true)} className="font-semibold text-teal-700 underline">Terms & Conditions</button></span>
                  </label>
                </div>
                <button type="submit" disabled={isLoading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60">
                  {isLoading ? <FiLoader className="animate-spin" /> : <FiMail />}
                  Register and verify email
                </button>
              </form>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div key="payment" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-2xl">
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700"><FiCreditCard size={28} /></div>
                  <h2 className="text-2xl font-bold text-slate-900">Complete your subscription</h2>
                  <p className="mt-2 text-sm text-slate-500">Billing becomes active only after webhook confirmation updates MongoDB.</p>
                </div>
                {selectedPlan ? <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-700">{selectedPlan.name} · {formatPrice(selectedPlan)} · per {selectedPlan.interval}</div> : null}
                {paymentState === 'processing' ? <div className="mt-6 rounded-3xl border border-teal-200 bg-teal-50 px-4 py-4 text-sm text-teal-800">Waiting for billing confirmation. This page will keep checking automatically.</div> : null}
                {paymentState === 'pending' ? <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">Payment is still pending confirmation. Please give the gateway a moment and retry if needed.</div> : null}
                {paymentState === 'failed' ? <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">Billing could not be confirmed. Please retry the payment step.</div> : null}
                <div className="mt-6 flex flex-col gap-3">
                  <button type="button" onClick={handlePayment} disabled={isLoading || paymentState === 'processing'} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                    {isLoading ? <FiLoader className="animate-spin" /> : <FiCreditCard />}
                    {paymentState === 'processing' ? 'Checking payment status...' : 'Start secure payment'}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100">Back to registration</button>
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg">
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><FiCheck size={28} /></div>
                <h2 className="text-2xl font-bold text-slate-900">Subscription submitted successfully</h2>
                <p className="mt-3 text-sm text-slate-500">Your billing is synced from the gateway and your vendor account is now awaiting admin approval.</p>
                <button type="button" onClick={() => navigate('/vendor/login')} className="mt-6 w-full rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700">Go to vendor login</button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <StripeSubscriptionForm
        open={showStripe}
        clientSecret={stripeConfig.clientSecret}
        publishableKey={stripeConfig.publishableKey}
        onClose={() => setShowStripe(false)}
        onSubmitted={async () => {
          setShowStripe(false);
          setPaymentState('processing');
          await pollStatus(paymentEmail);
        }}
      />

      <AnimatePresence>
        {showTerms ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setShowTerms(false)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div className="flex items-center gap-2"><FiFileText className="text-teal-700" /><h3 className="font-bold text-slate-900">Terms & Conditions</h3></div>
                <button type="button" onClick={() => setShowTerms(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><FiX /></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-5">{termsContent ? <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: termsContent }} /> : <p className="text-sm text-slate-500">No terms are configured yet.</p>}</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default SubscriptionOnboardingWizard;

