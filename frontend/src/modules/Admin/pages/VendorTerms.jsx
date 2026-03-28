import { useState, useEffect } from 'react';
import { FiSave, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const VendorTerms = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await api.get('/admin/settings/vendor-terms');
        setContent(res?.data?.content || '');
        setLastUpdated(res?.data?.lastUpdated || null);
      } catch { /* error */ } finally { setIsLoading(false); }
    };
    fetchTerms();
  }, []);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please enter terms content.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.put('/admin/settings/vendor-terms', { content: content.trim() });
      setLastUpdated(res?.data?.lastUpdated || new Date().toISOString());
      toast.success('Terms & Conditions saved.');
    } catch { /* error */ } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiFileText className="text-primary-600" />
            Vendor Terms & Conditions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vendors must agree to these terms during registration.
            {lastUpdated && (
              <span className="ml-2 text-gray-400">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all disabled:opacity-50 text-sm">
          <FiSave /> {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your vendor Terms & Conditions here. You can use HTML for formatting."
          rows={20}
          className="w-full px-4 py-3 text-sm text-gray-700 focus:outline-none resize-y rounded-lg min-h-[400px]"
        />
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Tip: You can use HTML tags for formatting (e.g. &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;).
      </p>
    </div>
  );
};

export default VendorTerms;
