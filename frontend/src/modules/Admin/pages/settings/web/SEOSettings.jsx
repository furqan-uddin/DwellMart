import { useState } from "react";
import { FiSave, FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import AnimatedSelect from "../../../components/AnimatedSelect";
import toast from "react-hot-toast";

const SEOSettings = () => {
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: "My E-commerce Store - Shop Online",
    metaDescription: "Discover amazing products at great prices. Shop now!",
    metaKeywords: "ecommerce, online shopping, products, deals",
    ogTitle: "My E-commerce Store",
    ogDescription: "Your trusted online shopping destination",
    ogImage: "data/logos/og-image.jpg",
    twitterCard: "summary_large_image",
    canonicalUrl: "https://mystore.com",
    robots: "index, follow",
  });

  const handleSave = () => {
    toast.success("SEO settings saved successfully");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            SEO Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Optimize your store for search engines
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold text-sm">
          <FiSave />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiSearch className="inline mr-2" />
              Meta Title
            </label>
            <input
              type="text"
              value={seoSettings.metaTitle}
              onChange={(e) =>
                setSeoSettings({ ...seoSettings, metaTitle: e.target.value })
              }
              placeholder="Page title for search engines"
              maxLength={60}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {seoSettings.metaTitle.length}/60 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={seoSettings.metaDescription}
              onChange={(e) =>
                setSeoSettings({
                  ...seoSettings,
                  metaDescription: e.target.value,
                })
              }
              placeholder="Brief description for search results"
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {seoSettings.metaDescription.length}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              value={seoSettings.metaKeywords}
              onChange={(e) =>
                setSeoSettings({ ...seoSettings, metaKeywords: e.target.value })
              }
              placeholder="Comma-separated keywords"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OG Title
              </label>
              <input
                type="text"
                value={seoSettings.ogTitle}
                onChange={(e) =>
                  setSeoSettings({ ...seoSettings, ogTitle: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OG Image URL
              </label>
              <input
                type="text"
                value={seoSettings.ogImage}
                onChange={(e) =>
                  setSeoSettings({ ...seoSettings, ogImage: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OG Description
            </label>
            <textarea
              value={seoSettings.ogDescription}
              onChange={(e) =>
                setSeoSettings({
                  ...seoSettings,
                  ogDescription: e.target.value,
                })
              }
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canonical URL
              </label>
              <input
                type="url"
                value={seoSettings.canonicalUrl}
                onChange={(e) =>
                  setSeoSettings({
                    ...seoSettings,
                    canonicalUrl: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Robots
              </label>
              <AnimatedSelect
                value={seoSettings.robots}
                onChange={(e) =>
                  setSeoSettings({ ...seoSettings, robots: e.target.value })
                }
                options={[
                  { value: "index, follow", label: "Index, Follow" },
                  { value: "noindex, follow", label: "No Index, Follow" },
                  { value: "index, nofollow", label: "Index, No Follow" },
                  { value: "noindex, nofollow", label: "No Index, No Follow" },
                ]}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold">
            Save SEO Settings
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default SEOSettings;
