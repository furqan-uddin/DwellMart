import { useEffect, useRef, useState } from 'react';
import { FiCreditCard, FiLoader, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

let stripeScriptPromise = null;

const loadStripeScript = () => {
  if (typeof window !== 'undefined' && window.Stripe) {
    return Promise.resolve(window.Stripe);
  }

  if (!stripeScriptPromise) {
    stripeScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve(window.Stripe);
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.body.appendChild(script);
    });
  }

  return stripeScriptPromise;
};

const StripeSubscriptionForm = ({
  open,
  clientSecret,
  publishableKey,
  title = 'Complete Card Payment',
  subtitle = 'Your subscription becomes active only after the billing webhook confirms payment.',
  onClose,
  onSubmitted,
}) => {
  const mountRef = useRef(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const paymentElementRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      if (!open || !clientSecret || !publishableKey || !mountRef.current) return;

      setIsReady(false);

      try {
        const Stripe = await loadStripeScript();
        if (cancelled || !Stripe) return;

        const stripe = Stripe(publishableKey);
        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#0f766e',
              colorBackground: '#f8fafc',
              colorText: '#0f172a',
              borderRadius: '16px',
            },
          },
        });
        const paymentElement = elements.create('payment', {
          layout: 'tabs',
        });

        paymentElement.mount(mountRef.current);
        stripeRef.current = stripe;
        elementsRef.current = elements;
        paymentElementRef.current = paymentElement;
        setIsReady(true);
      } catch (error) {
        toast.error(error.message || 'Unable to load Stripe payment form.');
      }
    };

    setup();

    return () => {
      cancelled = true;
      try {
        paymentElementRef.current?.unmount?.();
      } catch {
        // ignore cleanup issues
      }
      paymentElementRef.current = null;
      elementsRef.current = null;
      stripeRef.current = null;
      setIsReady(false);
    };
  }, [open, clientSecret, publishableKey]);

  const handleConfirm = async () => {
    if (!stripeRef.current || !elementsRef.current) return;

    setIsSubmitting(true);
    try {
      const result = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}?payment=processing`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        toast.error(result.error.message || 'Payment confirmation failed.');
        return;
      }

      toast.success('Payment submitted. Waiting for billing confirmation.');
      onSubmitted?.();
    } catch (error) {
      toast.error(error.message || 'Payment confirmation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <FiCreditCard size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div ref={mountRef} />
          {!isReady && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <FiLoader className="animate-spin" />
              Loading secure payment form...
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isReady || isSubmitting}
            className="flex-1 rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeSubscriptionForm;
