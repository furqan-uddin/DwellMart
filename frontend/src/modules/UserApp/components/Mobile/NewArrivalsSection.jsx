import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiTag } from "react-icons/fi";
import LazyImage from "../../../../shared/components/LazyImage";
import { getNewArrivals } from "../../data/catalogData";

const NewArrivalsSection = ({ products = null }) => {
  const fallback = getNewArrivals(6);
  const newArrivals = Array.isArray(products) && products.length > 0
    ? products.slice(0, 6)
    : fallback;

  if (newArrivals.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
      className="relative mx-4 my-4 rounded-2xl overflow-hidden shadow-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500">
      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
            "linear-gradient(225deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
            "linear-gradient(315deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
            "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Decorative Background Pattern with Floating Animation */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"
          animate={{
            x: [0, 20, 0],
            y: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full blur-2xl"
          animate={{
            x: [0, -15, 0],
            y: [0, -10, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative px-4 py-5">
        {/* Header with Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="bg-white/20 backdrop-blur-sm rounded-full p-2"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.15, rotate: 10 }}>
              <motion.div
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}>
                <FiTag className="text-white text-lg" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}>
              <motion.h2
                className="text-xl font-extrabold text-white drop-shadow-lg"
                animate={{
                  textShadow: [
                    "0 2px 4px rgba(0,0,0,0.2)",
                    "0 4px 8px rgba(255,255,255,0.3)",
                    "0 2px 4px rgba(0,0,0,0.2)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}>
                New Arrivals
              </motion.h2>
              <p className="text-xs text-white/90 font-medium">
                Fresh products just added
              </p>
            </motion.div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/new-arrivals"
              className="bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all block">
              See All
            </Link>
          </motion.div>
        </div>

        {/* Products Grid - Image Only */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3">
          {newArrivals.map((product, index) => {
            const productLink = `/product/${product.id}`;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                }}
                className="relative group">
                <Link to={productLink} className="block w-full h-full">
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 4px 6px rgba(0,0,0,0.1)",
                        "0 8px 12px rgba(59, 130, 246, 0.3)",
                        "0 4px 6px rgba(0,0,0,0.1)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2,
                    }}
                    className="rounded-xl overflow-hidden aspect-square bg-white/10 backdrop-blur-sm relative">
                    <div className="w-full h-full relative overflow-hidden">
                      <LazyImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/300x300?text=Product+Image";
                        }}
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default NewArrivalsSection;
