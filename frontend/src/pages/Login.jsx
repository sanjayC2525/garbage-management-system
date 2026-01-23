import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';
import toast from 'react-hot-toast';
import heroImage from "../assets/images/hero.jpg";


const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      toast.success('Login successful!');

      // Redirect based on role
      switch (response.user.role) {
        case 'Admin':
          navigate('/admin');
          break;
        case 'Citizen':
          navigate('/citizen');
          break;
        case 'Worker':
          navigate('/worker');
          break;
        default:
          navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="bg-darker p-8 rounded-lg shadow-lg w-full max-w-md">
        <img src={heroImage} alt="Hero" className="w-[500px] h-[300px] object-cover rounded-md mb-6" />
        <h2 className="text-2xl font-bold text-center mb-6 text-primary">Garbage Management System</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-400">
          <p className="mb-2"><strong>Demo Accounts:</strong></p>
          <p>Admin: admin@example.com / admin123</p>
          <p>Worker: worker@example.com / worker123</p>
          <p>Citizen: citizen@example.com / citizen123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;