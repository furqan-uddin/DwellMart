import { useEffect, useMemo, useState } from 'react';
import { FiEdit, FiEye, FiEyeOff, FiImage, FiPlus, FiSearch, FiStar, FiTrash2, FiUpload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import Badge from '../../../shared/components/Badge';
import AnimatedSelect from '../components/AnimatedSelect';
import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  updateTestimonial,
  uploadAdminImage,
} from '../services/adminService';

const initialForm = {
  name: '',
  designation: '',
  company: '',
  message: '',
  image: '',
  rating: 5,
  order: 0,
  isActive: true,
};

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const loadTestimonials = async () => {
    setIsLoading(true);
    try {
      const response = await getAllTestimonials();
      const payload = Array.isArray(response?.data) ? response.data : [];
      setTestimonials(payload);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((testimonial) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [testimonial.name, testimonial.designation, testimonial.company, testimonial.message]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && testimonial.isActive) ||
        (selectedStatus === 'inactive' && !testimonial.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, selectedStatus, testimonials]);

  const paginatedTestimonials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTestimonials.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredTestimonials]);

  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);

  const openCreateForm = () => {
    setEditingTestimonial(null);
    setFormData(initialForm);
    setShowForm(true);
  };

  const openEditForm = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name || '',
      designation: testimonial.designation || '',
      company: testimonial.company || '',
      message: testimonial.message || '',
      image: testimonial.image || '',
      rating: Number(testimonial.rating || 5),
      order: Number(testimonial.order || 0),
      isActive: testimonial.isActive !== false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTestimonial(null);
    setFormData(initialForm);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadAdminImage(file, 'testimonials');
      const imageUrl = response?.data?.url || response?.data?.imageUrl || '';
      if (!imageUrl) {
        throw new Error('Image upload response did not include a URL');
      }
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Unable to upload image');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingTestimonial?._id) {
        await updateTestimonial(editingTestimonial._id, formData);
        toast.success('Testimonial updated successfully');
      } else {
        await createTestimonial(formData);
        toast.success('Testimonial created successfully');
      }
      closeForm();
      await loadTestimonials();
    } catch {
      // Global API handler shows toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      toast.success('Testimonial deleted successfully');
      await loadTestimonials();
    } catch {
      // Global API handler shows toast
    }
  };

  const handleToggleStatus = async (testimonial) => {
    try {
      await updateTestimonial(testimonial._id, { isActive: !testimonial.isActive });
      toast.success(`Testimonial ${testimonial.isActive ? 'hidden' : 'activated'} successfully`);
      await loadTestimonials();
    } catch {
      // Global API handler shows toast
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Testimonials</h1>
          <p className="text-gray-600">Manage homepage testimonials and customer stories</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold"
        >
          <FiPlus />
          Add Testimonial
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search testimonials..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <AnimatedSelect
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            Loading testimonials...
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No testimonials found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedTestimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-amber-50 via-white to-orange-50">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {testimonial.image ? (
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FiImage className="text-2xl" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-800 truncate">{testimonial.name}</h3>
                          <Badge variant={testimonial.isActive ? 'success' : 'error'}>
                            {testimonial.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {[testimonial.designation, testimonial.company].filter(Boolean).join(' · ') || 'Customer'}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-amber-500">
                          {Array.from({ length: Number(testimonial.rating || 5) }).map((_, index) => (
                            <FiStar key={index} className="fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-600 leading-6 min-h-[96px]">
                      {testimonial.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Order: {Number(testimonial.order || 0)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(testimonial)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={testimonial.isActive ? 'Hide' : 'Show'}
                      >
                        {testimonial.isActive ? <FiEye /> : <FiEyeOff />}
                      </button>
                      <button
                        onClick={() => openEditForm(testimonial)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(testimonial._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTestimonials.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    These testimonials appear on the user homepage before the footer.
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(event) => handleInputChange('name', event.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(event) => handleInputChange('designation', event.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Founder, Buyer, Homemaker..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(event) => handleInputChange('company', event.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                    <select
                      value={formData.rating}
                      onChange={(event) => handleInputChange('rating', Number(event.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} Star{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(event) => handleInputChange('message', event.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Share the testimonial text that should appear on the homepage"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={(event) => handleInputChange('order', Number(event.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(event) => handleInputChange('isActive', event.target.value === 'active')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors cursor-pointer">
                      <FiUpload />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(event) => handleInputChange('image', event.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Or paste image URL"
                    />
                  </div>
                  {formData.image && (
                    <div className="mt-4 w-24 h-24 rounded-2xl overflow-hidden border border-gray-200">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : editingTestimonial ? 'Update Testimonial' : 'Create Testimonial'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Testimonials;
