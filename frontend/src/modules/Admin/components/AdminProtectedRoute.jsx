import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminStore';

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = window.atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useAdminAuthStore();
  const location = useLocation();
  const accessToken = token || localStorage.getItem('adminToken');
  const payload = decodeJwtPayload(accessToken);
  const role = String(payload?.role || '').toLowerCase();
  const tokenExpiryMs =
    typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  const isExpired = tokenExpiryMs ? Date.now() >= tokenExpiryMs : false;

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (isExpired) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('admin-auth-storage');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (role && role !== 'admin' && role !== 'superadmin') {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('admin-auth-storage');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
