import UnifiedBanner from '../components/UnifiedBanner';

const CitizenLayout = ({ children }) => {
  return (
    <UnifiedBanner>
      {children}
    </UnifiedBanner>
  );
};

export default CitizenLayout;