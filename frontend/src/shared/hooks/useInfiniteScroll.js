import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (items, itemsPerPage = 12, initialCount = 12) => {
  const initialItems = Array.isArray(items) ? items : [];
  const [displayedItems, setDisplayedItems] = useState(() =>
    initialItems.slice(0, initialCount)
  );
  const [hasMore, setHasMore] = useState(initialItems.length > initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef(null);

  const getItemKey = (item, index) => {
    if (item && typeof item === 'object') {
      if (item.id !== undefined && item.id !== null) return String(item.id);
      if (item._id !== undefined && item._id !== null) return String(item._id);
      if (item.slug) return String(item.slug);
      if (item.name) return `name:${item.name}:${index}`;
    }
    return `idx:${index}:${String(item)}`;
  };

  // Signature based reset handles same-length item set changes safely
  const itemsSignature = initialItems
    .map((item, index) => getItemKey(item, index))
    .join('|');

  useEffect(() => {
    setDisplayedItems(initialItems.slice(0, initialCount));
    setHasMore(initialItems.length > initialCount);
  }, [itemsSignature, initialCount]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentCount = displayedItems.length;
      const nextCount = currentCount + itemsPerPage;
      const newItems = initialItems.slice(0, nextCount);
      
      setDisplayedItems(newItems);
      setHasMore(nextCount < initialItems.length);
      setIsLoading(false);
    }, 300);
  }, [initialItems, displayedItems.length, itemsPerPage, hasMore, isLoading]);

  // Intersection Observer for automatic loading
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [target] = entries;
        if (target.isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    loadMoreRef,
  };
};

export default useInfiniteScroll;

