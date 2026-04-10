import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiMail } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getVendorOnboardingStatus, verifyVendorOTP, resendVendorOTP } from '../services/vendorService';
import toast from 'react-hot-toast';

const VendorVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const OTP_LENGTH = 6;
  const [codes, setCodes] = useState(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const inputRefs = useRef([]);

  const email = location.state?.email || '';
  const returnTo = location.state?.returnTo || '';
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      if (!email) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await getVendorOnboardingStatus(email);
        const data = response?.data || {};

        if (data.nextStep === 'choose_plan' || data.nextStep === 'complete_payment') {
          if (returnTo) {
            sessionStorage.setItem(`vendor-onboarding-email:${returnTo}`, email);
            toast.success(
              data.nextStep === 'complete_payment'
                ? 'Your email is already verified. Continue with the final onboarding step.'
                : 'Your email is already verified. Continue with plan selection.'
            );
            navigate(returnTo, { replace: true });
            return;
          }
          toast.success('Your email is already verified. Please login to continue.');
          navigate('/vendor/login', { replace: true });
          return;
        }

        if (data.nextStep === 'awaiting_admin_approval' || data.nextStep === 'approved') {
          const message =
            data.nextStep === 'approved'
              ? 'Your account is already active. Please login.'
              : 'Your account is already verified and awaiting admin approval.';
          toast.success(message);
          navigate('/vendor/login', { replace: true });
          return;
        }
      } catch {
        // Let the user continue with manual OTP entry if status lookup fails.
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [email, navigate, returnTo]);

  useEffect(() => {
    if (!isCheckingStatus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isCheckingStatus]);

  const handleChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === OTP_LENGTH && /^\d+$/.test(pastedData)) {
      const newCodes = pastedData.split('');
      setCodes(newCodes);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = codes.join('');

    if (verificationCode.length !== OTP_LENGTH) {
      toast.error('Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    try {
      await verifyVendorOTP(email, verificationCode);
      if (returnTo) {
        sessionStorage.setItem(`vendor-onboarding-email:${returnTo}`, email);
        toast.success('Email verified! Continue with the next onboarding step.');
        navigate(returnTo, { replace: true });
      } else {
        toast.success('Email verified! Your account is pending admin approval.');
        navigate('/vendor/login');
      }
    } catch {
      // Error toast is shown by api.js interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      await resendVendorOTP(email);
      toast.success('OTP resent! Please check your email.');
      // Start 30 second cooldown
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // api.js shows toast
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        {isCheckingStatus ? (
          <div className="py-16 text-center text-gray-600">Checking your verification status...</div>
        ) : (
          <>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
            <FiMail className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We've sent a verification code to <br />
            <span className="font-semibold text-gray-800">{email}</span>
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Inputs */}
          <div className="flex justify-center gap-3">
            {codes.map((code, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-16 h-16 text-center text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
              />
            ))}
          </div>

          {/* Resend Code */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Didn't receive the code? Resend"}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || codes.some(code => !code)}
            className="w-full gradient-green text-white py-3 rounded-xl font-semibold hover:shadow-glow-green transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Verifying...'
            ) : (
              <>
                <FiCheck />
                Verify Email
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="text-center pt-4">
            <Link
              to="/vendor/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              <FiArrowLeft />
              Back to Login
            </Link>
          </div>
        </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VendorVerification;

