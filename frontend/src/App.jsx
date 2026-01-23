import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminRoutes from './routes/AdminRoutes';
import CitizenRoutes from './routes/CitizenRoutes';
import WorkerRoutes from './routes/WorkerRoutes';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminRoutes />} />
      <Route path="/citizen" element={<CitizenRoutes />} />
      <Route path="/worker" element={<WorkerRoutes />} />
    </Routes>
  );
}

export default App;
