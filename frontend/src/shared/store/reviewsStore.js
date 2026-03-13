import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';

const isMongoObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

const normalizeReview = (review) => ({
  ...review,
  id: review?.id || review?._id || Date.now().toString(),
  user: review?.user || review?.userId?.name || 'User',
  date: review?.date || review?.createdAt || new Date().toISOString(),
  helpfulCount: review?.helpfulCount || 0,
  notHelpfulCount: review?.notHelpfulCount || 0,
});

export const useReviewsStore = create(
  persist(
    (set, get) => ({
      reviews: {},
      votes: {},
      isLoading: false,
      error: null,

      fetchReviews: async (productId, options = {}) => {
        if (!productId || !isMongoObjectId(String(productId))) {
          return get().sortReviews(productId, options?.sort || 'newest');
        }

        set({ isLoading: true, error: null });
        try {
          const { sort = 'newest', page = 1, limit = 20 } = options;
          const response = await api.get(
            `/user/reviews/product/${productId}?sort=${encodeURIComponent(sort)}&page=${page}&limit=${limit}`
          );
          const payload = response?.data || {};
          const fetched = Array.isArray(payload?.reviews)
            ? payload.reviews.map(normalizeReview)
            : [];

          set((state) => ({
            reviews: {
              ...state.reviews,
              [productId]: fetched,
            },
            isLoading: false,
          }));

          return fetched;
        } catch (error) {
          set({ isLoading: false, error: error?.message || 'Failed to fetch reviews' });
          return get().sortReviews(productId, options?.sort || 'newest');
        }
      },

      // Add review for a product
      addReview: async (productId, review) => {
        const normalizedProductId = String(productId);

        if (!isMongoObjectId(normalizedProductId)) {
          set((state) => {
            const productReviews = state.reviews[normalizedProductId] || [];
            const newReview = normalizeReview({
              ...review,
              id: Date.now().toString(),
            });
            return {
              reviews: {
                ...state.reviews,
                [normalizedProductId]: [...productReviews, newReview],
              },
            };
          });
          return true;
        }

        try {
          const response = await api.post('/user/reviews', {
            productId: normalizedProductId,
            orderId: review?.orderId,
            rating: review?.rating,
            comment: review?.comment,
            images: review?.images || [],
          });
          const payload = response?.data;
          if (payload) {
            const added = normalizeReview(payload);
            set((state) => ({
              reviews: {
                ...state.reviews,
                [normalizedProductId]: [...(state.reviews[normalizedProductId] || []), added],
              },
            }));
          }
          return true;
        } catch {
          return false;
        }
      },

      // Get reviews for a product
      getReviews: (productId) => {
        const state = get();
        return state.reviews[productId] || [];
      },

      // Vote on review helpfulness
      voteHelpful: async (productId, reviewId) => {
        const normalizedProductId = String(productId);
        const voteKey = `${normalizedProductId}_${reviewId}`;
        if (get().votes[voteKey]) {
          return false;
        }

        if (isMongoObjectId(normalizedProductId) && isMongoObjectId(String(reviewId))) {
          try {
            const response = await api.post(`/user/reviews/${reviewId}/helpful`);
            const payload = response?.data;
            const helpfulCount = payload?.helpfulCount;
            set((state) => ({
              reviews: {
                ...state.reviews,
                [normalizedProductId]: (state.reviews[normalizedProductId] || []).map((review) =>
                  review.id === reviewId || review._id === reviewId
                    ? {
                      ...review,
                      helpfulCount: typeof helpfulCount === 'number'
                        ? helpfulCount
                        : (review.helpfulCount || 0) + 1,
                    }
                    : review
                ),
              },
              votes: {
                ...state.votes,
                [voteKey]: 'helpful',
              },
            }));
            return true;
          } catch {
            return false;
          }
        }

        set((state) => {
          if (state.votes[voteKey]) {
            return state; // Already voted
          }

          const productReviews = state.reviews[normalizedProductId] || [];
          const updatedReviews = productReviews.map((review) =>
            review.id === reviewId
              ? { ...review, helpfulCount: (review.helpfulCount || 0) + 1 }
              : review
          );

          return {
            reviews: {
              ...state.reviews,
              [normalizedProductId]: updatedReviews,
            },
            votes: {
              ...state.votes,
              [voteKey]: 'helpful',
            },
          };
        });
        return true;
      },

      // Vote on review not helpful
      voteNotHelpful: (productId, reviewId) => {
        set((state) => {
          const voteKey = `${productId}_${reviewId}`;
          if (state.votes[voteKey]) {
            return state; // Already voted
          }

          const productReviews = state.reviews[productId] || [];
          const updatedReviews = productReviews.map((review) =>
            review.id === reviewId
              ? { ...review, notHelpfulCount: (review.notHelpfulCount || 0) + 1 }
              : review
          );

          return {
            reviews: {
              ...state.reviews,
              [productId]: updatedReviews,
            },
            votes: {
              ...state.votes,
              [voteKey]: 'not-helpful',
            },
          };
        });
      },

      // Check if user has voted on a review
      hasVoted: (productId, reviewId) => {
        const state = get();
        const voteKey = `${productId}_${reviewId}`;
        return !!state.votes[voteKey];
      },

      // Sort reviews
      sortReviews: (productId, sortBy) => {
        const state = get();
        const reviews = state.reviews[productId] || [];
        let sorted = [...reviews];

        switch (sortBy) {
          case 'newest':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
          case 'oldest':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
          case 'most-helpful':
            sorted.sort(
              (a, b) =>
                (b.helpfulCount || 0) - (a.helpfulCount || 0) ||
                (a.notHelpfulCount || 0) - (b.notHelpfulCount || 0)
            );
            break;
          case 'highest-rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
          case 'lowest-rating':
            sorted.sort((a, b) => a.rating - b.rating);
            break;
          default:
            break;
        }

        return sorted;
      },
    }),
    {
      name: 'reviews-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

