import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { getStatusBadge, formatDate } from '../utils/statusHelpers.jsx';
import ProofUploadModal from '../components/ProofUploadModal';
import WorkerPerformanceMetrics from '../components/WorkerPerformanceMetrics';

const WorkerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showUnableModal, setShowUnableModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [unableReason, setUnableReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchWorkerInfo();
  }, []);

  const fetchWorkerInfo = async () => {
    try {
      const response = await api.getWorkerStats();
      const currentWorker = response.data.find(w => w.user.email === localStorage.getItem('userEmail'));
      if (currentWorker) {
        setWorker(currentWorker);
      }
    } catch (error) {
      console.error('Failed to fetch worker info:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.getTasks();
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    }
  };

  const markTaskCollected = async (id, action) => {
    try {
      if (action === 'unable') {
        if (!unableReason.trim()) {
          toast.error('Please provide a reason for being unable to complete the task');
          return;
        }
        await api.markTaskCollected(id, action, unableReason);
        setShowUnableModal(false);
        setUnableReason('');
        setSelectedTask(null);
      } else {
        await api.markTaskCollected(id, action);
      }
      
      const actionText = action === 'accept' ? 'accepted' : 
                         action === 'start' ? 'started' : 
                         action === 'complete' ? 'completed' : 'marked unable';
      toast.success(`Task ${actionText} successfully`);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const openUnableModal = (task) => {
    setSelectedTask(task);
    setShowUnableModal(true);
  };

  const closeUnableModal = () => {
    setShowUnableModal(false);
    setSelectedTask(null);
    setUnableReason('');
  };

  const openProofModal = (task) => {
    setSelectedTask(task);
    setShowProofModal(true);
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setSelectedTask(null);
  };

  const handleProofUpload = async (taskId, formData) => {
    try {
      await api.uploadProof(taskId, formData);
      fetchTasks(); // Refresh tasks to show proof status
    } catch (error) {
      throw error;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'text-blue-500';
      case 'ACCEPTED': return 'text-green-500';
      case 'IN_PROGRESS': return 'text-yellow-500';
      case 'COMPLETED': return 'text-green-600';
      case 'UNABLE': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Worker Dashboard</h1>
      </div>

      {/* My Assigned Tasks */}
      <div className="bg-darker rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">My Assigned Tasks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reported</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={`http://localhost:5001${task.garbageReport?.imagePath}`} alt="Garbage" className="w-16 h-16 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div>{task.latitude.toFixed(4)}, {task.longitude.toFixed(4)}</div>
                      <a
                        href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View on Map
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(task.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.status === 'ASSIGNED' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => markTaskCollected(task.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
                        >
                          Accept Task
                        </button>
                        <button
                          onClick={() => openUnableModal(task)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
                        >
                          Unable
                        </button>
                      </div>
                    )}
                    {task.status === 'ACCEPTED' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => markTaskCollected(task.id, 'start')}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
                        >
                          Start Collection
                        </button>
                        <button
                          onClick={() => openUnableModal(task)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
                        >
                          Unable
                        </button>
                      </div>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markTaskCollected(task.id, 'complete')}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => openProofModal(task)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
                          >
                            Upload Proof
                          </button>
                        </div>
                        <button
                          onClick={() => openUnableModal(task)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200 w-full"
                        >
                          Unable
                        </button>
                      </div>
                    )}
                    {task.status === 'COMPLETED' && (
                      <div>
                        <span className="text-green-600 font-medium text-sm">✓ Completed</span>
                        {task.proofImage && (
                          <div className="mt-1">
                            <span className="text-xs text-blue-400">✓ Proof uploaded</span>
                          </div>
                        )}
                      </div>
                    )}
                    {task.status === 'UNABLE' && (
                      <div>
                        <span className="text-red-500 font-medium text-sm">Unable to Complete</span>
                        {task.unableReason && (
                          <p className="text-xs text-gray-400 mt-1">{task.unableReason}</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              No tasks assigned yet
            </div>
          )}
        </div>
      </div>

      {/* Unable to Complete Modal */}
      {showUnableModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-white">Unable to Complete Task</h3>
            <p className="text-gray-300 mb-4">
              Please provide a reason why you are unable to complete this task. This will help the admin reassign it appropriately.
            </p>
            <textarea
              value={unableReason}
              onChange={(e) => setUnableReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-white"
              rows={4}
              required
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={closeUnableModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => markTaskCollected(selectedTask.id, 'unable')}
                disabled={!unableReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worker Performance Metrics */}
      {worker && (
        <WorkerPerformanceMetrics workerId={worker.id} />
      )}

      {/* Proof Upload Modal */}
      {showProofModal && selectedTask && (
        <ProofUploadModal
          task={selectedTask}
          isOpen={showProofModal}
          onClose={closeProofModal}
          onUploadSuccess={handleProofUpload}
        />
      )}
    </div>
  );
};

export default WorkerDashboard;