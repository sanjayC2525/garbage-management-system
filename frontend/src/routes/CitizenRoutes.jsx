import { Navigate } from 'react-router-dom';
import CitizenDashboard from '../pages/CitizenDashboard';
import CitizenLayout from '../layouts/CitizenLayout';
import { getCurrentUser } from '../utils/auth';

const CitizenRoutes = () => {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Citizen') {
    return <Navigate to="/login" replace />;
  }

  return (
    <CitizenLayout>
      <CitizenDashboard />
    </CitizenLayout>
  );
};

export default CitizenRoutes;