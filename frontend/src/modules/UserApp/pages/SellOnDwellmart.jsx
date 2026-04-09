import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck,
  FiStar,
  FiShoppingBag,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMapPin,
  FiArrowRight,
  FiArrowLeft,
  FiFileText,
  FiCreditCard,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import DesktopHeader from '../components/Layout/DesktopHeader';
import MobileHeader from '../components/Layout/MobileHeader';
import Footer from '../components/Layout/Footer';

const STEPS = ['Plans', 'Registration', 'Thank You'];

const SellOnDwellmart = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [termsContent, setTermsContent] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tradeLicense, setTradeLicense] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [razorpayData, setRazorpayData] = useState(null);
  const [stripeData, setStripeData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'razorpay' or 'stripe'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tempSelectedPlan, setTempSelectedPlan] = useState(null);

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

  // Fetch plans and terms
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, termsRes] = await Promise.all([
          api.get('/subscription-plans'),
          api.get('/vendor-terms'),
        ]);
        const fetchedPlans = plansRes?.data || [];
        setPlans(fetchedPlans);
        setTermsContent(termsRes?.data?.content || '');

        // Handle Stripe Success Redirect
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('success') === 'true' && queryParams.get('session_id')) {
          const sessionId = queryParams.get('session_id');
          const planId = queryParams.get('plan_id');
          const plan = fetchedPlans.find(p => p._id === planId);
          if (plan) {
            setStripeData({ stripe_session_id: sessionId });
            setPaymentMethod('stripe');
            setSelectedPlan(plan);
            setCurrentStep(1);
            toast.success('Payment successful! Now complete your registration.');
            
            // Cleanup URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (queryParams.get('canceled') === 'true') {
          toast.error('Payment was canceled.');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan.price > 0 && !plan.isTrial) {
      setTempSelectedPlan(plan);
      setShowPaymentModal(true);
    } else {
      setSelectedPlan(plan);
      setPaymentMethod(null);
      setCurrentStep(1);
    }
  };

  const handleRazorpay = async () => {
    const plan = tempSelectedPlan;
    setShowPaymentModal(false);
    try {
      const response = await api.post('/subscription/create-order', { planId: plan._id });
      const { orderId, amount, currency, keyId } = response.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "DwellMart",
        description: `Subscription: ${plan.name}`,
        order_id: orderId,
        handler: function (response) {
          setRazorpayData({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          setPaymentMethod('razorpay');
          setSelectedPlan(plan);
          setCurrentStep(1);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      toast.error('Could not initiate payment.');
    }
  };

  const handleStripe = async () => {
    const plan = tempSelectedPlan;
    setShowPaymentModal(false);
    setIsLoading(true);
    try {
      const response = await api.post('/subscription/create-stripe-session', {
        planId: plan._id,
        returnPath: window.location.pathname,
      });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Stripe Error:', err);
      toast.error('Could not initiate Stripe payment.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.storeName) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!tradeLicense) {
      toast.error('Trade Licence document is required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (!agreedToTerms) {
      toast.error('You must agree to the Terms & Conditions.');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('email', formData.email.trim().toLowerCase());
      submitData.append('password', formData.password);
      submitData.append('phone', formData.phone.trim());
      submitData.append('storeName', formData.storeName.trim());
      submitData.append('storeDescription', formData.storeDescription.trim());
      submitData.append('address', JSON.stringify(formData.address));
      submitData.append('selectedPlanId', selectedPlan._id);
      submitData.append('agreedToTerms', true);
      submitData.append('tradeLicense', tradeLicense);
      submitData.append('payment_method', paymentMethod);

      if (paymentMethod === 'razorpay' && razorpayData) {
        submitData.append('razorpay_order_id', razorpayData.razorpay_order_id);
        submitData.append('razorpay_payment_id', razorpayData.razorpay_payment_id);
        submitData.append('razorpay_signature', razorpayData.razorpay_signature);
      } else if (paymentMethod === 'stripe' && stripeData) {
        submitData.append('stripe_session_id', stripeData.stripe_session_id);
      }

      await api.post('/vendor/auth/register', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Registration successful! Please verify your email.');
      setCurrentStep(2);
    } catch (error) {
      // Error toast is handled by api interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <DesktopHeader hideSellButton={true} />
      <MobileHeader hideSellButton={true} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            Sell on <span className="text-primary-400">DwellMart</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto"
          >
            Join our marketplace and reach millions of customers. Choose a plan that fits your business.
          </motion.p>
        </div>
      </section>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    idx < currentStep
                      ? 'bg-primary-600 text-white'
                      : idx === currentStep
                      ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {idx < currentStep ? <FiCheck /> : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    idx <= currentStep ? 'text-primary-700' : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-16 md:w-24 h-1 mx-2 rounded-full transition-all duration-300 ${
                    idx < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Plans */}
          {currentStep === 0 && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
                Choose Your Membership Plan
              </h2>
              {plans.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No plans available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan._id}
                      whileHover={{ y: -4 }}
                      className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all ${
                        plan.isMostPopular
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-100 hover:border-primary-300'
                      }`}
                    >
                      {plan.isMostPopular && (
                        <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                          <FiStar className="text-xs" /> MOST POPULAR
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-3xl font-extrabold text-gray-900">
                            {plan.price === 0 ? 'FREE' : `${plan.price.toFixed(2)}`}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-sm text-gray-500">{plan.currency || 'AED'}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          for {plan.durationDays} day{plan.durationDays > 1 ? 's' : ''}
                        </p>
                        {plan.description && (
                          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                        )}
                        {plan.features?.length > 0 && (
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <FiCheck className="text-primary-500 mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full py-3 rounded-xl font-semibold transition-all ${
                            plan.isTrial
                              ? 'bg-gray-800 text-white hover:bg-gray-700'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {plan.isTrial ? 'Start Free Trial' : 'Select Plan'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Registration */}
          {currentStep === 1 && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm font-medium"
                  >
                    <FiArrowLeft /> Back to Plans
                  </button>
                  {selectedPlan && (
                    <span className="text-sm text-primary-600 font-semibold bg-primary-50 px-3 py-1 rounded-full">
                      {selectedPlan.name}
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiShoppingBag className="text-primary-600 text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Register Your Store</h2>
                    <p className="text-gray-500 text-sm mt-1">Fill in your details to start selling</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Personal Info */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-700 mb-3">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text" name="name" value={formData.name} onChange={handleChange}
                              placeholder="John Doe" required
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email" name="email" value={formData.email} onChange={handleChange}
                              placeholder="vendor@example.com" required
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel" name="phone" value={formData.phone} onChange={handleChange}
                              placeholder="+1234567890" required
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-700 mb-3">Store Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Store Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text" name="storeName" value={formData.storeName} onChange={handleChange}
                              placeholder="My Awesome Store" required
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Store Description</label>
                          <textarea
                            name="storeDescription" value={formData.storeDescription} onChange={handleChange}
                            placeholder="Tell customers about your store..." rows={3}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm resize-none"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">
                          Trade Licence Document <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf, .doc, .docx, image/*"
                            onChange={(e) => setTradeLicense(e.target.files[0])}
                            required
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Accepted formats: PDF, Word, Images (Max 10MB).</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-700 mb-3">Business Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Street</label>
                          <div className="relative">
                            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text" name="address.street" value={formData.address.street} onChange={handleChange}
                              placeholder="123 Main Street"
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">City</label>
                          <input
                            type="text" name="address.city" value={formData.address.city} onChange={handleChange}
                            placeholder="City"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">State</label>
                          <input
                            type="text" name="address.state" value={formData.address.state} onChange={handleChange}
                            placeholder="State"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Zip Code</label>
                          <input
                            type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange}
                            placeholder="10001"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Country</label>
                          <input
                            type="text" name="address.country" value={formData.address.country} onChange={handleChange}
                            placeholder="Country"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-700 mb-3">Account Security</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showPassword ? 'text' : 'password'} name="password"
                              value={formData.password} onChange={handleChange}
                              placeholder="Min 6 characters" required
                              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                              value={formData.confirmPassword} onChange={handleChange}
                              placeholder="Re-enter password" required
                              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder:text-gray-400 text-sm"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="agreeTerms"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                        />
                        <label htmlFor="agreeTerms" className="text-sm text-gray-600 cursor-pointer">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-primary-600 hover:text-primary-700 underline font-medium"
                          >
                            Terms & Conditions
                          </button>
                          <span className="text-red-500"> *</span>
                        </label>
                      </div>
                    </div>

                    {/* Info */}
                    {selectedPlan && selectedPlan.price > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-sm text-emerald-800">
                          <strong>Payment Verified:</strong> {paymentMethod === 'razorpay' ? 'Razorpay' : 'Stripe'} payment of{' '}
                          <strong>{selectedPlan.price} {selectedPlan.currency || 'AED'}</strong> has been received. 
                          Complete this form to finish registration.
                        </p>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || !agreedToTerms}
                      className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        'Registering...'
                      ) : (
                        <>
                          Register & Continue <FiArrowRight />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Thank You */}
          {currentStep === 2 && (
            <motion.div
              key="thankyou"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="text-green-600 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
                <p className="text-gray-500 mb-6">
                  We've sent a verification OTP to your email. Please verify your email and await admin approval.
                </p>
                {selectedPlan && selectedPlan.price > 0 && (
                  <p className="text-sm text-gray-500 mb-6 bg-gray-50 rounded-lg p-3">
                    Your <strong>{selectedPlan.name}</strong> subscription payment will be confirmed by our admin team.
                  </p>
                )}
                <button
                  onClick={() => navigate('/vendor/verification', { state: { email: formData.email } })}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
                >
                  Verify Email
                </button>
                <button
                  onClick={() => navigate('/vendor/login')}
                  className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Go to Vendor Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Method Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">Select Payment Method</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Payment for {tempSelectedPlan?.name} ({tempSelectedPlan?.price} {tempSelectedPlan?.currency || 'AED'})
                </p>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <button
                  onClick={handleRazorpay}
                  className="w-full py-4 px-6 bg-[#3392fd] text-white rounded-xl font-bold hover:bg-[#2081eb] transition-all flex items-center justify-between group"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                      <FiStar className="text-white" />
                    </div>
                    Razorpay
                  </span>
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </button>
                <button
                  onClick={handleStripe}
                  className="w-full py-4 px-6 bg-[#635bff] text-white rounded-xl font-bold hover:bg-[#5851e0] transition-all flex items-center justify-between group"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                      <FiCreditCard className="text-white" />
                    </div>
                    Stripe (Cards)
                  </span>
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-3 mt-2 text-gray-400 font-medium hover:text-gray-600 transition-all flex items-center justify-center gap-2"
                >
                  <FiX size={14} /> Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <FiFileText className="text-primary-600" />
                  <h3 className="font-bold text-gray-800">Terms & Conditions</h3>
                </div>
                <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {termsContent ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: termsContent }}
                  />
                ) : (
                  <p className="text-gray-400 text-center py-8">No terms & conditions have been set yet.</p>
                )}
              </div>
              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
                >
                  I Agree
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default SellOnDwellmart;
