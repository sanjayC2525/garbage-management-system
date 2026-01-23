import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsRes, usersRes] = await Promise.all([
        api.getGarbageReports(),
        api.getUsers(),
      ]);

      setReports(reportsRes.data);
      setWorkers(usersRes.data.filter(u => u.role === 'Worker'));
    } catch {
      toast.error('Failed to load admin data');
    }
  };

  const createWorker = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({ ...workerForm, role: 'Worker' });
      toast.success('Worker added');
      setShowWorkerForm(false);
      setWorkerForm({ name: '', email: '', password: '' });
      loadData();
    } catch {
      toast.error('Failed to create worker');
    }
  };

  const deleteWorker = async (id) => {
    if (!confirm('Delete this worker?')) return;
    await api.deleteUser(id);
    loadData();
  };

  const updateStatus = async (id, action) => {
    await api.updateGarbageReportStatus(id, action);
    loadData();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>

      {/* Add Worker */}
      <button
        onClick={() => setShowWorkerForm(!showWorkerForm)}
        className="bg-primary text-white px-4 py-2 rounded"
      >
        {showWorkerForm ? 'Cancel' : 'Add Worker'}
      </button>

      {showWorkerForm && (
        <form onSubmit={createWorker} className="bg-darker p-4 rounded space-y-4">
          <input
            placeholder="Name"
            className="w-full p-2 bg-gray-800 rounded"
            value={workerForm.name}
            onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            className="w-full p-2 bg-gray-800 rounded"
            value={workerForm.email}
            onChange={e => setWorkerForm({ ...workerForm, email: e.target.value })}
            required
          />
          <input
            placeholder="Password"
            type="password"
            className="w-full p-2 bg-gray-800 rounded"
            value={workerForm.password}
            onChange={e => setWorkerForm({ ...workerForm, password: e.target.value })}
            required
          />
          <button className="bg-green-600 px-4 py-2 rounded">Create</button>
        </form>
      )}

      {/* Pending Reports */}
      <div className="bg-darker rounded overflow-hidden">
        <h2 className="p-4 font-bold">Pending Garbage Reports</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-2">Citizen</th>
              <th className="p-2">Photo</th>
              <th className="p-2">Location</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports
              .filter(r => r.status === 'REPORTED')
              .map(r => (
                <tr key={r.id}>
                  <td className="p-2">{r.citizen?.name}</td>
                  <td className="p-2">
                    <img
                      src={`http://localhost:5001${r.imagePath}`}
                      className="w-16 h-16 rounded object-cover"
                    />
                  </td>
                  <td className="p-2">
                    <a
                      href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                      target="_blank"
                      className="text-blue-400"
                    >
                      View Map
                    </a>
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => updateStatus(r.id, 'approve')}
                      className="bg-green-600 px-2 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, 'reject')}
                      className="bg-red-600 px-2 py-1 rounded"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Workers */}
      <div className="bg-darker rounded overflow-hidden">
        <h2 className="p-4 font-bold">Workers</h2>
        <table className="w-full text-sm">
          <tbody>
            {workers.map(w => (
              <tr key={w.id}>
                <td className="p-2">{w.name}</td>
                <td className="p-2">{w.email}</td>
                <td className="p-2">
                  <button
                    onClick={() => deleteWorker(w.id)}
                    className="bg-red-600 px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
