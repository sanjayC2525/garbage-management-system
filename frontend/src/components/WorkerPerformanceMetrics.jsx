import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const WorkerPerformanceMetrics = ({ workerId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30'); // days

  useEffect(() => {
    fetchMetrics();
  }, [workerId, timeframe]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.getAnalytics(timeframe);
      const workerData = response.data.workers.find(w => w.id === workerId);
      
      if (workerData) {
        setMetrics(workerData);
      } else {
        setMetrics(null);
      }
    } catch (error) {
      toast.error('Failed to fetch worker metrics');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceLevel = (efficiency) => {
    if (efficiency >= 90) return { level: 'Excellent', color: 'text-green-400', bg: 'bg-green-900' };
    if (efficiency >= 75) return { level: 'Good', color: 'text-blue-400', bg: 'bg-blue-900' };
    if (efficiency >= 60) return { level: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-900' };
    return { level: 'Needs Improvement', color: 'text-red-400', bg: 'bg-red-900' };
  };

  const getCompletionRate = (completed, total) => {
    return total > 0 ? (completed / total * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <div className="bg-darker rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-darker rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <p className="text-gray-400">No performance data available for this worker.</p>
      </div>
    );
  }

  const performance = getPerformanceLevel(parseFloat(metrics.efficiency));
  const completionRate = getCompletionRate(metrics.completed, metrics.totalTasks);

  return (
    <div className="bg-darker rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Performance Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Performance</span>
          <span className={`px-2 py-1 text-xs rounded ${performance.bg} ${performance.color}`}>
            {performance.level}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-status-success h-2 rounded-full transition-all duration-500"
            style={{ width: `${metrics.efficiency}%` }}
          ></div>
        </div>
        <p className="text-sm text-text-muted mt-1">{metrics.efficiency}% Efficiency</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <p className="text-sm text-text-muted mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-text-primary">{metrics.totalTasks}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <p className="text-sm text-text-muted mb-1">Completed</p>
          <p className="text-2xl font-bold text-status-success">{metrics.completed}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <p className="text-sm text-text-muted mb-1">In Progress</p>
          <p className="text-2xl font-bold text-status-warning">{metrics.inProgress}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <p className="text-sm text-text-muted mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-text-primary">{getCompletionRate(metrics.completed, metrics.totalTasks)}%</p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Completion Rate</span>
          <span className="text-sm font-medium text-text-primary">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-status-success h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Avg. Completion Time</span>
          <span className="text-sm font-medium text-text-primary">{metrics.avgCompletionTime} hours</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Task Acceptance Rate</span>
          <span className="text-sm font-medium text-text-primary">
            {metrics.totalTasks > 0 ? ((metrics.accepted / metrics.totalTasks) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Unable Rate</span>
          <span className="text-sm font-medium text-status-error">
            {metrics.totalTasks > 0 ? ((metrics.unable / metrics.totalTasks) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* Performance Trends */}
      {metrics.totalTasks > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium mb-3 text-text-primary">Performance Insights</h4>
          <div className="space-y-2">
            {parseFloat(metrics.efficiency) >= 90 && (
              <div className="flex items-center text-status-success text-sm">
                <span className="mr-2">🌟</span>
                <span>Top performer with excellent efficiency</span>
              </div>
            )}
            {parseFloat(metrics.avgCompletionTime) < 2 && (
              <div className="flex items-center text-status-info text-sm">
                <span className="mr-2">⚡</span>
                <span>Fast completion times</span>
              </div>
            )}
            {metrics.unable === 0 && metrics.totalTasks > 5 && (
              <div className="flex items-center text-status-success text-sm">
                <span className="mr-2">✅</span>
                <span>Perfect task completion record</span>
              </div>
            )}
            {parseFloat(metrics.efficiency) < 60 && (
              <div className="flex items-center text-status-warning text-sm">
                <span className="mr-2">📈</span>
                <span>Consider reviewing task assignments</span>
              </div>
            )}
            {metrics.unable > metrics.completed && (
              <div className="flex items-center text-status-error text-sm">
                <span className="mr-2">⚠️</span>
                <span>High unable rate - review workload</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPerformanceMetrics;
