import { useState, useEffect, useMemo } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiFilter,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useBrandStore } from "../../../shared/store/brandStore";
import BrandForm from "../components/Brands/BrandForm";
import ExportButton from "../components/ExportButton";
import Pagination from "../components/Pagination";
import Badge from "../../../shared/components/Badge";
import AnimatedSelect from "../components/AnimatedSelect";
import toast from "react-hot-toast";
import Button from "../components/Button";

const Brands = () => {
  const {
    brands,
    initialize,
    deleteBrand,
    bulkDeleteBrands,
    toggleBrandStatus,
  } = useBrandStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    initialize();
  }, []);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch =
        !searchQuery ||
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (brand.description &&
          brand.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && brand.isActive) ||
        (selectedStatus === "inactive" && !brand.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, selectedStatus]);

  // Pagination
  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBrands.slice(startIndex, endIndex);
  }, [filteredBrands, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

  const handleCreate = () => {
    setEditingBrand(null);
    setShowForm(true);
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      deleteBrand(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedBrands.length === 0) {
      toast.error("Please select brands to delete");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedBrands.length} brands?`
      )
    ) {
      bulkDeleteBrands(selectedBrands);
      setSelectedBrands([]);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBrand(null);
  };

  const handleFormSave = () => {
    // Brands will be refreshed automatically
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-0">
        {/* Title and Button Row */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 lg:hidden">
            Brands
          </h1>
          <Button
            onClick={handleCreate}
            variant="primary"
            icon={FiPlus}
            className="flex-shrink-0">
            <span className="hidden xs:inline sm:inline">Add Brand</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>
        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 lg:hidden">
          Manage your product brands
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between mb-3 sm:hidden">
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            size="sm"
            icon={FiFilter}>
            {showFilters ? "Hide" : "Show"}
          </Button>
        </div>

        {/* Filter Content */}
        <div
          className={`${showFilters ? "block" : "hidden"
            } sm:block space-y-3 sm:space-y-0`}>
          {/* Search */}
          <div className="relative w-full sm:flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filters Row - Desktop */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 mt-3 sm:mt-0">
            {/* Status Filter */}
            <AnimatedSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              className="flex-shrink-0 min-w-[140px]"
            />

            {/* Export Button */}
            <ExportButton
              data={filteredBrands}
              headers={[
                { label: "ID", accessor: (row) => row.id },
                { label: "Name", accessor: (row) => row.name },
                {
                  label: "Description",
                  accessor: (row) => row.description || "",
                },
                { label: "Website", accessor: (row) => row.website || "" },
                {
                  label: "Status",
                  accessor: (row) => (row.isActive ? "Active" : "Inactive"),
                },
              ]}
              filename="brands"
            />
          </div>

          {/* Filters Stack - Mobile */}
          <div className="sm:hidden space-y-2 mt-3">
            {/* Status Filter */}
            <AnimatedSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />

            {/* Export Button */}
            <div className="pt-1">
              <ExportButton
                data={filteredBrands}
                headers={[
                  { label: "ID", accessor: (row) => row.id },
                  { label: "Name", accessor: (row) => row.name },
                  {
                    label: "Description",
                    accessor: (row) => row.description || "",
                  },
                  { label: "Website", accessor: (row) => row.website || "" },
                  {
                    label: "Status",
                    accessor: (row) => (row.isActive ? "Active" : "Inactive"),
                  },
                ]}
                filename="brands"
                className="w-full justify-center"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedBrands.length > 0 && (
          <div className="mt-3 sm:mt-4 p-3 bg-primary-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-xs sm:text-sm font-semibold text-primary-700">
              {selectedBrands.length} brand(s) selected
            </span>
            <Button
              onClick={handleBulkDelete}
              variant="danger"
              size="sm"
              className="w-full sm:w-auto">
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Brands Grid */}
      <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
        {filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No brands found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {paginatedBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBrands([...selectedBrands, brand.id]);
                        } else {
                          setSelectedBrands(
                            selectedBrands.filter((id) => id !== brand.id)
                          );
                        }
                      }}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <Badge variant={brand.isActive ? "success" : "error"}>
                      <span className="text-[10px] sm:text-xs">
                        {brand.isActive ? "Active" : "Inactive"}
                      </span>
                    </Badge>
                  </div>

                  {brand.logo && (
                    <div className="mb-3 sm:mb-4 flex justify-center">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-12 sm:h-20 w-auto object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">
                    {brand.name}
                  </h3>
                  {brand.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] sm:text-xs text-primary-600 hover:underline mb-2 sm:mb-3 block truncate">
                      {brand.website}
                    </a>
                  )}

                  <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => toggleBrandStatus(brand.id)}
                      variant="icon"
                      className="flex-1 text-gray-600"
                      icon={brand.isActive ? FiEyeOff : FiEye}
                      title={brand.isActive ? "Deactivate" : "Activate"}
                    />
                    <Button
                      onClick={() => handleEdit(brand)}
                      variant="iconBlue"
                      className="flex-1"
                      icon={FiEdit}
                    />
                    <Button
                      onClick={() => handleDelete(brand.id)}
                      variant="iconRed"
                      className="flex-1"
                      icon={FiTrash2}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredBrands.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              className="mt-6"
            />
          </>
        )}
      </div>

      {/* Brand Form Modal */}
      {showForm && (
        <BrandForm
          brand={editingBrand}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </motion.div>
  );
};

export default Brands;
