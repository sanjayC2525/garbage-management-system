import React, { useState } from 'react';
import Modal from './Modal';
import { getStatusBadge, formatDate, formatTimelineEntry } from '../utils/statusHelpers.jsx';
import Card from './Card';
import Button from './Button';
import ImagePreview from './ImagePreview';
import toast from 'react-hot-toast';

const ReportDetailModal = ({ 
  isOpen, 
  onClose, 
  report, 
  workers, 
  onUpdateStatus,
  loading = false 
}) => {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const handleApprove = async () => {
    if (!selectedWorker) {
      toast.error('Please select a worker to assign this request');
      return;
    }

    if (!reportId) {
      toast.error('Report data is invalid');
      return;
    }

    try {
      await onUpdateStatus(reportId, 'approve', selectedWorker);
      const workerName = workers.find(w => w.id === parseInt(selectedWorker))?.name || 'Worker';
      toast.success(`Request approved and assigned to ${workerName}`);
      onClose();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!reportId) {
      toast.error('Report data is invalid');
      return;
    }

    setRejecting(true);
    try {
      await onUpdateStatus(reportId, 'reject', null, adminNotes);
      toast.success('Request rejected successfully');
      onClose();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject request. Please try again.');
    } finally {
      setRejecting(false);
    }
  };

  // Prevent blank screen - always return valid JSX
  if (!report || !report.id) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md" title="Report Details">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Report Not Found</h3>
          <p className="text-text-muted mb-4">The report data could not be loaded.</p>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  // Safe access to report properties
  const reportId = report?.id || '';
  const reportStatus = report?.status || 'UNKNOWN';
  const reportAddress = report?.address || '';
  const reportNotes = report?.notes || '';
  const reportLatitude = report?.latitude || 0;
  const reportLongitude = report?.longitude || 0;
  const reportImagePath = report?.imagePath || '';
  const reportCreatedAt = report?.createdAt || new Date();
  const reportPreferredDate = report?.preferredDate || '';
  const reportCitizen = report?.citizen || {};

  const statusHistory = report?.statusHistory ? JSON.parse(report.statusHistory) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Garbage Report Details">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-border mb-6">
          {['details', 'timeline', 'actions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === tab 
                  ? 'text-primary border-primary' 
                  : 'text-text-muted border-transparent hover:text-text-primary hover:border-border'
              }`}
            >
              {tab === 'details' && '📋 Details'}
              {tab === 'timeline' && '📅 Timeline'}
              {tab === 'actions' && '⚡ Actions'}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Info */}
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">📋 Report Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Status:</span>
                  {getStatusBadge(reportStatus)}
                </div>
                
                <div className="flex justify-between">
                  <span className="text-text-muted">Reported:</span>
                  <span className="text-text-primary">{formatDate(reportCreatedAt)}</span>
                </div>

                {reportAddress && (
                  <div>
                    <span className="text-text-muted">Address:</span>
                    <span className="text-text-primary">{reportAddress}</span>
                  </div>
                )}

                {reportNotes && (
                  <div>
                    <span className="text-text-muted">Notes:</span>
                    <span className="text-text-primary">{reportNotes}</span>
                  </div>
                )}

                {reportPreferredDate && (
                  <div>
                    <span className="text-text-muted">Preferred Date:</span>
                    <span className="text-text-primary">{formatDate(reportPreferredDate)}</span>
                  </div>
                )}
              </div>

              {/* Report Image */}
              {reportImagePath && (
                <div>
                  <span className="text-text-muted block mb-2">Evidence:</span>
                  <ImagePreview
                    src={`http://localhost:5001${reportImagePath}`}
                    alt="Garbage report"
                    size="lg"
                    clickable={true}
                  />
                </div>
              )}
            </Card>

            {/* Location Info */}
            <Card className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">📍 Location Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Coordinates:</span>
                  <span className="text-text-primary font-mono">
                    {reportLatitude.toFixed(6)}, {reportLongitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">📅 Status Timeline</h3>
            
            <div className="space-y-3">
              {statusHistory.length > 0 ? (
                statusHistory.map((entry, index) => (
                  <div key={index}>
                    {formatTimelineEntry(entry)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted">
                  No timeline events available
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">⚡ Admin Actions</h3>
            
            <div className="space-y-4">
              {/* Status Display */}
              <div className="p-4 bg-surfaceLight rounded-xl">
                <div className="text-center">
                  <div className="text-2xl mb-2">{getStatusBadge(reportStatus)}</div>
                  <div className="text-text-muted">
                    {reportStatus === 'REPORTED' && 'Awaiting admin review'}
                    {reportStatus === 'APPROVED' && 'Approved - Ready for assignment'}
                    {reportStatus === 'ASSIGNED' && 'Assigned to worker'}
                    {reportStatus === 'IN_PROGRESS' && 'Currently in progress'}
                    {reportStatus === 'COMPLETED' && 'Collection completed'}
                    {reportStatus === 'REJECTED' && 'Request was rejected'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {reportStatus === 'REPORTED' && (
                <div className="space-y-3">
                  {/* Worker Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      👷 Assign to Worker:
                    </label>
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="">Select a worker...</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name} - {worker.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleReject}
                      variant="secondary"
                      className="flex-1"
                      disabled={rejecting}
                    >
                      {rejecting ? 'Rejecting...' : '❌ Reject Request'}
                    </Button>
                    
                    <Button
                      onClick={handleApprove}
                      variant="primary"
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : selectedWorker ? `✅ Assign to ${workers.find(w => w.id === parseInt(selectedWorker))?.name || 'Worker'}` : 'Select Worker First'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Completed/Rejected Status Display */}
              {(['COMPLETED', 'REJECTED'].includes(reportStatus)) && (
                <div className={`p-4 rounded-xl ${
                  reportStatus === 'COMPLETED' 
                    ? 'bg-status-success/10 text-status-success border border-status-success/20' 
                    : 'bg-status-error/10 text-status-error border border-status-error/20'
                }`}>
                  <p className={`font-medium ${
                    reportStatus === 'COMPLETED' ? 'text-status-success' : 'text-status-error'
                  }`}>
                    {reportStatus === 'COMPLETED' ? '✅ This request has been completed' : '❌ This request was rejected'}
                  </p>
                  {report.adminNotes && (
                    <p className="text-sm text-text-muted mt-2">
                      <strong>Admin Notes:</strong> {report.adminNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default ReportDetailModal;
