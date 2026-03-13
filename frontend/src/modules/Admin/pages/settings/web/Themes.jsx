import { useState } from 'react';
import { FiCheck, FiDroplet } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Themes = () => {
  const [themes] = useState([
    { id: 1, name: 'Light', primaryColor: '#4F46E5', secondaryColor: '#10B981', active: true },
    { id: 2, name: 'Dark', primaryColor: '#6366F1', secondaryColor: '#14B8A6', active: false },
    { id: 3, name: 'Blue', primaryColor: '#3B82F6', secondaryColor: '#06B6D4', active: false },
    { id: 4, name: 'Green', primaryColor: '#10B981', secondaryColor: '#059669', active: false },
  ]);
  const [selectedTheme, setSelectedTheme] = useState(themes.find(t => t.active) || themes[0]);

  const handleSelectTheme = (theme) => {
    setSelectedTheme(theme);
    toast.success(`Theme "${theme.name}" selected`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="lg:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Themes</h1>
        <p className="text-sm sm:text-base text-gray-600">Customize your store appearance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map((theme) => (
          <div
            key={theme.id}
            onClick={() => handleSelectTheme(theme)}
            className={`bg-white rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all ${
              selectedTheme.id === theme.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FiDroplet className="text-primary-600 text-xl" />
                <h3 className="font-semibold text-gray-800">{theme.name}</h3>
              </div>
              {selectedTheme.id === theme.id && (
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                  <FiCheck className="text-white text-sm" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Primary</p>
                <div
                  className="w-16 h-16 rounded-lg border border-gray-200"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Secondary</p>
                <div
                  className="w-16 h-16 rounded-lg border border-gray-200"
                  style={{ backgroundColor: theme.secondaryColor }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Themes;

