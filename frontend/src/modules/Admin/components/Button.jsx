import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { FiLoader } from 'react-icons/fi';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
  
  // Size variants
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-3 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  // Variant styles
  const variantStyles = {
    primary: {
      base: 'bg-gradient-to-r from-[#2874F0] to-[#4787F7] text-white shadow-[0_2px_8px_rgba(40,116,240,0.15)]',
      hover: 'hover:shadow-[0_4px_12px_rgba(40,116,240,0.25)] hover:scale-[1.02]',
      focus: 'focus:ring-[#2874F0]',
      active: 'active:scale-[0.98]',
    },
    secondary: {
      base: 'bg-gray-50 text-gray-700 border border-gray-200',
      hover: 'hover:bg-gray-100',
      focus: 'focus:ring-gray-400',
      active: 'active:scale-[0.98]',
    },
    danger: {
      base: 'bg-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.15)]',
      hover: 'hover:bg-red-600 hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:scale-[1.02]',
      focus: 'focus:ring-red-500',
      active: 'active:scale-[0.98]',
    },
    success: {
      base: 'bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.15)]',
      hover: 'hover:bg-emerald-600 hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:scale-[1.02]',
      focus: 'focus:ring-emerald-500',
      active: 'active:scale-[0.98]',
    },
    ghost: {
      base: 'bg-transparent text-gray-700',
      hover: 'hover:bg-gray-100',
      focus: 'focus:ring-gray-400',
      active: 'active:scale-[0.98]',
    },
    ghostBlue: {
      base: 'bg-transparent text-blue-600',
      hover: 'hover:bg-blue-50',
      focus: 'focus:ring-blue-500',
      active: 'active:scale-[0.98]',
    },
    ghostRed: {
      base: 'bg-transparent text-red-600',
      hover: 'hover:bg-red-50',
      focus: 'focus:ring-red-500',
      active: 'active:scale-[0.98]',
    },
    icon: {
      base: 'p-2 text-gray-600 bg-transparent',
      hover: 'hover:bg-gray-100',
      focus: 'focus:ring-gray-400',
      active: 'active:scale-[0.95]',
    },
    iconBlue: {
      base: 'p-2 text-blue-600 bg-transparent',
      hover: 'hover:bg-blue-50',
      focus: 'focus:ring-blue-500',
      active: 'active:scale-[0.95]',
    },
    iconRed: {
      base: 'p-2 text-red-600 bg-transparent',
      hover: 'hover:bg-red-50',
      focus: 'focus:ring-red-500',
      active: 'active:scale-[0.95]',
    },
  };

  const styles = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  // Icon-only buttons don't need gap
  const isIconOnly = (variant.startsWith('icon') || (Icon && !children));
  const gapStyle = isIconOnly ? '' : sizeStyle.split(' ').find(s => s.startsWith('gap'));

  const buttonClasses = `
    ${baseStyles}
    ${styles.base}
    ${!disabled && !isLoading ? styles.hover : ''}
    ${styles.focus}
    ${styles.active}
    ${isIconOnly ? 'p-2' : sizeStyle.replace(gapStyle || '', '').trim()}
    ${gapStyle && !isIconOnly ? gapStyle : ''}
    rounded-lg
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const content = (
    <>
      {isLoading && (
        <FiLoader className="animate-spin" />
      )}
      {!isLoading && Icon && iconPosition === 'left' && (
        <Icon className="flex-shrink-0" />
      )}
      {children && <span>{children}</span>}
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="flex-shrink-0" />
      )}
    </>
  );

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {content}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;

