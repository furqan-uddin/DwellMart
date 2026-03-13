import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import Button from './Button';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', customContent = null }) => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: 'text-red-600',
      variant: 'danger',
    },
    warning: {
      icon: 'text-orange-600',
      variant: 'danger', // Using danger variant for warning as well
    },
    info: {
      icon: 'text-blue-600',
      variant: 'primary',
    },
  };

  const styles = typeStyles[type] || typeStyles.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[10000]"
          />
          
          {/* Modal Content - Mobile: Slide up from bottom, Desktop: Center with scale */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[10000] flex ${isAppRoute ? 'items-start pt-[10px]' : 'items-end'} sm:items-center justify-center p-4 pointer-events-none`}
          >
            <motion.div
              variants={{
                hidden: { 
                  y: isAppRoute ? '-100%' : '100%',
                  scale: 0.95,
                  opacity: 0
                },
                visible: { 
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  transition: { 
                    type: 'spring',
                    damping: 22,
                    stiffness: 350,
                    mass: 0.7
                  }
                },
                exit: { 
                  y: isAppRoute ? '-100%' : '100%',
                  scale: 0.95,
                  opacity: 0,
                  transition: { 
                    type: 'spring',
                    damping: 30,
                    stiffness: 400
                  }
                }
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className={`bg-white ${isAppRoute ? 'rounded-b-3xl' : 'rounded-t-3xl'} sm:rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 relative mx-4 pointer-events-auto`}
              style={{ willChange: 'transform' }}
            >
              {/* Close Button */}
              <Button
                onClick={onClose}
                variant="icon"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </Button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-orange-50' : 'bg-blue-50'
                }`}>
                  <FiAlertTriangle className={`text-2xl ${styles.icon}`} />
                </div>
              </div>

              {/* Title */}
              {title && (
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-2">
                  {title}
                </h3>
              )}

              {/* Message */}
              <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
                {message}
              </p>

              {customContent ? (
                <div className="mb-6">{customContent}</div>
              ) : null}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  variant={styles.variant}
                  className="flex-1"
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;

