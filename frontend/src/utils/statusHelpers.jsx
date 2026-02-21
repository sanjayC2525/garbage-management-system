// Premium status configuration with modern design system
export const STATUS_CONFIG = {
  REPORTED: {
    label: 'Reported',
    color: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
    textColor: 'text-status-warning',
    icon: '📝'
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-status-success/10 text-status-success border border-status-success/20',
    textColor: 'text-status-success',
    icon: '✅'
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'bg-primary/10 text-primary border border-primary/20',
    textColor: 'text-primary',
    icon: '👷'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-status-info/10 text-status-info border border-status-info/20',
    textColor: 'text-status-info',
    icon: '🔄'
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-status-success text-text-inverse',
    textColor: 'text-text-inverse',
    icon: '✅'
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-status-error/10 text-status-error border border-status-error/20',
    textColor: 'text-status-error',
    icon: '❌'
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
    textColor: 'text-status-warning',
    icon: '⏳'
  },
  COLLECTED: {
    label: 'Collected',
    color: 'bg-status-success text-text-inverse',
    textColor: 'text-text-inverse',
    icon: '✅'
  }
};

// Garbage type icons with consistent styling
export const GARBAGE_TYPE_ICONS = {
  'dry': '📦',
  'wet': '💧',
  'e-waste': '�',
  'hazardous': '⚠️',
  'organic': '🌿',
  'recyclable': '♻️',
  'mixed': '�️'
};

// Modern status badge component
export const getStatusBadge = (status) => {
  const config = STATUS_CONFIG[status];
  if (!config) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface text-text-muted">
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-200 ${config.color}`}>
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Date formatting with premium styling
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Timeline formatting with modern design
export const formatTimelineEntry = (entry) => {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-xl bg-surface border-border">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        <span className="text-primary text-sm font-medium">{STATUS_CONFIG[entry.status]?.icon || '📋'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-text-primary font-medium">{entry.status}</div>
        <div className="text-text-secondary text-sm">{entry.note}</div>
        <div className="text-text-muted text-xs">{formatDateTime(entry.timestamp)}</div>
      </div>
    </div>
  );
};

// Worker statistics with modern styling
export const calculateWorkerStats = (tasks) => {
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const assigned = tasks.filter(t => t.status === 'ASSIGNED').length;
  
  const efficiency = assigned > 0 ? (completed / assigned) * 100 : 0;
  
  return {
    total: tasks.length,
    completed,
    inProgress,
    assigned,
    efficiency: Math.round(efficiency)
  };
};
