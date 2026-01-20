import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const CitizenDashboard = ({ user, setUser }) => {
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    garbageType: 'Dry',
    pickupDate: '',
  });
  const [reportFormData, setReportFormData] = useState({
    photo: null,
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchReports();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.getPickupRequests();
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch requests');
    }
  };

  const fetchReports = async () => {
    // For now, since no API to get citizen's reports, we'll skip or add later if needed
    // setReports(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createPickupRequest(formData);
      toast.success('Pickup request submitted successfully!');
      setShowForm(false);
      setFormData({ address: '', garbageType: 'Dry', pickupDate: '' });
      fetchRequests();
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
    switch (status) {
      case 'Pending': return 'text-yellow-500';
      case 'Assigned': return 'text-blue-500';
      case 'Collected': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Citizen Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            {showForm ? 'Cancel' : 'New Request'}
          </button>
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            {showReportForm ? 'Cancel' : 'Report Garbage'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-darker p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Submit Pickup Request</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Garbage Type</label>
                <select
                  name="garbageType"
                  value={formData.garbageType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Dry">Dry</option>
                  <option value="Wet">Wet</option>
                  <option value="E-waste">E-waste</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Preferred Pickup Date</label>
              <input
                type="date"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {showReportForm && (
        <div className="bg-darker p-6 rounded-lg mb-6">
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

      <div className="bg-darker rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">My Pickup Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{request.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.garbageType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(request.pickupDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${getStatusColor(request.status)}`}>{request.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;