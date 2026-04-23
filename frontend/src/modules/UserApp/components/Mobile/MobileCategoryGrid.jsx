import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { categories as fallbackCategories } from "../../../../data/categories";
import LazyImage from "../../../../shared/components/LazyImage";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { usePageTranslation } from "../../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../../hooks/useDynamicTranslation";
import { useState } from "react";

const normalizeId = (value) => String(value ?? "").trim();

const MobileCategoryGrid = () => {
  const { categories, initialize, getRootCategories } = useCategoryStore();
  const { translateObject } = useDynamicTranslation();
  const { getTranslatedText: t } = usePageTranslation(["Browse Categories"]);
  const [translatedCategories, setTranslatedCategories] = useState([]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const displayCategories = useMemo(() => {
    const roots = getRootCategories().filter((cat) => cat.isActive !== false);
    let mapped = [];

    if (!roots.length) {
      mapped = [...fallbackCategories];
    } else {
      mapped = roots.map((cat) => {
        const fallbackCat = fallbackCategories.find(
          (fc) =>
            normalizeId(fc.id) === normalizeId(cat.id) ||
            fc.name?.toLowerCase() === cat.name?.toLowerCase()
        );
        return {
          ...(fallbackCat || {}),
          ...cat,
          image: cat.image || fallbackCat?.image || "",
        };
      });
    }

    return mapped;
  }, [categories, getRootCategories]);

  useEffect(() => {
    const translate = async () => {
      if (displayCategories.length > 0) {
        const translated = await Promise.all(
          displayCategories.map(cat => translateObject(cat, ['name']))
        );
        setTranslatedCategories(translated);
      }
    };
    translate();
  }, [displayCategories, translateObject]);

  return (
    <div className="px-4 py-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {t("Browse Categories")}
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {(translatedCategories.length > 0 ? translatedCategories : displayCategories).map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0">
            <Link
              to={category.path || `/category/${category.id}`}
              className="flex flex-col items-center gap-2 w-20">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 ring-2 ring-gray-200">
                <LazyImage
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/64x64?text=Category";
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center line-clamp-2">
                {category.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MobileCategoryGrid;
