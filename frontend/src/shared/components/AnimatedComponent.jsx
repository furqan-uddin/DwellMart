import { motion } from 'framer-motion';

/**
 * Wrapper component for Framer Motion animations
 * @param {ReactNode} children - Child components
 * @param {object} variants - Animation variants
 * @param {string} className - Additional CSS classes
 */
const AnimatedComponent = ({ 
  children, 
  variants, 
  className = '',
  initial = 'initial',
  animate = 'animate',
  whileInView = null,
  viewport = { once: true, margin: '-100px' }
}) => {
  return (
    <motion.div
      variants={variants}
      initial={initial}
      animate={animate}
      whileInView={whileInView || animate}
      viewport={viewport}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedComponent;

