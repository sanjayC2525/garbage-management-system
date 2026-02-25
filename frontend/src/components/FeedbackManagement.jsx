import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const FeedbackManagement = () => {
  const [issuesAndFeedback, setIssuesAndFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    category: '',
    priority: '',
  });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [replyForm, setReplyForm] = useState({
    status: 'OPEN',
    adminReply: '',
    adminNotes: '',
    assignedWorkerId: '',
  });

  useEffect(() => {
    fetchFeedback();
    fetchStats();
    fetchWorkers();
  }, [filters]);

  const fetchWorkers = async () => {
    try {
      const response = await api.getWorkers();
      console.log('Available workers:', response);
      setWorkers(response || []);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
      toast.error('Failed to fetch workers');
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      console.log('Fetching issues and feedback with filters:', filters);

      // Use unified admin endpoint
      const response = await api.getAllIssuesFeedback(filters);
      console.log('Admin unified response:', response.data);

      const combined = response.data.items || [];
      console.log('Combined issues and feedback:', combined);
      console.log('First item structure:', combined[0]); // Log structure of first item

      setIssuesAndFeedback(combined);
    } catch (error) {
      console.error('Failed to fetch issues and feedback:', error);
      toast.error('Failed to fetch issues and feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getIssuesFeedbackStats();
      console.log('Unified stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch unified stats:', error);
      toast.error('Failed to fetch statistics');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openReplyModal = (feedbackItem) => {
    try {
      console.log('Opening reply modal for item:', feedbackItem);
      console.log('Item source:', feedbackItem.source);
      console.log('Item worker:', feedbackItem.worker);

      setSelectedFeedback(feedbackItem);
      setReplyForm({
        status: feedbackItem.status || 'OPEN',
        adminReply: feedbackItem.adminReply || '',
        adminNotes: feedbackItem.adminNotes || '',
        assignedWorkerId: feedbackItem.worker?.id || '',
      });
      setShowReplyModal(true);
      console.log('Reply modal opened successfully');
    } catch (error) {
      console.error('Error opening reply modal:', error);
      toast.error('Failed to open reply modal');
    }
  };

  const closeReplyModal = () => {
    setShowReplyModal(false);
    setSelectedFeedback(null);
    setReplyForm({
      status: 'OPEN',
      adminReply: '',
      adminNotes: '',
      assignedWorkerId: '',
    });
  };

  const handleSubmitReply = async () => {
    if (!selectedFeedback) return;

    try {
      console.log('Updating item:', {
        id: selectedFeedback.id,
        source: selectedFeedback.source,
        status: replyForm.status,
        adminReply: replyForm.adminReply,
        adminNotes: replyForm.adminNotes,
        assignedWorkerId: replyForm.assignedWorkerId
      });

      // Call appropriate API based on item source
      if (selectedFeedback.source === 'issue') {
        console.log('Updating issue via issues API');
        await api.updateIssue(
          selectedFeedback.id,
          replyForm.status,
          replyForm.adminReply || replyForm.adminNotes, // Use adminReply as resolution, fallback to adminNotes
          replyForm.assignedWorkerId // Pass worker ID for assignment
        );
      } else {
        console.log('Updating feedback via feedback API');
        await api.updateFeedback(
          selectedFeedback.id,
          replyForm.status,
          replyForm.adminReply,
          replyForm.adminNotes
        );
      }

      console.log('Update successful, refreshing data...');
      toast.success('Item updated successfully');
      closeReplyModal();
      fetchFeedback();
      fetchStats();
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      toast.error(`Failed to update item: ${error.response?.data?.error || error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface rounded-lg shadow-soft p-4 border border-border">
            <h3 className="text-sm font-medium text-text-muted">Total Feedback</h3>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          </div>
          <div className="bg-surface rounded-lg shadow-soft p-4 border border-border">
            <h3 className="text-sm font-medium text-text-muted">Open</h3>
            <p className="text-2xl font-bold text-status-warning">{stats.byStatus.open || 0}</p>
          </div>
          <div className="bg-surface rounded-lg shadow-soft p-4 border border-border">
            <h3 className="text-sm font-medium text-text-muted">In Progress</h3>
            <p className="text-2xl font-bold text-status-info">{stats.byStatus.inProgress || 0}</p>
          </div>
          <div className="bg-surface rounded-lg shadow-soft p-4 border border-border">
            <h3 className="text-sm font-medium text-text-muted">Resolved</h3>
            <p className="text-2xl font-bold text-status-success">{stats.byStatus.resolved || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface rounded-lg shadow-soft p-4 border border-border">
        <h3 className="text-lg font-medium mb-4 text-text-primary">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              <option value="">All Types</option>
              <option value="COMPLAINT">Complaint</option>
              <option value="SUGGESTION">Suggestion</option>
              <option value="ISSUE">Issue</option>
              <option value="COMPLIMENT">Compliment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              <option value="">All Categories</option>
              <option value="SERVICE">Service</option>
              <option value="WORKER">Worker</option>
              <option value="SYSTEM">System</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-surface rounded-lg shadow-soft overflow-hidden border border-border">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary">Feedback Management</h3>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Manage and respond to citizen feedback and complaints
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surfaceLight">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Citizen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-text-muted">
                    Loading issues and feedback...
                  </td>
                </tr>
              ) : issuesAndFeedback.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-text-muted">
                    No issues or feedback found
                  </td>
                </tr>
              ) : (
                issuesAndFeedback.map((item) => (
                  <tr key={item.id} className="hover:bg-surfaceLight">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      <div>
                        <div className="font-medium">
                          {item.source === 'feedback' ? '📝' : '⚠️'} {item.title}
                        </div>
                        <div className="text-text-muted truncate max-w-xs">{item.description}</div>
                        <div className="text-xs text-text-muted mt-1">
                          {item.source === 'feedback' ? 'Feedback' : 'Issue'} - {item.type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <div>
                        <div className="font-medium">{item.citizen.name}</div>
                        <div className="text-text-muted">{item.citizen.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {item.source === 'feedback' ? 'Feedback' : 'Issue'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {getPriorityBadge(item.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {item.worker?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.replied || item.status === 'RESOLVED' || item.status === 'REJECTED' ? (
                        <span className="text-status-success text-xs font-medium">Replied</span>
                      ) : (
                        <button
                          onClick={() => openReplyModal(item)}
                          className="text-primary hover:text-primary/80 mr-3"
                          disabled={item.replied}
                        >
                          Reply
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto border border-border">
            <h3 className="text-lg font-medium mb-4 text-text-primary">Reply to Feedback</h3>

            {/* Feedback Details */}
            <div className="bg-surfaceLight rounded-lg p-4 mb-4 border border-border">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-sm font-medium text-text-muted">From:</span>
                  <p className="text-sm text-text-primary">
                    {selectedFeedback.citizen?.name || 'Unknown'} ({selectedFeedback.citizen?.email || 'No email'})
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-text-muted">Created:</span>
                  <p className="text-sm text-text-primary">
                    {selectedFeedback.createdAt ? formatDate(selectedFeedback.createdAt) : 'Unknown date'}
                  </p>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-sm font-medium text-text-muted">Title:</span>
                <p className="text-sm font-medium text-text-primary">{selectedFeedback.title || 'No title'}</p>
              </div>
              <div className="mb-3">
                <span className="text-sm font-medium text-text-muted">Description:</span>
                <p className="text-sm text-text-primary">{selectedFeedback.description || 'No description'}</p>
              </div>
              <div className="flex space-x-2">
                {selectedFeedback.priority && getPriorityBadge(selectedFeedback.priority)}
                {selectedFeedback.status && getStatusBadge(selectedFeedback.status)}
              </div>
            </div>

            {/* Reply Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                <select
                  value={replyForm.status}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Worker Assignment - Only show for issues */}
              {selectedFeedback?.source === 'issue' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Assign Worker</label>
                  <select
                    value={replyForm.assignedWorkerId}
                    onChange={(e) => setReplyForm(prev => ({ ...prev, assignedWorkerId: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                  >
                    <option value="">No worker assigned</option>
                    {Array.isArray(workers) && workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.user?.name || 'Unknown'} ({worker.user?.email || 'No email'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Admin Reply</label>
                <textarea
                  value={replyForm.adminReply}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, adminReply: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary placeholder-text-muted"
                  placeholder="Enter your reply to the citizen..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Internal Notes</label>
                <textarea
                  value={replyForm.adminNotes}
                  onChange={(e) => setReplyForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary placeholder-text-muted"
                  placeholder="Internal notes for admin team..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeReplyModal}
                className="px-4 py-2 border border-border rounded-md text-text-primary hover:bg-surfaceLight"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Update {selectedFeedback?.source === 'issue' ? 'Issue' : 'Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
