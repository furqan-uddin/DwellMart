import { useState } from 'react';
import { FiSave, FiEdit } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Content = () => {
  const [activeTab, setActiveTab] = useState('homepage');
  const [content, setContent] = useState({
    homepage: {
      heroTitle: 'Welcome to Our Store',
      heroSubtitle: 'Discover Amazing Products',
      aboutUs: 'About us content...',
    },
    terms: 'Terms and conditions content...',
    privacy: 'Privacy policy content...',
    faq: [],
  });

  const handleSave = () => {
    localStorage.setItem('admin-content', JSON.stringify(content));
    toast.success('Content saved successfully');
  };

  const tabs = [
    { id: 'homepage', label: 'Homepage' },
    { id: 'about', label: 'About Us' },
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Content Management</h1>
          <p className="text-gray-600">Manage website content and pages</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold"
        >
          <FiSave />
          Save All
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'homepage' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={content.homepage.heroTitle}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      homepage: { ...content.homepage, heroTitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hero Subtitle
                </label>
                <input
                  type="text"
                  value={content.homepage.heroSubtitle}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      homepage: { ...content.homepage, heroSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={content.terms}
                onChange={(e) => setContent({ ...content, terms: e.target.value })}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Privacy Policy
              </label>
              <textarea
                value={content.privacy}
                onChange={(e) => setContent({ ...content, privacy: e.target.value })}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Content;

