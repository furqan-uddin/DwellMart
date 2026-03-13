import { useRef, useState, useCallback } from 'react';

/**
 * Custom hook for detecting swipe gestures
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {Function} options.onSwipeUp - Callback for up swipe
 * @param {Function} options.onSwipeDown - Callback for down swipe
 * @param {Number} options.threshold - Minimum distance in pixels for a swipe (default: 50)
 * @param {Number} options.velocityThreshold - Minimum velocity for a swipe (default: 0.3)
 * @param {Function} options.shouldIgnore - Function to check if swipe should be ignored
 * @returns {Object} - Ref to attach to element and swipe state
 */
const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
  shouldIgnore,
}) => {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const touchEventRef = useRef(null);
  const initialTouchX = useRef(null);
  const [swipeState, setSwipeState] = useState({ isSwiping: false, offset: 0 });

  const minSwipeDistance = threshold;

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchEventRef.current = e;
    const touch = e.touches[0];
    initialTouchX.current = touch.clientX;
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setSwipeState({ isSwiping: false, offset: 0 });
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!touchStart.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    
    // Determine primary direction
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const offset = isHorizontal ? deltaX : deltaY;
    
    setSwipeState({ 
      isSwiping: Math.abs(offset) > 10, 
      offset 
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    
    // Check if swipe should be ignored (pass initial touch X for edge detection)
    if (shouldIgnore && shouldIgnore(touchEventRef.current, initialTouchX.current)) {
      setSwipeState({ isSwiping: false, offset: 0 });
      touchStart.current = null;
      touchEnd.current = null;
      touchEventRef.current = null;
      initialTouchX.current = null;
      return;
    }
    
    const distanceX = touchEnd.current.x - touchStart.current.x;
    const distanceY = touchEnd.current.y - touchStart.current.y;
    const timeDelta = Date.now() - touchStart.current.time;
    const velocity = Math.sqrt(distanceX ** 2 + distanceY ** 2) / timeDelta;
    
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);
    const distance = isHorizontal ? distanceX : distanceY;
    
    const isSwipe = Math.abs(distance) > minSwipeDistance && velocity > velocityThreshold;
    
    if (isSwipe) {
      if (isHorizontal) {
        if (distance > 0 && onSwipeRight) {
          onSwipeRight(touchEventRef.current);
        } else if (distance < 0 && onSwipeLeft) {
          onSwipeLeft(touchEventRef.current);
        }
      } else {
        if (distance > 0 && onSwipeDown) {
          onSwipeDown(touchEventRef.current);
        } else if (distance < 0 && onSwipeUp) {
          onSwipeUp(touchEventRef.current);
        }
      }
    }
    
    setSwipeState({ isSwiping: false, offset: 0 });
    touchStart.current = null;
    touchEnd.current = null;
    touchEventRef.current = null;
    initialTouchX.current = null;
  }, [minSwipeDistance, velocityThreshold, shouldIgnore, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const onTouchEndCapture = useCallback((e) => {
    const touch = e.changedTouches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    if (!touchEventRef.current) {
      touchEventRef.current = e;
    }
    onTouchEnd();
  }, [onTouchEnd]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: onTouchEndCapture,
    swipeState,
  };
};

export default useSwipeGesture;

