import { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";
import { useSettingsStore } from "../../../../shared/store/settingsStore";

const SEOSettings = () => {
  const { settings, updateSettings, initialize } = useSettingsStore();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    initialize();
    if (settings && settings.seo) {
      setFormData(settings.seo);
    }
  }, []);

  useEffect(() => {
    if (settings && settings.seo) {
      setFormData(settings.seo);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings("seo", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Meta Title
        </label>
        <input
          type="text"
          name="metaTitle"
          value={formData.metaTitle || ""}
          onChange={handleChange}
          maxLength={60}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.metaTitle?.length || 0}/60 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Meta Description
        </label>
        <textarea
          name="metaDescription"
          value={formData.metaDescription || ""}
          onChange={handleChange}
          rows={3}
          maxLength={160}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.metaDescription?.length || 0}/160 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Meta Keywords
        </label>
        <input
          type="text"
          name="metaKeywords"
          value={formData.metaKeywords || ""}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="keyword1, keyword2, keyword3"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Open Graph Image URL
        </label>
        <input
          type="text"
          name="ogImage"
          value={formData.ogImage || ""}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="data/logos/og-image.png"
        />
        {formData.ogImage && (
          <img
            src={formData.ogImage}
            alt="OG Preview"
            className="mt-4 w-32 h-32 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold">
          <FiSave />
          Save Settings
        </button>
      </div>
    </form>
  );
};

export default SEOSettings;
