import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiStar, FiUpload, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ReviewForm = ({ productId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [images, setImages] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    const newImages = files.slice(0, 3 - images.length);
    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data) => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const reviewData = {
      ...data,
      rating,
      images,
      productId,
      date: new Date().toISOString(),
    };

    if (onSubmit) {
      const result = await onSubmit(reviewData);
      if (result === false) {
        return;
      }
      reset();
      setRating(0);
      setImages([]);
      toast.success('Review submitted successfully!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 mb-8"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6">Write a Review</h3>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <FiStar
                  className={`text-3xl transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">({rating} out of 5)</span>
            )}
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Review Title
          </label>
          <input
            type="text"
            {...register('title', {
              required: 'Review title is required',
              minLength: {
                value: 3,
                message: 'Title must be at least 3 characters',
              },
            })}
            className={`w-full px-4 py-3 rounded-xl border-2 ${
              errors.title
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-200 focus:border-green-500'
            } focus:outline-none transition-colors`}
            placeholder="Give your review a title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('comment', {
              required: 'Review text is required',
              minLength: {
                value: 10,
                message: 'Review must be at least 10 characters',
              },
            })}
            rows={5}
            className={`w-full px-4 py-3 rounded-xl border-2 ${
              errors.comment
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-200 focus:border-green-500'
            } focus:outline-none transition-colors resize-none`}
            placeholder="Share your experience with this product..."
          />
          {errors.comment && (
            <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos (Optional, max 3)
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Review ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <FiX className="text-xs" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
                <FiUpload className="text-gray-400 text-xl" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-3 gradient-green text-white rounded-xl font-semibold hover:shadow-glow-green transition-all duration-300 hover:scale-105"
        >
          Submit Review
        </button>
      </form>
    </motion.div>
  );
};

export default ReviewForm;

