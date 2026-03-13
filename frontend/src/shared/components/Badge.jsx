const Badge = ({ children, variant = 'flash', className = '' }) => {
  const variants = {
    flash: 'bg-primary-500 text-white',
    discount: 'bg-discount-500 text-white',
    sale: 'bg-accent-500 text-black',
    warning: 'bg-orange-500 text-white',
    error: 'bg-discount-500 text-white',
    success: 'bg-success-500 text-white',
    info: 'bg-primary-500 text-white',
    pending: 'bg-yellow-500 text-white',
    processing: 'bg-primary-500 text-white',
    shipped: 'bg-purple-500 text-white',
    delivered: 'bg-success-500 text-white',
    cancelled: 'bg-discount-500 text-white',
    returned: 'bg-orange-500 text-white',
    approved: 'bg-green-500 text-white',
    rejected: 'bg-red-500 text-white',
    completed: 'bg-success-500 text-white',
    'return-pending': 'bg-yellow-500 text-white',
    'return-approved': 'bg-green-500 text-white',
    'return-rejected': 'bg-red-500 text-white',
    'return-processing': 'bg-blue-500 text-white',
    'return-completed': 'bg-success-500 text-white',
  };

  return (
    <div
      className={`px-3 py-1 rounded-md text-xs font-bold ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

export default Badge;

