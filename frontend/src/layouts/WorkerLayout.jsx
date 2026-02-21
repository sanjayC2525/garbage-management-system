import UnifiedBanner from '../components/UnifiedBanner';

const WorkerLayout = ({ children }) => {
  return (
    <UnifiedBanner>
      {children}
    </UnifiedBanner>
  );
};

export default WorkerLayout;