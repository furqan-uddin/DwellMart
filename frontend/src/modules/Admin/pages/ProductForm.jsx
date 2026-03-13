import { useNavigate, useParams } from "react-router-dom";
import ProductFormModal from "../components/ProductFormModal";

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <ProductFormModal
      isOpen={true}
      productId={id || "new"}
      onClose={() => navigate("/admin/products/manage-products")}
      onSuccess={() => navigate("/admin/products/manage-products")}
    />
  );
};

export default ProductForm;
