import { useState } from 'react';
import toast from 'react-hot-toast';

const IssueForm = ({ onSubmit, onCancel, reports = [], workers = [] }) => {
  const [formData, setFormData] = useState({
    type: 'DISPUTE',
    title: '',
    description: '',
    category: 'REPORT_REJECTED',
    priority: 'MEDIUM',
    reportId: '',
    workerId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      const submitData = { ...formData };
      if (formData.reportId) submitData.reportId = parseInt(formData.reportId);
      if (formData.workerId) submitData.workerId = parseInt(formData.workerId);
      
      await onSubmit(submitData);
      toast.success('Issue submitted successfully');
      setFormData({
        type: 'DISPUTE',
        title: '',
        description: '',
        category: 'REPORT_REJECTED',
        priority: 'MEDIUM',
        reportId: '',
        workerId: '',
      });
    } catch (error) {
      toast.error('Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-darker p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Submit Issue/Dispute</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="DISPUTE">Dispute</option>
              <option value="SERVICE_ISSUE">Service Issue</option>
              <option value="TECHNICAL">Technical Issue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="REPORT_REJECTED">Report Rejected</option>
              <option value="WORKER_CONDUCT">Worker Conduct</option>
              <option value="SYSTEM_ERROR">System Error</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Related Report (Optional)</label>
            <select
              name="reportId"
              value={formData.reportId}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a report</option>
              {reports.map(report => (
                <option key={report.id} value={report.id}>
                  Report #{report.id} - {report.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Related Worker (Optional)</label>
          <select
            name="workerId"
            value={formData.workerId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a worker</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>
                {worker.name} - {worker.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief title for your issue"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detailed description of the issue..."
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Issue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueForm;
