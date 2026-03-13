import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const FlyingItem = ({ 
  image, 
  startPosition, 
  endPosition, 
  onComplete 
}) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      if (onComplete) onComplete();
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isAnimating) return null;

  // Calculate a curved path with a bounce effect
  const midY = Math.min(startPosition.y, endPosition.y) - 50;
  const controlPoint = {
    x: (startPosition.x + endPosition.x) / 2,
    y: midY,
  };

  const content = (
    <motion.div
      className="fixed z-[10001] pointer-events-none"
      style={{
        left: 0,
        top: 0,
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }}
      initial={{
        x: startPosition.x - 32,
        y: startPosition.y - 32,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: endPosition.x - 32,
        y: endPosition.y - 32,
        scale: [1, 1.3, 0.8, 0.4],
        opacity: [1, 1, 1, 0],
      }}
      transition={{
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.3, 0.7, 1],
      }}
    >
      <motion.div
        animate={{
          rotate: [0, 15, -15, 15, 0],
          y: [0, -20, -10, 0],
        }}
        transition={{
          duration: 0.7,
          ease: "easeInOut",
        }}
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        className="w-16 h-16 rounded-xl overflow-hidden shadow-2xl border-2 border-white bg-white"
      >
        <img
          src={image}
          alt="Flying item"
          className="w-full h-full object-cover"
        />
      </motion.div>
    </motion.div>
  );

  return createPortal(content, document.body);
};

export default FlyingItem;

