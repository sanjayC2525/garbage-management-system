import Header from '../components/Header';
import Footer from '../components/Footer';
// Image source: frontend/src/assets/images/worker-banner.png
// Replace this file to change worker banner without touching code
import workerBanner from '../assets/images/worker-banner.png';

const WorkerLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      {/* Global Header */}
      <Header />

      {/* Worker Banner */}
      <div className="relative">
        <img
          src={workerBanner}
          alt="Worker Dashboard Banner"
          className="w-full h-32 md:h-40 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Worker Dashboard</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default WorkerLayout;