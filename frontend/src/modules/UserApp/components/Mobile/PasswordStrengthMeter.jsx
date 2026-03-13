import { motion } from 'framer-motion';
import { useMemo } from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return 0;
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    
    return Math.min(score, 4);
  }, [password]);

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(strength / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${strengthColors[strength] || strengthColors[0]} rounded-full`}
          />
        </div>
        <span className={`text-xs font-semibold ${
          strength === 0 ? 'text-red-600' :
          strength === 1 ? 'text-orange-600' :
          strength === 2 ? 'text-yellow-600' :
          strength === 3 ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {strengthLabels[strength] || strengthLabels[0]}
        </span>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;

