import ProductCardSkeleton from './ProductCardSkeleton';

const ProductGridSkeleton = ({ count = 6, columns = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' }) => {
  return (
    <div className={`grid ${columns} gap-4 sm:gap-5 lg:gap-6`}>
      {[...Array(count)].map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;

