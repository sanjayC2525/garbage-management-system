import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const CitizenDashboard = () => {
  const [reports, setReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    photo: null,
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.getMyGarbageReports();
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    }
  };

  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReportFormData({
            ...reportFormData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          setLocationLoading(false);
          toast.success('Location captured!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get location. Please enter manually.');
          setLocationLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
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
        <button
          onClick={() => setShowReportForm(!showReportForm)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
        >
          {showReportForm ? 'Cancel' : 'Report Garbage'}
        </button>
      </div>

      {/* Report Garbage Form */}
      {showReportForm && (
        <div className="bg-darker p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Report Garbage</h2>
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
                  placeholder="e.g., 12.9716"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                  placeholder="e.g., 77.5946"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <button
                type="button"
                onClick={getLocation}
                disabled={locationLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
              >
                {locationLoading ? 'Getting Location...' : 'Get Current Location'}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}

      {/* My Reports */}
      <div className="bg-darker rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">My Garbage Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
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
  );
};

export default CitizenDashboard;