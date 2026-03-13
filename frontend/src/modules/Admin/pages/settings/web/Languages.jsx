import { useState } from 'react';
import { FiGlobe, FiCheck, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Languages = () => {
  const [languages, setLanguages] = useState([
    { id: 1, code: 'en', name: 'English', nativeName: 'English', enabled: true, default: true },
    { id: 2, code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true, default: false },
    { id: 3, code: 'fr', name: 'French', nativeName: 'Français', enabled: false, default: false },
    { id: 4, code: 'de', name: 'German', nativeName: 'Deutsch', enabled: false, default: false },
  ]);

  const toggleLanguage = (id) => {
    setLanguages(languages.map((lang) =>
      lang.id === id ? { ...lang, enabled: !lang.enabled } : lang
    ));
    toast.success('Language setting updated');
  };

  const setDefault = (id) => {
    setLanguages(languages.map((lang) => ({
      ...lang,
      default: lang.id === id,
    })));
    toast.success('Default language updated');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Languages</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage store languages and translations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm">
          <FiPlus />
          <span>Add Language</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {languages.map((lang) => (
            <div key={lang.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FiGlobe className="text-primary-600 text-xl" />
                <div>
                  <h3 className="font-semibold text-gray-800">{lang.name}</h3>
                  <p className="text-sm text-gray-500">{lang.nativeName} ({lang.code})</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {lang.default && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold">
                    Default
                  </span>
                )}
                {!lang.default && lang.enabled && (
                  <button
                    onClick={() => setDefault(lang.id)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => toggleLanguage(lang.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    lang.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lang.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Languages;

