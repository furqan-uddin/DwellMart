import { useState } from 'react';
import { FiStar, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ReviewItem = ({ review, onHelpful, onNotHelpful }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteType, setVoteType] = useState(null);

  const handleHelpful = () => {
    if (hasVoted) return;
    setHasVoted(true);
    setVoteType('helpful');
    if (onHelpful) onHelpful(review.id);
  };

  const handleNotHelpful = () => {
    if (hasVoted) return;
    setHasVoted(true);
    setVoteType('not-helpful');
    if (onNotHelpful) onNotHelpful(review.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-xl p-6"
    >
      {/* Review Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-green rounded-full flex items-center justify-center text-white font-bold">
            {review.user?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{review.user || 'Anonymous'}</p>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`text-sm ${
                    i < review.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {review.date
            ? new Date(review.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'Recently'}
        </span>
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-800 mb-2">{review.title}</h4>
      )}

      {/* Review Comment */}
      <p className="text-gray-600 mb-4 leading-relaxed">{review.comment}</p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={typeof image === 'string' ? image : URL.createObjectURL(image)}
              alt={`Review image ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Helpfulness Voting */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">Was this review helpful?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleHelpful}
            disabled={hasVoted}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              voteType === 'helpful'
                ? 'bg-primary-100 text-primary-700'
                : hasVoted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            <FiThumbsUp className="text-sm" />
            <span>Helpful</span>
            {review.helpfulCount > 0 && (
              <span className="ml-1">({review.helpfulCount})</span>
            )}
          </button>
          <button
            onClick={handleNotHelpful}
            disabled={hasVoted}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              voteType === 'not-helpful'
                ? 'bg-red-100 text-red-700'
                : hasVoted
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            <FiThumbsDown className="text-sm" />
            <span>Not Helpful</span>
            {review.notHelpfulCount > 0 && (
              <span className="ml-1">({review.notHelpfulCount})</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewItem;

