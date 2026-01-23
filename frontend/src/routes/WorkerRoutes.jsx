import { Navigate } from 'react-router-dom';
import WorkerDashboard from '../pages/WorkerDashboard';
import WorkerLayout from '../layouts/WorkerLayout';
import { getCurrentUser } from '../utils/auth';

const WorkerRoutes = () => {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Worker') {
    return <Navigate to="/login" replace />;
  }

  return (
    <WorkerLayout>
      <WorkerDashboard />
    </WorkerLayout>
  );
};

export default WorkerRoutes;