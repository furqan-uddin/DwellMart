import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

const AnimatedInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputRef = useRef(null);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isLabelLifted = isFocused || hasValue;

  return (
    <div className="relative">
      <motion.label
        animate={{
          y: isLabelLifted ? -28 : 0,
          x: isLabelLifted ? 0 : Icon ? 40 : 0,
          scale: isLabelLifted ? 0.85 : 1,
          color: error ? '#EF4444' : isFocused ? '#2874F0' : '#6B7280',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none origin-left ${
          isLabelLifted ? 'z-10' : ''
        }`}
        style={{
          backgroundColor: isLabelLifted ? 'white' : 'transparent',
          paddingLeft: isLabelLifted && Icon ? '0' : '0',
          paddingRight: isLabelLifted ? '4px' : '0',
        }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.label>

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
        )}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            if (onChange) onChange(e);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isLabelLifted ? placeholder : ''}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-12 py-3 rounded-xl border-2 ${
            error
              ? 'border-red-300 focus:border-red-500'
              : isFocused
              ? 'border-primary-500'
              : 'border-gray-200 focus:border-primary-500'
          } focus:outline-none transition-colors text-base`}
          {...props}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <FiXCircle className="text-red-500 text-lg" />
            </motion.div>
          )}
          {!error && hasValue && isFocused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <FiCheckCircle className="text-green-500 text-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
          >
            <motion.span
              animate={{ x: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
            >
              {error}
            </motion.span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedInput;

