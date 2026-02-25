import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const FeedbackForm = ({ onSubmit, onCancel, workers = [], showTypeSelector = false }) => {
  const [formData, setFormData] = useState({
    type: showTypeSelector ? 'FEEDBACK' : 'COMPLAINT',
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    workerId: '',
  });
  const [loading, setLoading] = useState(false);

  const getCategoryOptions = () => {
    if (formData.type === 'ISSUE') {
      return [
        { value: 'GENERAL', label: 'General' },
        { value: 'REPORT_REJECTED', label: 'Report Rejected' },
        { value: 'WORKER_CONDUCT', label: 'Worker Conduct' },
        { value: 'SYSTEM_ERROR', label: 'System Error' },
        { value: 'OTHER', label: 'Other' },
        { value: 'COLLECTION', label: 'Collection Issue' }
      ];
    } else {
      return [
        { value: 'GENERAL', label: 'General' },
        { value: 'SERVICE', label: 'Service Quality' },
        { value: 'WORKER', label: 'Worker Conduct' },
        { value: 'SYSTEM', label: 'System Issue' },
        { value: 'COLLECTION', label: 'Collection Issue' },
        { value: 'OTHER', label: 'Other' }
      ];
    }
  };

  useEffect(() => {
    const validCategories = getCategoryOptions().map(opt => opt.value);
    if (!validCategories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: 'GENERAL' }));
    }
  }, [formData.type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      // Success toast handled by parent component
      setFormData({
        type: showTypeSelector ? 'FEEDBACK' : 'COMPLAINT',
        title: '',
        description: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        workerId: '',
      });
    } catch (error) {
      // Error toast handled by parent component
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-surface p-6 rounded-lg border border-border">
      <h3 className="text-xl font-bold mb-4 text-text-primary">
        {showTypeSelector ? 'Submit Issue or Feedback' : 'Submit Feedback'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              {showTypeSelector ? (
                <>
                  <option value="FEEDBACK">Feedback</option>
                  <option value="ISSUE">Issue/Dispute</option>
                </>
              ) : (
                <>
                  <option value="COMPLAINT">Complaint</option>
                  <option value="SUGGESTION">Suggestion</option>
                  <option value="ISSUE">Issue</option>
                  <option value="COMPLIMENT">Compliment</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              {getCategoryOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-text-primary">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-text-primary">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter title..."
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary placeholder-text-muted"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-text-primary">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detailed description..."
            rows={4}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary placeholder-text-muted"
            required
          />
        </div>

        {/* Conditional fields for issues */}
        {showTypeSelector && formData.type === 'ISSUE' && (
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">Related Worker (Optional)</label>
            <select
              name="workerId"
              value={formData.workerId}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              <option value="">Select a worker...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} - {worker.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-surfaceLight hover:bg-surface text-text-primary font-medium rounded-md transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-status-success hover:bg-status-success/90 text-white font-medium rounded-md transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
