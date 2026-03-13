import { useState } from 'react';
import { FiSave, FiFileText } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const TermsConditions = () => {
  const [content, setContent] = useState(`Terms & Conditions

Last updated: ${new Date().toLocaleDateString()}

1. Acceptance of Terms
By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.

2. Use License
Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.

3. Disclaimer
The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied.

4. Limitations
In no event shall our company or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.

5. Revisions
We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms.`);

  const handleSave = () => {
    toast.success('Terms & conditions saved successfully');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Terms & Conditions</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your store's terms and conditions</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold text-sm"
        >
          <FiSave />
          <span>Save Policy</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <FiFileText className="text-primary-600" />
          <h3 className="font-semibold text-gray-800">Terms & Conditions Content</h3>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        />
      </div>
    </motion.div>
  );
};

export default TermsConditions;

