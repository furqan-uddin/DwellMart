import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for pull-to-refresh functionality
 * @param {Function} onRefresh - Callback function to execute on refresh
 * @param {Object} options - Configuration options
 * @param {Number} options.threshold - Distance in pixels to trigger refresh (default: 80)
 * @param {Number} options.resistance - Resistance factor for pull (default: 2.5)
 * @returns {Object} - State and refs for pull-to-refresh
 */
const usePullToRefresh = (onRefresh, options = {}) => {
  const { threshold = 80, resistance = 2.5 } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (isRefreshing) return;
    
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    
    // Only start pull if at the top of the scrollable area
    const element = elementRef.current;
    if (element && element.scrollTop === 0) {
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;
    
    const touch = e.touches[0];
    currentY.current = touch.clientY;
    
    const element = elementRef.current;
    if (element && element.scrollTop === 0) {
      const deltaY = currentY.current - startY.current;
      
      if (deltaY > 0) {
        e.preventDefault(); // Prevent default scroll
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    }
  }, [isPulling, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling || isRefreshing) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      // Execute refresh callback
      Promise.resolve(onRefresh()).finally(() => {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsPulling(false);
        }, 300);
      });
    } else {
      // Spring back
      setPullDistance(0);
      setIsPulling(false);
    }
    
    startY.current = 0;
    currentY.current = 0;
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  // Reset on mount
  useEffect(() => {
    setPullDistance(0);
    setIsPulling(false);
  }, []);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    elementRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export default usePullToRefresh;

