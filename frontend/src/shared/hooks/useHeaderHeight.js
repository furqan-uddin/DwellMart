import { useState, useEffect } from 'react';

/**
 * Hook to calculate the combined height of header and navbar
 * This is useful for adding padding-top to page content to prevent it from being hidden under sticky headers
 */
const useHeaderHeight = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const calculateHeight = () => {
      const header = document.querySelector('header');
      const navbar = document.querySelector('nav');
      
      let totalHeight = 0;
      
      if (header) {
        totalHeight += header.offsetHeight;
      }
      
      if (navbar) {
        totalHeight += navbar.offsetHeight;
      }
      
      setHeaderHeight(totalHeight);
    };

    // Initial calculation
    calculateHeight();

    // Recalculate on resize
    window.addEventListener('resize', calculateHeight);
    
    // Recalculate after a short delay to ensure elements are rendered
    const timeoutId = setTimeout(calculateHeight, 100);
    const timeoutId2 = setTimeout(calculateHeight, 500);

    return () => {
      window.removeEventListener('resize', calculateHeight);
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);

  return headerHeight;
};

export default useHeaderHeight;

