import { useState } from 'react';
import { FiSave, FiShield, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Authentication = () => {
  const [authSettings, setAuthSettings] = useState({
    emailPassword: true,
    googleSignIn: true,
    facebookSignIn: false,
    phoneAuth: false,
    anonymousAuth: false,
    emailVerification: true,
    passwordReset: true,
  });

  const toggleAuth = (key) => {
    setAuthSettings({ ...authSettings, [key]: !authSettings[key] });
    toast.success('Authentication setting updated');
  };

  const authMethods = [
    { key: 'emailPassword', label: 'Email/Password', description: 'Allow users to sign in with email and password' },
    { key: 'googleSignIn', label: 'Google Sign-In', description: 'Enable Google authentication' },
    { key: 'facebookSignIn', label: 'Facebook Sign-In', description: 'Enable Facebook authentication' },
    { key: 'phoneAuth', label: 'Phone Authentication', description: 'Allow sign-in with phone number' },
    { key: 'anonymousAuth', label: 'Anonymous Auth', description: 'Allow anonymous user sessions' },
    { key: 'emailVerification', label: 'Email Verification', description: 'Require email verification' },
    { key: 'passwordReset', label: 'Password Reset', description: 'Allow users to reset passwords' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Authentication</h1>
          <p className="text-sm sm:text-base text-gray-600">Configure Firebase authentication methods</p>
        </div>
        <button
          onClick={() => toast.success('Authentication settings saved')}
          className="flex items-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold text-sm"
        >
          <FiSave />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <FiShield className="text-primary-600" />
          <h3 className="font-semibold text-gray-800">Authentication Methods</h3>
        </div>
        <div className="space-y-4">
          {authMethods.map((method) => (
            <div key={method.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{method.label}</h4>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
              <button
                onClick={() => toggleAuth(method.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  authSettings[method.key]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {authSettings[method.key] ? (
                  <FiToggleRight className="text-xl" />
                ) : (
                  <FiToggleLeft className="text-xl" />
                )}
                <span className="font-semibold">{authSettings[method.key] ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Authentication;

