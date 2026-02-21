import UnifiedBanner from '../components/UnifiedBanner';

const AdminLayout = ({ children }) => {
  return (
    <UnifiedBanner>
      {children}
    </UnifiedBanner>
  );
};

export default AdminLayout;
