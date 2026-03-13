import { useState, useEffect } from 'react';
import { FiGlobe, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useVendorAuthStore } from "../store/vendorAuthStore";
import toast from 'react-hot-toast';

const LanguageSettings = () => {
  const { vendor } = useVendorAuthStore();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [productTranslations, setProductTranslations] = useState([]);

  const vendorId = vendor?.id;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
  ];

  useEffect(() => {
    if (!vendorId) return;
    const saved = localStorage.getItem(`vendor-${vendorId}-language`);
    if (saved) setSelectedLanguage(saved);

    const savedTranslations = localStorage.getItem(`vendor-${vendorId}-translations`);
    if (savedTranslations) setProductTranslations(JSON.parse(savedTranslations));
  }, [vendorId]);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem(`vendor-${vendorId}-language`, langCode);
    toast.success('Language preference saved');
  };

  if (!vendorId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to view language settings</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FiGlobe className="text-primary-600" />
          Language Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Manage interface language and product translations</p>
      </div>

      {/* Interface Language */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Interface Language</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${selectedLanguage === lang.code
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}>
              <span className="font-semibold">{lang.name}</span>
              {selectedLanguage === lang.code && (
                <FiCheck className="text-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product Translations */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Product Translations</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage translations for your products in different languages
        </p>
        {productTranslations.length > 0 ? (
          <div className="space-y-3">
            {productTranslations.map((translation) => (
              <div key={translation.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{translation.productName}</p>
                <p className="text-sm text-gray-600">{translation.language}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No translations available</p>
            <p className="text-sm mt-2">Product translations will appear here when available</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LanguageSettings;

