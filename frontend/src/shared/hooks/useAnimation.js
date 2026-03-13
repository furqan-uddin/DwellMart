import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsapAnimations } from '../utils/animations';

// Register ScrollTrigger if not already registered
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Custom hook for GSAP animations
 * @param {string} animationType - Type of animation (fadeInUp, fadeIn, slideInLeft, etc.)
 * @param {number} delay - Delay in seconds
 * @param {object} dependencies - Dependencies array for useEffect
 */
export const useGSAPAnimation = (animationType, delay = 0, dependencies = []) => {
  const elementRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (elementRef.current && gsapAnimations[animationType]) {
      // Kill any existing animation
      if (animationRef.current) {
        animationRef.current.kill();
      }
      
      // Create new animation and store reference
      animationRef.current = gsapAnimations[animationType](elementRef.current, delay);
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, dependencies);

  return elementRef;
};

/**
 * Custom hook for scroll-triggered animations
 * @param {object} options - Animation options
 */
export const useScrollAnimation = (options = {}) => {
  const elementRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  useEffect(() => {
    if (elementRef.current) {
      // Kill any existing ScrollTrigger
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }

      // Create animation and get ScrollTrigger instance
      const animation = gsapAnimations.scrollReveal(elementRef.current, options);
      
      // Get the ScrollTrigger instance from the animation
      if (animation && animation.scrollTrigger) {
        scrollTriggerRef.current = animation.scrollTrigger;
      }
    }

    // Cleanup function
    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, []);

  return elementRef;
};

