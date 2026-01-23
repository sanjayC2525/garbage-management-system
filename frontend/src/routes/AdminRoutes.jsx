import { Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import AdminLayout from '../layouts/AdminLayout';
import { getCurrentUser } from '../utils/auth';

const AdminRoutes = () => {
  const user = getCurrentUser();

  if (!user || user.role !== 'Admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
};

export default AdminRoutes;