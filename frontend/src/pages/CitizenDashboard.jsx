import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import FeedbackForm from '../components/FeedbackForm';

const CitizenDashboard = () => {
  const [activeSection, setActiveSection] = useState('reports');
  const [reports, setReports] = useState([]);
  const [issuesAndFeedback, setIssuesAndFeedback] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [formData, setFormData] = useState({
    address: '',
    garbageType: 'Dry',
    description: '',
  });
  const [issuesAndFeedbackForm, setIssuesAndFeedbackForm] = useState({
    type: 'FEEDBACK',
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    workerId: '',
  });
  const [showReportForm, setShowReportForm] = useState(false);
  const [showIssuesAndFeedbackForm, setShowIssuesAndFeedbackForm] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    photo: null,
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchReports(),
          fetchIssuesAndFeedback(),
          fetchWorkers()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.getMyGarbageReports();
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    }
  };

  const fetchIssuesAndFeedback = async () => {
    try {
      const [feedbackResponse, issuesResponse] = await Promise.all([
        api.getMyFeedback(),
        api.getMyIssues()
      ]);
      
      // Combine feedback and issues, adding a source property to distinguish them
      const combined = [
        ...feedbackResponse.data.map(item => ({ ...item, source: 'feedback' })),
        ...issuesResponse.data.map(item => ({ ...item, source: 'issue' }))
      ];
      
      // Sort by date (newest first)
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setIssuesAndFeedback(combined);
    } catch (error) {
      toast.error('Failed to fetch issues and feedback');
    }
  };

  const fetchWorkers = async () => {
    try {
      console.log('Fetching workers...');
      const response = await api.getWorkers();
      console.log('Workers response:', response.data);
      setWorkers(response.data);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
      toast.error('Failed to fetch workers');
    }
  };

  const getLocation = async () => {
    // Check if we're on HTTPS (required for geolocation in most browsers)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error('Location services require a secure connection (HTTPS). Please use HTTPS or localhost for development.');
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser. Please update your browser or use manual location entry.');
      return;
    }

    // Check if permission is already denied
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'denied') {
          toast.error('Location permission denied. Please enable location services in your browser settings and refresh the page.');
          return;
        }
      } catch (error) {
        console.log('Permissions API not supported');
      }
    }

    toast.loading('Getting your location...', { id: 'location' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setReportFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        toast.success('Location obtained successfully!', { id: 'location' });
      },
      (error) => {
        let errorMessage = '';
        let actionMessage = '';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            actionMessage = 'Please enable location services in your browser settings and refresh the page.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            actionMessage = 'Please try again or enter location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            actionMessage = 'Please try again. Make sure you\'re outdoors with a clear view of the sky.';
            break;
          default:
            errorMessage = 'Location error occurred';
            actionMessage = 'Please try again or enter location manually.';
        }

        toast.error(`${errorMessage}. ${actionMessage}`, { id: 'location', duration: 6000 });
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 30000 // Allow cached positions up to 30 seconds old
      }
    );
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('photo', reportFormData.photo);
      formDataToSend.append('latitude', reportFormData.latitude);
      formDataToSend.append('longitude', reportFormData.longitude);

      await api.createGarbageReport(formDataToSend);
      toast.success('Garbage report submitted successfully!');
      setShowReportForm(false);
      setReportFormData({ photo: null, latitude: '', longitude: '' });
      fetchReports();
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleReportChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo') {
      setReportFormData({ ...reportFormData, photo: files[0] });
    } else {
      setReportFormData({ ...reportFormData, [name]: value });
    }
  };

  const handleIssuesAndFeedbackSubmit = async (formData) => {
    console.log('Submitting form data:', formData);
    
    // Client-side validation
    if (!formData.type || !formData.title?.trim() || !formData.description?.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.title.trim().length === 0 || formData.description.trim().length === 0) {
      toast.error('Title and description cannot be empty');
      return;
    }
    
    try {
      // Use unified endpoint for both feedback and issues
      const payload = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        workerId: formData.workerId || undefined
      };
      
      console.log('Submitting to unified endpoint:', payload);
      const response = await api.createIssuesFeedback(payload);
      console.log('Submission response:', response.data);
      
      toast.success(`${formData.type === 'FEEDBACK' ? 'Feedback' : 'Issue'} submitted successfully`);
      
      setShowIssuesAndFeedbackForm(false);
      setIssuesAndFeedbackForm({
        type: 'FEEDBACK',
        title: '',
        description: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        workerId: '',
      });
      fetchIssuesAndFeedback();
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to submit. Please try again.';
      toast.error(`Submission failed: ${errorMessage}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REPORTED': return 'text-yellow-500';
      case 'APPROVED': return 'text-green-500';
      case 'REJECTED': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Citizen Dashboard</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveSection('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'reports'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                My Reports
              </button>
              <button
                onClick={() => setActiveSection('issuesAndFeedback')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'issuesAndFeedback'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Issues & Feedback
              </button>
            </nav>
          </div>

          {/* Reports Section */}
          {activeSection === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Garbage Reports</h2>
                <button
                  onClick={() => setShowReportForm(!showReportForm)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                >
                  {showReportForm ? 'Cancel' : 'Report Garbage'}
                </button>
              </div>

              {showReportForm && (
                <div className="bg-darker p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Report Garbage</h3>
                  <form onSubmit={handleReportSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Photo</label>
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleReportChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Latitude</label>
                        <input
                          type="text"
                          name="latitude"
                          value={reportFormData.latitude}
                          onChange={handleReportChange}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Auto-filled or enter manually"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Longitude</label>
                        <input
                          type="text"
                          name="longitude"
                          value={reportFormData.longitude}
                          onChange={handleReportChange}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Auto-filled or enter manually"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={getLocation}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md mr-2 transition duration-200"
                      >
                        📍 Get Current Location
                      </button>
                      {location.lat && location.lng && (
                        <span className="text-green-400 text-sm">
                          Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition duration-200"
                        disabled={loading}
                      >
                        {loading ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* My Reports */}
              <div className="bg-darker rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <h3 className="text-xl font-bold">My Reports</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Photo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {reports.map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img src={`http://localhost:5001${report.imagePath}`} alt="Garbage" className="w-16 h-16 object-cover rounded" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</div>
                              <a
                                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs"
                              >
                                View on Map
                              </a>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-medium ${getStatusColor(report.status)}`}>{report.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reports.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-400">
                      No reports submitted yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Issues & Feedback Section */}
          {activeSection === 'issuesAndFeedback' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Issues & Feedback</h2>
                <button
                  onClick={() => setShowIssuesAndFeedbackForm(!showIssuesAndFeedbackForm)}
                  className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                >
                  {showIssuesAndFeedbackForm ? 'Cancel' : 'Submit Issue/Feedback'}
                </button>
              </div>

              {showIssuesAndFeedbackForm && (
                <FeedbackForm
                  onSubmit={handleIssuesAndFeedbackSubmit}
                  onCancel={() => setShowIssuesAndFeedbackForm(false)}
                  workers={workers}
                  showTypeSelector={true}
                />
              )}

              {/* My Issues & Feedback */}
              <div className="bg-surface rounded-lg overflow-hidden border border-border">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-xl font-bold text-text-primary">My Issues & Feedback</h3>
                </div>
                <div className="p-6 space-y-4">
                  {issuesAndFeedback.map((item) => (
                    <div key={item.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-primary">{item.title}</h4>
                          <p className="text-sm text-text-muted">
                            {item.source === 'feedback' ? 'Feedback' : 'Issue'} - {item.type} - {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded ${
                            item.status === 'RESOLVED' ? 'bg-status-success/20 text-status-success' :
                            item.status === 'IN_PROGRESS' || item.status === 'IN_REVIEW' ? 'bg-status-warning/20 text-status-warning' :
                            item.status === 'REJECTED' ? 'bg-status-error/20 text-status-error' :
                            'bg-surfaceLight text-text-muted'
                          }`}>
                            {item.status}
                          </span>
                          <p className="text-xs text-text-muted mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-text-secondary mb-2">{item.description}</p>
                      {item.adminReply && (
                        <div className="bg-status-info/10 border border-status-info/30 p-3 rounded mb-2">
                          <p className="text-sm text-status-info font-medium mb-1">Admin Reply:</p>
                          <p className="text-text-secondary">{item.adminReply}</p>
                          {item.admin?.name && (
                            <p className="text-xs text-text-muted mt-2">- {item.admin.name}</p>
                          )}
                        </div>
                      )}
                      {item.resolution && (
                        <div className="bg-status-success/10 border border-status-success/30 p-3 rounded mb-2">
                          <p className="text-sm text-status-success font-medium mb-1">Resolution:</p>
                          <p className="text-text-secondary">{item.resolution}</p>
                        </div>
                      )}
                      {item.adminNotes && (
                        <div className="bg-surfaceLight p-3 rounded">
                          <p className="text-sm text-text-muted">Internal Notes:</p>
                          <p className="text-text-secondary">{item.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {issuesAndFeedback.length === 0 && (
                    <div className="text-center text-text-muted py-8">
                      No issues or feedback submitted yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CitizenDashboard;
