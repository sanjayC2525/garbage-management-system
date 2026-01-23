import Header from '../components/Header';
import Footer from '../components/Footer';
import adminBanner from '../assets/images/admin-banner.png';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      
      {/* Header */}
      <Header />

      {/* Admin Banner */}
      <div className="relative w-full h-40 md:h-48">
        <img
          src={adminBanner}
          alt="Admin Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center px-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      {/* Page Content */}
      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminLayout;
