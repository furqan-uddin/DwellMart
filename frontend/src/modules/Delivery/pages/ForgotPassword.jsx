import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiMail, FiRefreshCw, FiTruck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageTransition from '../../../shared/components/PageTransition';
import { useDeliveryAuthStore } from '../store/deliveryStore';

const OTP_LENGTH = 6;

const DeliveryForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, verifyResetOtp, isLoading } = useDeliveryAuthStore();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request');
  const [codes, setCodes] = useState(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 'verify' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email.');
      return;
    }

    try {
      await forgotPassword(email.trim().toLowerCase());
      toast.success('If the email exists, reset OTP has been sent.');
      setStep('verify');
    } catch {
      // Global API interceptor shows toast
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1 || (value && !/^\d$/.test(value))) return;
    const next = [...codes];
    next[index] = value;
    setCodes(next);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;
    setCodes(pasted.split(''));
    inputRefs.current[OTP_LENGTH - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = codes.join('');
    if (otp.length !== OTP_LENGTH) {
      toast.error('Please enter the full OTP.');
      return;
    }

    try {
      await verifyResetOtp(email.trim().toLowerCase(), otp);
      toast.success('OTP verified. Please set your new password.');
      navigate(`/delivery/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch {
      // Global API interceptor shows toast
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-2xl p-6 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-green">
                <FiTruck className="text-white text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</h1>
              <p className="text-gray-600 text-sm">
                {step === 'request'
                  ? 'Enter your delivery account email to receive OTP.'
                  : `Enter the OTP sent to ${email}`}
              </p>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="delivery@delivery.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none transition-colors text-base"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gradient-green text-white py-4 rounded-xl font-semibold text-base hover:shadow-glow-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex justify-center gap-2">
                  {codes.map((code, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={code}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-11 h-11 text-center text-lg font-bold bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:text-gray-400 inline-flex items-center gap-2"
                  >
                    <FiRefreshCw />
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Change Email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || codes.some((c) => !c)}
                  className="w-full gradient-green text-white py-4 rounded-xl font-semibold text-base hover:shadow-glow-green transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Verifying...' : <><FiCheck /> Verify OTP</>}
                </button>
              </form>
            )}

            <div className="text-center pt-4">
              <Link to="/delivery/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
                <FiArrowLeft />
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DeliveryForgotPassword;
