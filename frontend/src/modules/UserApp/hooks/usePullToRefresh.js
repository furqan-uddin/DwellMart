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
  
  const stateRef = useRef({
    isPulling,
    isRefreshing,
    pullDistance,
    startY: 0,
    currentY: 0
  });

  // Sync ref with state
  useEffect(() => {
    stateRef.current.isPulling = isPulling;
    stateRef.current.isRefreshing = isRefreshing;
    stateRef.current.pullDistance = pullDistance;
  }, [isPulling, isRefreshing, pullDistance]);

  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (stateRef.current.isRefreshing) return;
    
    const touch = e.touches[0];
    stateRef.current.startY = touch.clientY;
    stateRef.current.currentY = touch.clientY;
    
    const element = elementRef.current;
    if (element && element.scrollTop === 0) {
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    const { isPulling, isRefreshing, startY } = stateRef.current;
    if (!isPulling || isRefreshing) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    stateRef.current.currentY = currentY;
    
    const element = elementRef.current;
    if (element && element.scrollTop === 0) {
      const deltaY = currentY - startY;
      
      if (deltaY > 0) {
        // Explicitly check for cancelable to avoid console warnings
        if (e.cancelable) {
          try {
            e.preventDefault();
          } catch (err) {
            // Silently ignore if preventDefault fails
          }
        }
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    }
  }, [resistance, threshold]);

  const handleTouchEnd = useCallback(() => {
    const { isPulling, isRefreshing, pullDistance } = stateRef.current;
    if (!isPulling || isRefreshing) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      Promise.resolve(onRefresh()).finally(() => {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsPulling(false);
        }, 300);
      });
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
    
    stateRef.current.startY = 0;
    stateRef.current.currentY = 0;
  }, [threshold, onRefresh]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const options = { passive: false };
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart, options);
      element.removeEventListener('touchmove', handleTouchMove, options);
      element.removeEventListener('touchend', handleTouchEnd, options);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    setPullDistance(0);
    setIsPulling(false);
  }, []);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    elementRef,
  };
};

export default usePullToRefresh;

