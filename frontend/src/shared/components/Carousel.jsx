import { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Carousel = ({ children, itemsPerView = 1, showArrows = true, autoPlay = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState(children);
  const containerRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(children)) {
      setItems(children);
    } else {
      setItems([children]);
    }
  }, [children]);

  const totalItems = Array.isArray(items) ? items.length : 1;
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  const next = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(next, 5000);
      return () => clearInterval(interval);
    }
  }, [autoPlay, maxIndex]);

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          className="flex transition-transform duration-300"
          animate={{
            x: `-${currentIndex * (100 / itemsPerView)}%`,
          }}
        >
          {Array.isArray(items) &&
            items.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                {item}
              </div>
            ))}
        </motion.div>
      </div>

      {showArrows && totalItems > itemsPerView && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
          >
            <FiChevronLeft className="text-gray-700 text-xl" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
          >
            <FiChevronRight className="text-gray-700 text-xl" />
          </button>
        </>
      )}

      {/* Indicators */}
      {totalItems > itemsPerView && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex ? 'bg-primary-500 w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;

